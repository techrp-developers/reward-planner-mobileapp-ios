import RazorpayCheckout from "react-native-razorpay";
import { API_BASE_URL } from "../../../config/apiConfig";

import {
  BUS_SEAT_HOLD_EXPIRED_CODE,
  BusBookingApiError,
  completeBusBookingApi,
} from "../services/busBookingApi";

import type {
  BusBookingOutcome,
  CreateBusPaymentOrderResponse,
} from "../services/busBookingApi";

import type {
  BusBookingPopupConfig,
} from "../components/BusBookingStatusPopup";

type CheckoutPopup = Omit<BusBookingPopupConfig, "visible" | "onClose">;

export type BusCheckoutResult = {
  popup: CheckoutPopup;
  // The order can no longer be paid for from this screen (ticket issued,
  // booking in progress, refunded, or seat hold gone), so the caller should
  // leave the checkout flow once the popup is dismissed.
  leaveCheckout: boolean;
};

type BusCheckoutParams = {
  order: CreateBusPaymentOrderResponse;
  orderRef: string;
  description: string;
  prefill: {
    name: string;
    contact: string;
    email: string;
  };
};

const isCheckoutCancelled = (error: any) =>
  Number(error?.code) === 0 ||
  /cancel|dismiss|closed|back/i.test(
    String(
      error?.description ||
      error?.error?.description ||
      error?.message ||
      ""
    )
  );

const outcomeToResult = (outcome: BusBookingOutcome): BusCheckoutResult => {
  if (outcome.status === "confirmed") {
    const details = [
      outcome.ticketNo ? `Ticket No: ${outcome.ticketNo}` : null,
      outcome.travelOperatorPNR ? `PNR: ${outcome.travelOperatorPNR}` : null,
      `Booking Ref: ${outcome.orderRef}`,
    ].filter(Boolean);

    return {
      popup: {
        title: "Booking Confirmed",
        message: details.join("\n"),
        variant: "success",
      },
      leaveCheckout: true,
    };
  }

  if (outcome.status === "failed") {
    return {
      popup: {
        title: "Booking Failed",
        message: `${outcome.message}\n\nBooking Ref: ${outcome.orderRef}`,
        variant: "error",
      },
      leaveCheckout: true,
    };
  }

  return {
    popup: {
      title: "Booking In Progress",
      message: `${outcome.message}\n\nBooking Ref: ${outcome.orderRef}`,
      variant: "info",
    },
    leaveCheckout: true,
  };
};

// Maps a create-order / verification error to what the user should see.
export const getBusCheckoutErrorResult = (
  error: any
): BusCheckoutResult => {
  const apiError = error instanceof BusBookingApiError ? error : null;

  if (apiError?.code === BUS_SEAT_HOLD_EXPIRED_CODE || apiError?.status === 410) {
    return {
      popup: {
        title: "Seat Hold Expired",
        message:
          apiError.message ||
          "Your seat hold has expired. Please select your seats again.",
        variant: "warning",
      },
      leaveCheckout: true,
    };
  }

  if (apiError?.status === 401) {
    return {
      popup: {
        title: "Session Expired",
        message: apiError.message,
        variant: "error",
      },
      leaveCheckout: false,
    };
  }

  return {
    popup: {
      title: "Payment Error",
      message: String(error?.message || "Unable to start bus payment."),
      variant: "error",
    },
    leaveCheckout: false,
  };
};

// Opens Razorpay for an already-created order and, once the customer has
// paid, verifies the payment and books the ticket.
export const runBusCheckout = async ({
  order,
  orderRef,
  description,
  prefill,
}: BusCheckoutParams): Promise<BusCheckoutResult> => {
  if (
    !order?.data?.key ||
    !order?.data?.orderId ||
    !Number.isFinite(Number(order?.data?.amount))
  ) {
    throw new Error("Razorpay order details are missing.");
  }

  let payment: any;

  if (__DEV__) {
    console.info("[BusBooking][Checkout] Razorpay configuration", {
      apiBaseUrl: API_BASE_URL,
      mode: order.data.key.startsWith("rzp_test_")
        ? "test"
        : order.data.key.startsWith("rzp_live_") ? "live" : "unknown",
    });
  }

  try {
    payment = await RazorpayCheckout.open({
      key: order.data.key,
      amount: Number(order.data.amount),
      currency: order.data.currency || "INR",
      order_id: order.data.orderId,
      name: "Rewards Planners",
      description,
      prefill,
      theme: {
        color: "#D31637",
      },
    });
  } catch (error: any) {
    // Nothing was charged here that the backend does not already track: a
    // late capture reaches it through the Razorpay webhook.
    const cancelled = isCheckoutCancelled(error);

    return {
      popup: {
        title: cancelled ? "Payment Cancelled" : "Payment Failed",
        message: cancelled
          ? "You cancelled the payment. Your seats stay on hold for a few minutes if you want to try again."
          : String(
              error?.description ||
              error?.error?.description ||
              error?.message ||
              "Payment could not be completed."
            ),
        variant: cancelled ? "warning" : "error",
      },
      leaveCheckout: false,
    };
  }

  try {
    return outcomeToResult(
      await completeBusBookingApi(orderRef, {
        ...payment,
        // The order id is known even if checkout omits it from its result.
        razorpay_order_id: payment?.razorpay_order_id || order.data.orderId,
      })
    );
  } catch (error: any) {
    // The customer has paid but the backend rejected the verification or the
    // booking request outright. Keep the reference in front of them.
    return {
      popup: {
        title:
          error instanceof BusBookingApiError && error.status === 401
            ? "Session Expired"
            : "Booking Not Completed",
        message: `${String(
          error?.message || "We could not complete your booking."
        )}\n\nIf any amount was debited, please contact support with Booking Ref: ${orderRef}`,
        variant: "error",
      },
      leaveCheckout: false,
    };
  }
};

