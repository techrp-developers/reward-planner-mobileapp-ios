// Run with `node scripts/chatSocketSmokeTest.cjs` in a project where `typescript` is installed.
// This is a deterministic client-only smoke test; not a backend integration test.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const instances = [];
const appListeners = new Set();
const timeouts = new Map();
let nextTimer = 1;
const networkListeners = new Set();
let expiring = false;
let refreshCredentials = async () => [];
let authToken = "test-token";

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  constructor(url) {
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    this.sent = [];
    instances.push(this);
  }
  open() { this.readyState = FakeWebSocket.OPEN; this.onopen?.(); }
  send(payload) { this.sent.push(JSON.parse(payload)); }
  message(event) { this.onmessage?.({ data: JSON.stringify(event) }); }
  close() {
    if (this.readyState === FakeWebSocket.CLOSED) return;
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code: 1000, reason: "closed" });
  }
}
const AppState = {
  currentState: "active",
  addEventListener: (_, listener) => {
    appListeners.add(listener);
    return { remove: () => appListeners.delete(listener) };
  },
};
const code = fs.readFileSync(path.join(__dirname, "../src/modules/chat/services/chatSocket.ts"), "utf8");
const compiled = ts.transpileModule(code, {
  fileName: "chatSocket.ts",
  compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.CommonJS },
}).outputText;
const mod = { exports: {} };
const fakeRequire = (name) => {
  if (name === "@react-native-community/netinfo") return { default: { addEventListener: listener => { networkListeners.add(listener); return () => networkListeners.delete(listener); } } };
  if (name === "react-native") return { AppState };
  if (name.endsWith("AuthAPI")) return { getAuthToken: () => authToken };
  if (name.endsWith("jwtUtils")) return { isTokenExpiringSoon: () => expiring };
  if (name.endsWith("apiConfig")) return { CHAT_SERVER_URL: "https://chat.example.test" };
  if (name.endsWith("chatApi")) return { fetchConversations: () => refreshCredentials() };
  throw new Error("Unexpected import: " + name);
};
vm.runInNewContext(compiled, {
  exports: mod.exports, module: mod, require: fakeRequire, WebSocket: FakeWebSocket,
  __DEV__: false, console,
  setTimeout: (fn, delay) => { const id = nextTimer++; timeouts.set(id, { fn, delay }); return id; },
  clearTimeout: (id) => timeouts.delete(id),
  Math,
});
const { ChatSocketClient } = mod.exports;
const client = new ChatSocketClient();
const events = [];
client.subscribe(event => events.push(event));

(async () => {
  assert.equal(client.ensureConnected(), true);
  assert.equal(instances.length, 1);
  assert.equal(instances[0].url, "wss://chat.example.test/ws/chat?token=test-token");
  client.ensureConnected();
  assert.equal(instances.length, 1, "connect() must be idempotent");
  instances[0].open();
  assert.equal(client.isConnected(), true);
  assert(events.some(e => e.type === "resync"), "onopen should prompt REST reconciliation");
  instances[0].message({ type: "message:new", data: { message_id: 1, conversation_id: 7 } });
  assert(events.some(e => e.type === "message:new"), "incoming message must reach subscribers");
  assert(client.send("typing:start", 7));
  assert.equal(instances[0].sent.at(-1).conversation_id, 7);
  instances[0].message({ type: "ping", data: null });
  assert.equal(instances[0].sent.at(-1).type, "pong");

  // Mobile foreground resume must reconnect after socket was closed on background.
  AppState.currentState = "background";
  for (const callback of appListeners) callback("background");
  assert.equal(client.isConnected(), false);
  AppState.currentState = "active";
  for (const callback of appListeners) callback("active");
  await Promise.resolve(); await Promise.resolve();
  assert.equal(instances.length, 2);
  instances[1].open();
  assert.equal(client.isConnected(), true);

  // Updating credentials must close the old connection and open only one new one.
  authToken = "rotated-token";
  client.ensureConnected();
  assert.equal(instances.length, 3);
  assert.match(instances[2].url, /rotated-token/);
  instances[2].open();
  // A throwing UI listener cannot prevent other subscribers receiving events.
  const stopBad = client.subscribe(() => { throw new Error("broken subscriber"); });
  instances[2].message({ type: "message:read", data: { conversation_id: 7 } });
  assert(events.some(event => event.type === "message:read"));
  stopBad();

  // Restore connectivity immediately, including when a socket still appeared OPEN.
  for (const callback of networkListeners) callback({ isConnected: false });
  assert.equal(client.isConnected(), false);
  for (const callback of networkListeners) callback({ isConnected: true });
  assert.equal(instances.length, 4);
  instances[3].open();

  // A handshake timeout must recover even if close() never emits onclose.
  instances[3].close();
  const retry = [...timeouts.entries()].find(([, timer]) => timer.delay < 12000);
  assert(retry, "disconnect schedules a backoff retry");
  client.ensureConnected();
  assert.equal(instances.length, 4, "ensureConnected must preserve backoff");
  timeouts.delete(retry[0]); retry[1].fn();
  assert.equal(instances.length, 5);
  instances[4].close = () => { instances[4].readyState = FakeWebSocket.CLOSING; };
  const handshake = [...timeouts.entries()].find(([, timer]) => timer.delay === 12000);
  assert(handshake);
  timeouts.delete(handshake[0]); handshake[1].fn();
  assert([...timeouts.values()].some(timer => timer.delay < 12000));

  client.disconnect();
  assert.equal(timeouts.size, 0, "logout clears retries and handshake timers");
  assert.equal(networkListeners.size, 0);
  assert.equal(client.isConnected(), false);
  assert.equal(appListeners.size, 0);
  // A credential refresh completing after sign-out cannot reopen the old session.
  expiring = true;
  let finishRefresh;
  refreshCredentials = () => new Promise(resolve => { finishRefresh = resolve; });
  client.ensureConnected();
  const beforeLogout = instances.length;
  client.disconnect();
  finishRefresh([]);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(instances.length, beforeLogout);
  assert.equal(appListeners.size, 0);
  console.log("PASS: connection, delivery, ping, resume, token rotation, listener isolation, network recovery, backoff, handshake timeout, logout/refresh race");
})().catch(error => { console.error(error); process.exitCode = 1; });
