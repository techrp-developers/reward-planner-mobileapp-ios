#!/usr/bin/env node
/**
 * Validates translations. Exits non-zero when:
 *  - hi/mr are missing a key that exists in English (or have unknown extras),
 *  - a translation drops or renames a {{variable}} or <tag>,
 *  - code calls t("ns:key") for a key that does not exist in English.
 * Usage: node scripts/check-i18n.cjs
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const problems = [];

const ROOT = path.resolve(__dirname, "..");
const LOCALES = path.join(ROOT, "src/i18n/locales");
const SOURCE = "en";
const PLURAL = /_(zero|one|two|few|many|other)$/;

function flatten(object, prefix = "", out = {}) {
  if (!object || typeof object !== "object") {
    problems.push(`${prefix}: expected a translation object`);
    return out;
  }
  for (const [key, value] of Object.entries(object)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") flatten(value, full, out);
    else if (typeof value !== "string" || !value.trim()) problems.push(`${full}: expected a nonempty string`);
    else out[full] = value;
  }
  return out;
}

function readResource(file) {
  const text = fs.readFileSync(file, "utf8");
  const ast = ts.parseJsonText(file, text);
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const seen = new Set();
      for (const property of node.properties) {
        const name = property.name?.text;
        if (seen.has(name)) problems.push(`${path.relative(ROOT, file)}: duplicate key "${name}"`);
        seen.add(name);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  try {
    const resource = JSON.parse(text);
    if (!resource || typeof resource !== "object" || Array.isArray(resource)) {
      problems.push(`${path.relative(ROOT, file)}: resource root must be an object`);
      return {};
    }
    return flatten(resource);
  }
  catch (error) { problems.push(`${path.relative(ROOT, file)}: ${error.message}`); return {}; }
}

const tokens = (text) =>
  [...text.matchAll(/\{\{\s*-?\s*([\w.]+)(?:\s*,[^{}]+)?\s*\}\}|<\/?(\w+)>/g)].map((m) => m[1] || `<${m[2]}>`).sort().join(",");

const languages = fs.readdirSync(LOCALES).filter((name) => fs.statSync(path.join(LOCALES, name)).isDirectory());
const namespaces = fs.readdirSync(path.join(LOCALES, SOURCE)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
const load = (lang, ns) => {
  const file = path.join(LOCALES, lang, `${ns}.json`);
  return fs.existsSync(file) ? readResource(file) : null;
};

const english = {};
for (const language of ["en", "hi", "mr"]) {
  if (!languages.includes(language)) problems.push(`Missing language directory: ${language}`);
}
for (const language of languages) {
  if (!["en", "hi", "mr"].includes(language)) problems.push(`Unsupported language: ${language}`);
  for (const file of fs.readdirSync(path.join(LOCALES, language))) {
    if (!namespaces.includes(file.replace(/\.json$/, ""))) problems.push(`${language}: unexpected resource ${file}`);
  }
}
const config = fs.readFileSync(path.join(ROOT, "src/i18n/index.ts"), "utf8");
const languageConfig = fs.readFileSync(path.join(ROOT, "src/i18n/languages.ts"), "utf8");
if (!/fallbackLng:\s*DEFAULT_LANGUAGE/.test(config) || !/DEFAULT_LANGUAGE[^=]*=\s*["']en["']/.test(languageConfig)) {
  problems.push("English must be configured as the fallback language");
}
for (const ns of namespaces) {
  english[ns] = load(SOURCE, ns);
  for (const lang of languages.filter((l) => l !== SOURCE)) {
    const target = load(lang, ns);
    if (!target) { problems.push(`${lang}/${ns}.json is missing`); continue; }
    for (const [key, value] of Object.entries(english[ns])) {
      if (!(key in target)) problems.push(`${lang}/${ns}: missing "${key}"`);
      else if (!target[key].trim()) problems.push(`${lang}/${ns}: empty "${key}"`);
      else if (tokens(value) !== tokens(target[key])) problems.push(`${lang}/${ns}: placeholders differ in "${key}"`);
    }
    const categories = new Set(new Intl.PluralRules(lang).resolvedOptions().pluralCategories);
    for (const key of Object.keys(target)) {
      const suffix = key.match(PLURAL)?.[1];
      if (suffix && !categories.has(suffix) && suffix !== "zero") problems.push(`${lang}/${ns}: invalid plural category in "${key}"`);
      if (suffix) {
        const base = key.replace(PLURAL, "");
        for (const category of categories) {
          if (!(`${base}_${category}` in target)) problems.push(`${lang}/${ns}: missing plural "${base}_${category}"`);
        }
      }
    }
    for (const key of Object.keys(target))
      if (!(key in english[ns])) problems.push(`${lang}/${ns}: unknown key "${key}"`);
  }
}

// Every t("ns:key") in the code must exist in English (base key, for plurals).
const known = new Set();
for (const ns of namespaces)
  for (const key of Object.keys(english[ns])) {
    known.add(`${ns}:${key}`);
    known.add(`${ns}:${key.replace(PLURAL, "")}`);
  }
function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) { if (!/node_modules|locales/.test(full)) walk(full, files); }
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(full);
  }
  return files;
}
let usages = 0;
for (const file of walk(path.join(ROOT, "src"))) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/\b(?:t|tr|tx|i18n\.t|i18nKey=)\(?\s*["'`]([a-zA-Z]+):([\w.]+)["'`]/g)) {
    usages++;
    const id = `${match[1]}:${match[2]}`;
    if (!known.has(id)) problems.push(`${path.relative(ROOT, file)}: unknown key "${id}"`);
  }
}

if (problems.length) {
  console.error(`i18n check failed (${problems.length}):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`i18n OK: ${namespaces.length} namespaces × ${languages.length} languages, ${usages} key usages checked.`);
