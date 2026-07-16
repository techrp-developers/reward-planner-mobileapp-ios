import React, { memo, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// ─── Types ────────────────────────────────────────────────────────────────────

type SpecRow = { label: string; value: string };
type SpecGroup = { title: string; rows: SpecRow[] };

type Props = {
  productDescription?: string;
  brandDescription?: string;
  variantSpecs?: SpecRow[];
  product?: any;
  selectedVariant?: any;
};

// ─── Label dictionary ─────────────────────────────────────────────────────────

const LABEL_MAP: Record<string, string> = {
  noise_cancellation: "Noise Cancellation",
  mic_available: "Mic Available",
  battery_life: "Battery Life",
  dimensions: "Dimensions",
  weight: "Weight",
  color: "Colour",
  colour: "Colour",
  model_number: "Model Number",
  model_name: "Model Name",
  warranty_description: "Warranty",
  country_of_origin: "Country Of Origin",
  type: "Type",
  brand_name: "Brand",
  manufacturer: "Manufacturer",
  vendor_name: "Vendor",
  category_name: "Category",
  subcategory_name: "Subcategory",
  sub_subcategory_name: "Product Type",
  sku: "SKU",
  length: "Length",
  breadth: "Breadth",
  height: "Height",
  connectivity: "Connectivity",
  bluetooth_version: "Bluetooth Version",
  driver_size: "Driver Size",
  charging_time: "Charging Time",
  playback_time: "Playback Time",
  standby_time: "Standby Time",
  charging_type: "Charging Type",
  touch_control: "Touch Control",
  water_resistance: "Water Resistance",
  frequency_response: "Frequency Response",
  impedance: "Impedance",
};

const toLabel = (raw: string): string => {
  const stripped = raw.replace(/\d+$/, "").toLowerCase();
  const fromStripped = LABEL_MAP[stripped];
  if (fromStripped) return fromStripped;
  const direct = LABEL_MAP[raw.toLowerCase()];
  if (direct) return direct;
  return stripped
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
};

// ─── Key bucket definitions ───────────────────────────────────────────────────

const GENERAL_KEYS    = ["brand_name", "manufacturer", "vendor_name"];
const CATEGORY_KEYS   = ["category_name", "subcategory_name", "sub_subcategory_name"];
const DIMENSION_KEYS  = ["weight", "dimensions"];
const VARIANT_KEYS    = ["colour1", "color1", "colour", "color", "sku"];
const ADDITIONAL_KEYS = ["country_of_origin", "warranty_description", "model_name", "model_number"];

const ALL_BUCKETED = new Set([
  ...GENERAL_KEYS,
  ...CATEGORY_KEYS,
  ...DIMENSION_KEYS,
  "length", "breadth", "height",
  ...VARIANT_KEYS,
  ...ADDITIONAL_KEYS,
]);

// ─── Spec builder (pure, memoizable) ─────────────────────────────────────────

const buildSpecs = (product: any, selectedVariant: any): SpecGroup[] => {
  if (!product) return [];

  const str = (v: unknown): string => {
    if (v == null) return "";
    if (Array.isArray(v)) return v.filter(Boolean).map(String).join(", ").trim();
    return String(v).trim();
  };

  const flat: Record<string, string> = {};
  const put = (key: string, val: unknown, force = false) => {
    const v = str(val);
    if (v && (force || !flat[key])) flat[key] = v;
  };

  // Attribute sources — increasing specificity
  for (const [k, v] of Object.entries(product.product_attributes ?? {})) put(k, v);
  for (const [k, v] of Object.entries(product.attributes ?? {})) put(k, v);
  for (const [k, v] of Object.entries(selectedVariant?.variant_attributes ?? {})) put(k, v, true);

  // Top-level product scalars
  put("vendor_name",           product.vendor_name);
  put("manufacturer",          product.manufacturer);
  put("brand_name",            product.brand_name);
  put("category_name",         product.category_name);
  put("subcategory_name",      product.subcategory_name);
  put("sub_subcategory_name",  product.sub_subcategory_name);
  put("country_of_origin",     product.country_of_origin);
  put("warranty_description",  product.warranty_description);
  put("model_name",            product.model_name);
  put("model_number",          product.model_number);

  // Variant scalars (authoritative — always overwrite)
  put("sku",     selectedVariant?.sku,                      true);
  put("weight",  selectedVariant?.weight ?? product.weight, true);
  put("length",  selectedVariant?.length,                   true);
  put("breadth", selectedVariant?.breadth,                  true);
  put("height",  selectedVariant?.height,                   true);

  // Compute combined dimensions when not already provided
  if (!flat.dimensions && flat.length && flat.breadth && flat.height) {
    flat.dimensions = `${flat.length} × ${flat.breadth} × ${flat.height}`;
  }

  // Build rows from a key list, deduplicating by resolved label
  const rows = (keys: string[]): SpecRow[] => {
    const seen = new Set<string>();
    return keys.flatMap((k) => {
      const v = flat[k];
      if (!v) return [];
      const label = toLabel(k);
      if (seen.has(label)) return [];
      seen.add(label);
      return [{ label, value: v }];
    });
  };

  // Dynamic rows — keys that didn't match any known bucket
  const dynamicRows: SpecRow[] = Object.keys(flat)
    .filter((k) => !ALL_BUCKETED.has(k))
    .map((k) => ({ label: toLabel(k), value: flat[k] }));

  const groups: SpecGroup[] = [
    { title: "General",                rows: rows(GENERAL_KEYS) },
    { title: "Category Information",   rows: rows(CATEGORY_KEYS) },
    ...(dynamicRows.length ? [{ title: "Features", rows: dynamicRows }] : []),
    { title: "Physical Dimensions",    rows: rows(DIMENSION_KEYS) },
    { title: "Variant Details",        rows: rows(VARIANT_KEYS) },
    { title: "Additional Information", rows: rows(ADDITIONAL_KEYS) },
  ];

  return groups.filter((g) => g.rows.length > 0);
};

// ─── SpecGroupView ────────────────────────────────────────────────────────────

const SpecGroupView = memo(({ group }: { group: SpecGroup }) => (
  <View style={styles.specGroup}>
    <Text style={styles.specGroupTitle}>{group.title}</Text>
    {group.rows.map((row, i) => (
      <View
        key={`${row.label}-${i}`}
        style={[styles.specRow, i % 2 === 1 && styles.specRowAlt]}
      >
        <Text style={styles.specLabel}>{row.label}</Text>
        <Text style={styles.specValue}>{row.value}</Text>
      </View>
    ))}
  </View>
));

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = ["Specifications", "Product Info", "About Brand"] as const;
type TabKey = typeof TABS[number];

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProductInfoAccordions({
  productDescription,
  brandDescription,
  product,
  selectedVariant,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("Specifications");

  const specGroups = useMemo(
    () => buildSpecs(product, selectedVariant),
    [product, selectedVariant],
  );

  const normalizeText = (val?: string) =>
    String(val ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const toPoints = (val?: string, fallback: string[] = []) => {
    const text = normalizeText(val);
    if (!text) return fallback;
    const parts = text
      .split(/\n|\r|\.|•|•|-\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length ? parts : [text];
  };

  const productPoints = toPoints(productDescription, ["No product information available"]);
  const brandPoints   = toPoints(brandDescription,   ["No brand information available"]);

  return (
    <View style={styles.wrap}>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarInner}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.75}
              onPress={() => setActiveTab(tab)}
              style={styles.tab}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Content area ────────────────────────────────────────────────────── */}
      <View style={styles.contentArea}>

        {activeTab === "Specifications" && (
          specGroups.length > 0 ? (
            <View>
              {specGroups.map((g) => (
                <SpecGroupView key={g.title} group={g} />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No specifications available</Text>
          )
        )}

        {activeTab === "Product Info" && (
          <View>
            {productPoints.map((t, i) => (
              <View key={i} style={styles.pointRow}>
                <MaterialIcons
                  name="check-circle"
                  size={15}
                  color="#22C55E"
                  style={styles.pointIcon}
                />
                <Text style={styles.pointText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === "About Brand" && (
          <View>
            {brandPoints.map((t, i) => (
              <View key={i} style={styles.pointRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.pointText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    marginHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    overflow: "hidden",
    // elevation: 2,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 4,
  },

  // ── Tab bar ──────────────────────────────────────────────────────────────────
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  tabBarInner: {
    paddingHorizontal: 14,
  },
  tab: {
    paddingVertical: 13,
    marginRight: 22,
    position: "relative",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  tabTextActive: {
    color: "#7C3AED",
    fontWeight: "800",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#7C3AED",
  },

  // ── Content area ─────────────────────────────────────────────────────────────
  contentArea: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
  },

  emptyText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    paddingVertical: 24,
  },

  // ── Spec groups (Flipkart-style) ──────────────────────────────────────────────
  specGroup: {
    marginBottom: 18,
  },
  specGroupTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7C3AED",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 6,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBFF",
  },
  specRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
  specRowAlt: {
    backgroundColor: "#F9F8FF",
  },
  specLabel: {
    flex: 1.3,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    lineHeight: 17,
  },
  specValue: {
    flex: 1.7,
    fontSize: 12,
    color: "#111827",
    fontWeight: "700",
    lineHeight: 17,
  },

  // ── Bullet / check point rows ─────────────────────────────────────────────────
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 5,
  },
  pointIcon: {
    marginTop: 1,
  },
  pointText: {
    flex: 1,
    fontSize: 12,
    color: "#333",
    lineHeight: 17,
  },
  bulletDot: {
    fontSize: 17,
    lineHeight: 19,
    color: "#555",
    marginTop: -1,
  },
});
