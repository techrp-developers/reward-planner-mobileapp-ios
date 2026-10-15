import type {
  BusOrderStatus,
  BusOrderSummary,
} from "../services/busBookingApi";

export type BusOrderStatusTone = "success" | "warning" | "error" | "neutral";

// The backend sends "YYYY-MM-DD HH:mm:ss" in the journey's local time. Parse
// the parts directly so the device's timezone or JS engine never shifts them.
export const parseBusDateTime = (value?: string | null): Date | null => {
  const match = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/
  );

  if (!match) {
    return null;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] || 0),
    Number(match[5] || 0)
  );

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatBusDate = (value?: string | null) => {
  const date = parseBusDateTime(value);

  return date
    ? date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
};

export const formatBusTime = (value?: string | null) => {
  const match = String(value || "").match(/[T ](\d{2}):(\d{2})/);

  return match ? `${match[1]}:${match[2]}` : "--:--";
};

export const formatBusAmount = (value?: number | null) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export const getBusOrderStatus = (
  status: BusOrderStatus,
  paymentStatus: BusOrderSummary["paymentStatus"]
): { label: string; tone: BusOrderStatusTone } => {
  switch (status) {
    case "confirmed":
      return { label: "Confirmed", tone: "success" };
    case "cancelled":
      return { label: "Cancelled", tone: "neutral" };
    case "booking_failed":
      return {
        label: paymentStatus === "refunded" ? "Failed - Refunded" : "Failed - Refund in progress",
        tone: "error",
      };
    case "payment_success":
    case "booking_in_progress":
    case "booking_review":
      return { label: "Confirming ticket", tone: "warning" };
    case "expired":
      return { label: "Expired", tone: "neutral" };
    default:
      return { label: "Payment pending", tone: "warning" };
  }
};

export const BUS_STATUS_COLORS: Record<
  BusOrderStatusTone,
  { text: string; background: string }
> = {
  success: { text: "#0F8A4B", background: "#E8F8EF" },
  warning: { text: "#C77900", background: "#FFF3E0" },
  error: { text: "#C81E3A", background: "#FDECEF" },
  neutral: { text: "#66616D", background: "#F1F0F3" },
};

// The next trip the customer will actually take: confirmed and not departed.
export const findNextBusJourney = (
  orders: BusOrderSummary[],
  now: Date = new Date()
): BusOrderSummary | null => {
  let next: BusOrderSummary | null = null;
  let nextTime = Infinity;

  for (const order of orders) {
    if (order.status !== "confirmed") {
      continue;
    }

    const departure = parseBusDateTime(order.departureTime || order.journeyDate);
    const time = departure?.getTime();

    if (time && time >= now.getTime() && time < nextTime) {
      next = order;
      nextTime = time;
    }
  }

  return next;
};

// "TODAY" / "TOMORROW" / "14 OCT" for the journey badge.
export const getBusJourneyDayLabel = (
  value?: string | null,
  now: Date = new Date()
) => {
  const date = parseBusDateTime(value);

  if (!date) {
    return "";
  }

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);

  if (days === 0) {
    return "TODAY";
  }

  if (days === 1) {
    return "TOMORROW";
  }

  return date
    .toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    .toUpperCase();
};
