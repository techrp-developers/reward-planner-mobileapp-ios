import { Platform } from "react-native";

// Production is fronted by a reverse proxy that adds this prefix before
// forwarding to the Express app — every other working module in this app
// (bbps, ecommerce, services, dashboard) already depends on it, so it must
// stay untouched here.
const PROD_BASE_URL = "https://rewardplanners.com/api/crm";

// The local dev backend has no such proxy in front of it — it mounts
// routes at bare /v1/auth/... directly. For Android emulator testing, the
// correct host is 10.0.2.2; for a real phone on Wi‑Fi, switch
// USE_PHYSICAL_DEVICE to true and set PHYSICAL_DEVICE_LAN_IP to your dev
// machine's LAN IP. Do not use localhost from a device; it points to the
// device itself, not the backend machine.
const USE_PHYSICAL_DEVICE = true;
const PHYSICAL_DEVICE_LAN_IP = "192.168.1.133";
const LOCAL_PORT = 5000;

const resolveDevBaseUrl = () => {
  if (USE_PHYSICAL_DEVICE) {
    return `http://${PHYSICAL_DEVICE_LAN_IP}:${LOCAL_PORT}`;
  }
  if (Platform.OS === "android") {
    // 10.0.2.2 is the Android emulator's alias for the host machine's localhost.
    return `http://10.0.2.2:${LOCAL_PORT}`;
  }
  // iOS Simulator shares the host's network namespace — localhost works directly.
  return `http://localhost:${LOCAL_PORT}`;
};

export const API_BASE_URL = __DEV__ ? resolveDevBaseUrl() : PROD_BASE_URL;
