import { getAuthHeaders } from "../../common/auth/api/AuthAPI";
import api from "../../common/auth/api/axios";
import { API_BASE_URL } from "../../../config/apiConfig";

const BUS_REQUEST_TIMEOUT_MS = 20_000;
// /book waits on the provider (up to 30s) or on another request that already
// owns the provider call (up to 40s), so it needs a longer client timeout.
const BUS_BOOK_TIMEOUT_MS = 60_000;
const BUS_VERIFY_ATTEMPTS = 3;
const BUS_VERIFY_RETRY_DELAY_MS = 1_500;

const BUS_BOOKING_PENDING_MESSAGE =
  "Your payment is safe. We are confirming your ticket with the operator. If it cannot be confirmed, the amount will be refunded to your original payment method.";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const nativeFetch = globalThis.fetch.bind(globalThis);
const nativeConsole = globalThis.console;

// Keep detailed provider and booking diagnostics out of production builds.
const console = {
  log: (...args: unknown[]) => {
    if (__DEV__) nativeConsole.log(...args);
  },
};

// Apply a deterministic timeout to every raw fetch in this API module.
const fetch: typeof globalThis.fetch = async (input, init = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BUS_REQUEST_TIMEOUT_MS);

  try {
    return await nativeFetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

export type City = {
  id: number | string;
  city_name: string;
  state_name?: string;
  city_type?: string;
  latitude?: string | number;
  longitude?: string | number;
};

export type BusSearchPayload = {
  sourceCityCode: string;
  destinationCityCode: string;
  journeyDate: string;
  journeyTime: string;
};

export type BusSearchResponse = {
  success: boolean;
  message: string;

  search?: {
    source: {
      code: string;
      name: string | null;
    };

    destination: {
      code: string;
      name: string | null;
    };

    journeyDate: string;
    journeyTime: string;
  };

  traceId?: string | number | null;

  totalBusesFromProvider?: number;

  count?: number;

  buses?: any[];
};

export type BusProviderBalance = {
  balance: number;
  creditLimit: number;
};

export type BusProviderBalanceResponse = {
  success: boolean;
  message: string;
  data: BusProviderBalance;
};

export type SeatPrice = {
  CurrencyCode?: string;
  BaseFare?: string | number;
  Tax?: string | number;
  Discount?: string | number;
  PublishedFare?: string | number;
  OfferedFare?: string | number;
  AgentCommission?: string | number;
  AgentMarkUp?: string | number;
  GstTaxableAmount?: string | number;
  GSTRate?: string | number;
  GSTAmount?: string | number;
};


export type SeatLayoutSeat = {
  ColumnNo: number;
  RowNo: number;

  IsLadiesSeat: boolean | string;
  IsMalesSeat: boolean | string;

  IsUpper: boolean | string;

  SeatName: string;

  SeatStatus: boolean | string;

  ReservedForSocialDistancing:
    boolean | string;

  DoubleBirth: boolean | string;

  SeatType: string;

  Width: string | number;

  Price?: SeatPrice;

  SeatFare?: number | string;
};


export type SeatLayoutPayload = {
  traceId: string;
  srdvIndex: string;
  resultIndex: string;
};


export type SeatLayoutResponse = {
  success: boolean;

  message: string;

  traceId: string;

  srdvIndex: string;

  resultIndex: string;

  paxIdRequired?: string | null;

  totalSeats: number;

  availableSeats: number;

  seats: SeatLayoutSeat[];

  layout?: SeatLayoutSeat[][];
};

/*
|--------------------------------------------------------------------------
| Boarding / Dropping Point Types
|--------------------------------------------------------------------------
*/

export type BoardingDroppingPoint = {
  Id: string;

  MasterId?: string;

  Name: string;

  Location?: string;

  Address?: string;

  Landmark?: string;

  ContactNumber?: string;

  Time: string;
};


export type BoardingDroppingPayload = {
  traceId: string;

  srdvIndex: string;

  resultIndex: string;
};


export type BoardingDroppingResponse = {
  success: boolean;

  message: string;

  traceId: string;

  srdvIndex: string;

  resultIndex: string;

  boardingPointCount?: number;

  droppingPointCount?: number;

  boardingPoints: BoardingDroppingPoint[];

  droppingPoints: BoardingDroppingPoint[];
};
/*
|--------------------------------------------------------------------------
| Block Seat Types
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Block Passenger
|--------------------------------------------------------------------------
*/

export type BlockPassenger = {

  Title:
    string;

  FirstName:
    string;

  LastName:
    string;

  Gender:
    string;

  Age:
    string;

  Email:
    string;

  PhoneNo:
    string;

  LeadPassenger:
    string;

  IdNumber:
    string;

  IdType:
    string;

  Address:
    string;

  SeatName:
    string;
};


/*
|--------------------------------------------------------------------------
| Block Payload
|--------------------------------------------------------------------------
*/

export type BlockSeatPayload = {

  traceId:
    string;

  srdvIndex:
    string;

  resultIndex:
    string;

  boardingPointId:
    string;

  droppingPointId:
    string;

  refId:
    string;

  passengers:
    BlockPassenger[];

  sourceCity?:
    string;

  destinationCity?:
    string;
};


/*
|--------------------------------------------------------------------------
| Block Response
|--------------------------------------------------------------------------
*/

export type BlockSeatResponse = {

  success:
    boolean;

  message:
    string;

  traceId:
    string;

  srdvIndex:
    string;

  resultIndex:
    string;

  blockKey:
    string;

  /*
  |--------------------------------------------------------------------------
  | Our Local Booking
  |--------------------------------------------------------------------------
  */

  localOrderId:
    number;

  orderRef:
    string;

  payableAmount:
    number;

  /*
  |--------------------------------------------------------------------------
  | Provider Data
  |--------------------------------------------------------------------------
  */

  bus?: {

    travelsName?:
      string | null;

    busType?:
      string | null;

    departureTime?:
      string | null;

    arrivalTime?:
      string | null;

    duration?:
      number | null;

    price?:
      any;
  };

  boardingPoint?:
    any;

  droppingPoint?:
    any;

  cancellationPolicy?:
    any[];

  passengers?:
    any[];
};

/*
|--------------------------------------------------------------------------
| Book Bus Ticket Types
|--------------------------------------------------------------------------
*/

export type BookBusPayload = {
  order_ref: string;
};


// The backend books with the provider exactly once per paid order, so the
// app only ever learns where the order ended up:
// - confirmed: ticket issued
// - pending:   payment is captured, the backend is still confirming with the
//              operator (or will retry / escalate from its reconcile cron)
// - failed:    the provider rejected the booking and a full refund was queued
export type BusBookingOutcome =
  | {
      status: "confirmed";
      orderRef: string;
      message: string;
      bookingId: number | string | null;
      ticketNo: string | null;
      travelOperatorPNR: string | null;
    }
  | {
      status: "pending";
      orderRef: string;
      message: string;
    }
  | {
      status: "failed";
      orderRef: string;
      message: string;
      refundInitiated: boolean;
    };


export type VerifyBusPaymentPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};


export class BusBookingApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "BusBookingApiError";
    this.status = status;
    this.code = code;
  }
}

export const BUS_SEAT_HOLD_EXPIRED_CODE = "SEAT_HOLD_EXPIRED";

/*
|--------------------------------------------------------------------------
| Bus Razorpay Create Order
|--------------------------------------------------------------------------
*/

export type CreateBusPaymentOrderPayload = {

  order_ref:
    string;
};


export type CreateBusPaymentOrderResponse = {

  success:
    boolean;

  reused?:
    boolean;

  message?:
    string;

  data: {

    key:
      string;

    orderId:
      string;

    /*
    | Razorpay amount is in paise.
    */
    amount:
      number;

    currency:
      string;

    order_ref:
      string;
  };
};

// Uses the same local/live environment switch as every other app module
// (src/config/apiConfig.ts). The backend mounts this module at
// /api/busbooking; on live that sits behind the same reverse-proxy prefix as
// the rest of the API.
// local: http://<dev machine>:5000/api/busbooking
// live:  https://rewardplanners.com/api/crm/api/busbooking
export const BUS_BOOKING_BASE_URL = API_BASE_URL.replace(/\/$/, "");

/*
|--------------------------------------------------------------------------
| Provider Balance
|--------------------------------------------------------------------------
|
| The backend owns the SRDV credentials and calls:
| POST https://bus.srdvtest.com/v9/rest/Balance
|
| The mobile app calls only the authenticated local proxy below. Never place
| ClientId, UserName, or Password in the React Native bundle.
|
|--------------------------------------------------------------------------
*/

export const getBusBalanceApi = async (): Promise<BusProviderBalanceResponse> => {
  const authHeaders = await getAuthHeaders();
  const requestUrl = `${BUS_BOOKING_BASE_URL}/api/busbooking/balance`;

  let response: Response;
  let result: any;

  try {
    response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({}),
    });
    result = await response.json();
  } catch (error: any) {
    console.log("[BusBooking][API][Balance] Network Error", {
      requestUrl,
      message: error?.message || error,
    });
    throw new Error(
      "Unable to reach the bus booking service. Please try again."
    );
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || "Unable to fetch bus provider balance");
  }

  const balance = Number(result?.data?.balance ?? result?.Balance);
  const creditLimit = Number(
    result?.data?.creditLimit ?? result?.data?.credit_limit ?? result?.CreditLimit
  );

  if (!Number.isFinite(balance) || !Number.isFinite(creditLimit)) {
    throw new Error("The bus provider returned an invalid balance response");
  }

  return {
    success: true,
    message: String(result?.message || "Bus provider balance fetched successfully"),
    data: {
      balance,
      creditLimit,
    },
  };
};


/*
|--------------------------------------------------------------------------
| Search Cities
|--------------------------------------------------------------------------
*/

export const searchCitiesApi = async (
  query: string
): Promise<City[]> => {
  const authHeaders = await getAuthHeaders();
  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/api/busbooking/cities?q=${encodeURIComponent(query)}`;

  console.log("[BusBooking][API][Cities] Request", {
    query,
    requestUrl,
    hasAuthorization: !!authHeaders.Authorization,
  });

  let response: Response;
  let result: any;

  try {
    response = await fetch(
      requestUrl,
      {
        headers: {
          ...authHeaders,
        },
      }
    );

    result = await response.json();
  } catch (error: any) {
    console.log("[BusBooking][API][Cities] Network Error", {
      query,
      requestUrl,
      message: error?.message || error,
    });

    throw new Error(
      "Unable to reach the bus booking service. Please try again."
    );
  }

  console.log("[BusBooking][API][Cities] Response", {
    ok: response.ok,
    status: response.status,
    result,
  });

  if (!response.ok || !result.success) {
    console.log("[BusBooking][API][Cities] Error", {
      query,
      status: response.status,
      message: result.message,
    });
    throw new Error(
      result.message || "Unable to search cities"
    );
  }

  return result.data || [];
};


/*
|--------------------------------------------------------------------------
| Search Buses
|--------------------------------------------------------------------------
*/

export const searchBusesApi = async (
  payload: BusSearchPayload
): Promise<BusSearchResponse> => {
  const authHeaders = await getAuthHeaders();
  const requestUrl = `${BUS_BOOKING_BASE_URL}/api/busbooking/search`;

  console.log("[BusBooking][API][Search] Request", {
    
    requestUrl,
    payload,
    hasAuthorization: !!authHeaders.Authorization,
  });

  let response: Response;
  let result: any;

  try {
    response = await fetch(
      requestUrl,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },

        body: JSON.stringify(payload),
      }
    );

    result = await response.json();
  } catch (error: any) {
    console.log("[BusBooking][API][Search] Network Error", {
      requestUrl,
      payload,
      message: error?.message || error,
    });

    throw new Error(
      "Unable to reach the bus booking service. Please try again."
    );
  }

  console.log("[BusBooking][API][Search] Response", {
    ok: response.ok,
    status: response.status,
    busCount: Array.isArray(result?.buses) ? result.buses.length : 0,
    result,
  });

  if (!response.ok || !result.success) {
    console.log("[BusBooking][API][Search] Error", {
      status: response.status,
      payload,
      message: result.message,
      result,
    });

    throw new Error(
      result.message ||
      "Unable to search buses"
    );
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| Get Seat Layout
|--------------------------------------------------------------------------
*/

export const getSeatLayoutApi = async (
  payload: SeatLayoutPayload
): Promise<SeatLayoutResponse> => {

  const authHeaders =
    await getAuthHeaders();

  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/api/busbooking/seat-layout`;


  console.log(
    "[BusBooking][API][SeatLayout] Request",
    {
      requestUrl,
      payload,
      hasAuthorization:
        !!authHeaders.Authorization,
    }
  );


  let response: Response;
  let result: any;


  try {

    response = await fetch(
      requestUrl,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          ...authHeaders,
        },

        body:
          JSON.stringify(payload),
      }
    );


    result =
      await response.json();


  } catch (error: any) {

    console.log(
      "[BusBooking][API][SeatLayout] Network Error",
      {
        requestUrl,
        payload,
        message:
          error?.message || error,
      }
    );


    throw new Error(
      "Network request failed while fetching seat layout"
    );
  }


  console.log(
    "[BusBooking][API][SeatLayout] Response",
    {
      ok:
        response.ok,

      status:
        response.status,

      totalSeats:
        result?.totalSeats,

      availableSeats:
        result?.availableSeats,

      result,
    }
  );


  if (
    !response.ok ||
    !result.success
  ) {

    console.log(
      "[BusBooking][API][SeatLayout] Error",
      {
        status:
          response.status,

        payload,

        message:
          result?.message,

        result,
      }
    );


    throw new Error(
      result?.message ||
      "Unable to get seat layout"
    );
  }


  return result;
};

/*
|--------------------------------------------------------------------------
| Get Boarding / Dropping Points
|--------------------------------------------------------------------------
*/

export const getBoardingDroppingPointsApi = async (
  payload: BoardingDroppingPayload
): Promise<BoardingDroppingResponse> => {

  const authHeaders =
    await getAuthHeaders();


  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/api/busbooking/boarding-dropping-points`;


  console.log(
    "[BusBooking][API][BoardingDropping] Request",
    {
      requestUrl,
      payload,

      hasAuthorization:
        !!authHeaders.Authorization,
    }
  );


  let response: Response;

  let result: any;


  try {

    response =
      await fetch(
        requestUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            ...authHeaders,
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );


    result =
      await response.json();

  } catch (error: any) {

    console.log(
      "[BusBooking][API][BoardingDropping] Network Error",
      {
        requestUrl,

        payload,

        message:
          error?.message ||
          error,
      }
    );


    throw new Error(
      "Network request failed while fetching boarding and dropping points"
    );
  }


  console.log(
    "[BusBooking][API][BoardingDropping] Response",
    {
      ok:
        response.ok,

      status:
        response.status,

      boardingPointCount:
        result?.boardingPoints?.length || 0,

      droppingPointCount:
        result?.droppingPoints?.length || 0,

      result,
    }
  );


  if (
    !response.ok ||
    !result.success
  ) {

    console.log(
      "[BusBooking][API][BoardingDropping] Error",
      {
        status:
          response.status,

        payload,

        message:
          result?.message,

        result,
      }
    );


    throw new Error(
      result?.message ||
      "Unable to get boarding and dropping points"
    );
  }


  return result;
};

/*
|--------------------------------------------------------------------------
| Block Seat
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Block Seat
|--------------------------------------------------------------------------
*/

export const blockSeatApi =
  async (
    payload:
      BlockSeatPayload
  ): Promise<
    BlockSeatResponse
  > => {

    const authHeaders =
      await getAuthHeaders();


    const requestUrl =
      `${BUS_BOOKING_BASE_URL}/api/busbooking/block`;


    console.log(
      "[BusBooking][API][Block] Request",
      {

        requestUrl,

        traceId:
          payload.traceId,

        srdvIndex:
          payload.srdvIndex,

        resultIndex:
          payload.resultIndex,

        boardingPointId:
          payload.boardingPointId,

        droppingPointId:
          payload.droppingPointId,

        sourceCity:
          payload.sourceCity,

        destinationCity:
          payload.destinationCity,

        passengerCount:
          payload
            .passengers
            .length,

        hasAuthorization:
          !!authHeaders
            .Authorization,
      }
    );


    let response:
      any;


    let result:
      any;


    try {

      response =
        await fetch(
          requestUrl,
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

              ...authHeaders,
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );


      result =
        await response.json();


    } catch (
      error: any
    ) {

      console.log(
        "[BusBooking][API][Block] Network Error",
        error
      );


      throw new Error(
        "Network request failed while blocking bus seat"
      );
    }


    console.log(
      "[BusBooking][API][Block] Response",
      {

        ok:
          response.ok,

        status:
          response.status,

        success:
          result?.success,

        blockKey:
          result?.blockKey,

        localOrderId:
          result?.localOrderId,

        orderRef:
          result?.orderRef,

        payableAmount:
          result?.payableAmount,

        message:
          result?.message,
      }
    );


    /*
    |--------------------------------------------------------------------------
    | Authentication Failure
    |--------------------------------------------------------------------------
    */

    if (
      response.status ===
      401
    ) {

      throw new Error(
        result?.message ||
        "Your login session has expired. Please login again."
      );
    }


    if (
      !response.ok ||
      !result?.success
    ) {

      throw new Error(
        result?.message ||
        "Unable to block selected seat"
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Local Order Must Exist
    |--------------------------------------------------------------------------
    */

    if (
      !result
        ?.orderRef
    ) {

      throw new Error(
        "Seat was blocked but local booking order was not created"
      );
    }


    if (
      !result
        ?.localOrderId
    ) {

      throw new Error(
        "Local bus booking order ID is missing"
      );
    }


    if (
      Number(
        result
          ?.payableAmount ||
        0
      ) <=
      0
    ) {

      throw new Error(
        "Booking amount is missing from Block response"
      );
    }


    return result;
  };
/*
|--------------------------------------------------------------------------
| Verify Bus Razorpay Payment
|--------------------------------------------------------------------------
|
| POST /api/busbooking/verify-payment
|
| Marks the order paid on the backend, which is what allows /book to run.
| The call is idempotent, so transient failures are retried.
|
| Returns false when the outcome could not be learned (offline, timeout,
| 5xx). The payment may still have been captured; the backend's Razorpay
| webhook and reconcile cron then book or refund the order on their own.
|
|--------------------------------------------------------------------------
*/

export const verifyBusPaymentApi = async (
  payload: VerifyBusPaymentPayload
): Promise<boolean> => {
  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/api/busbooking/verify-payment`;

  for (let attempt = 1; attempt <= BUS_VERIFY_ATTEMPTS; attempt += 1) {
    let status = 0;
    let result: any = null;

    try {
      const response = await api.post(requestUrl, payload, {
        timeout: BUS_REQUEST_TIMEOUT_MS,
      });
      status = response.status;
      result = response.data;
    } catch (error: any) {
      status = Number(error?.response?.status || 0);
      result = error?.response?.data ?? null;

      console.log("[BusBooking][API][Payment] Verify Error", {
        attempt,
        status,
        message: result?.message || error?.message || error,
      });
    }

    if (status >= 200 && status < 300 && result?.success) {
      return true;
    }

    // A 4xx is the backend's final answer for this payment; retrying the same
    // request cannot change it.
    const isDefinitive =
      status >= 400 && status < 500 && status !== 408 && status !== 429;

    if (isDefinitive) {
      throw new BusBookingApiError(
        status === 401
          ? "Your login session has expired. Please login again."
          : result?.message || "Payment could not be verified",
        status,
        result?.code
      );
    }

    if (attempt < BUS_VERIFY_ATTEMPTS) {
      await sleep(BUS_VERIFY_RETRY_DELAY_MS * attempt);
    }
  }

  return false;
};

/*
|--------------------------------------------------------------------------
| Book Bus Ticket
|--------------------------------------------------------------------------
|
| POST /api/busbooking/book   { order_ref }
|
| 200 -> ticket confirmed
| 202 -> BOOKING_PENDING (still confirming with the operator)
| 400 -> BOOKING_FAILED  (provider rejected, refund queued)
|
| Once the payment is verified, a response the app cannot read (timeout,
| offline, 5xx, rate limit) never means the booking failed: the backend keeps
| working on the order, so it is reported as pending.
|
|--------------------------------------------------------------------------
*/

export const bookBusTicketApi = async (
  payload: BookBusPayload
): Promise<BusBookingOutcome> => {
  const orderRef = String(payload?.order_ref || "").trim();

  if (!orderRef) {
    throw new BusBookingApiError(
      "Bus booking order reference is required"
    );
  }

  const requestUrl = `${BUS_BOOKING_BASE_URL}/api/busbooking/book`;

  let status = 0;
  let result: any = null;

  try {
    const response = await api.post(
      requestUrl,
      { order_ref: orderRef },
      { timeout: BUS_BOOK_TIMEOUT_MS }
    );
    status = response.status;
    result = response.data;
  } catch (error: any) {
    status = Number(error?.response?.status || 0);
    result = error?.response?.data ?? null;

    console.log("[BusBooking][API][Book] Error", {
      status,
      message: result?.message || error?.message || error,
    });
  }

  console.log("[BusBooking][API][Book] Response", {
    status,
    success: result?.success,
    code: result?.code,
    bookingStatus: result?.bookingStatus,
    message: result?.message,
  });

  if (status === 200 && result?.success) {
    return {
      status: "confirmed",
      orderRef: String(result?.orderRef || orderRef),
      message: String(result?.message || "Bus ticket booked successfully"),
      bookingId: result?.bookingId ?? null,
      ticketNo: result?.ticketNo ?? null,
      travelOperatorPNR: result?.travelOperatorPNR ?? null,
    };
  }

  if (result?.code === "BOOKING_FAILED") {
    return {
      status: "failed",
      orderRef: String(result?.orderRef || orderRef),
      message: String(
        result?.message ||
        "Bus booking could not be completed. Your payment will be refunded to the original payment method."
      ),
      refundInitiated: Boolean(result?.refundInitiated),
    };
  }

  if ([400, 401, 403, 404, 409].includes(status)) {
    throw new BusBookingApiError(
      status === 401
        ? "Your login session has expired. Please login again."
        : result?.message || "Unable to book bus ticket",
      status,
      result?.code
    );
  }

  return {
    status: "pending",
    orderRef: String(result?.orderRef || orderRef),
    message: BUS_BOOKING_PENDING_MESSAGE,
  };
};

/*
|--------------------------------------------------------------------------
| Complete Booking After Razorpay Checkout
|--------------------------------------------------------------------------
|
| Razorpay success -> verify-payment -> book. Shared by every screen that
| opens the bus checkout so they all treat a captured payment the same way.
|
|--------------------------------------------------------------------------
*/

export const completeBusBookingApi = async (
  orderRef: string,
  payment: Partial<VerifyBusPaymentPayload> | null | undefined
): Promise<BusBookingOutcome> => {
  const cleanOrderRef = String(orderRef || "").trim();

  const pending: BusBookingOutcome = {
    status: "pending",
    orderRef: cleanOrderRef,
    message: BUS_BOOKING_PENDING_MESSAGE,
  };

  const razorpayOrderId = String(payment?.razorpay_order_id || "").trim();
  const razorpayPaymentId = String(payment?.razorpay_payment_id || "").trim();
  const razorpaySignature = String(payment?.razorpay_signature || "").trim();

  // Checkout reported success without the signed fields, so the app has
  // nothing to verify with. The backend still learns about the capture from
  // the Razorpay webhook.
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return pending;
  }

  const verified = await verifyBusPaymentApi({
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  });

  if (!verified) {
    return pending;
  }

  return bookBusTicketApi({ order_ref: cleanOrderRef });
};


/*
|--------------------------------------------------------------------------
| Create Bus Razorpay Order
|--------------------------------------------------------------------------
*/

export const createBusPaymentOrderApi =
  async (
    payload:
      CreateBusPaymentOrderPayload
  ): Promise<
    CreateBusPaymentOrderResponse
  > => {

    const authHeaders =
      await getAuthHeaders();


    const requestUrl =
      `${BUS_BOOKING_BASE_URL}/api/busbooking/create-order`;


    const orderRef =
      String(
        payload
          ?.order_ref ||
        ""
      ).trim();


    if (
      !orderRef
    ) {

      throw new Error(
        "Bus booking order reference is required"
      );
    }


    console.log(
      "[BusBooking][API][Payment] Create Order Request",
      {

        requestUrl,

        order_ref:
          orderRef,

        hasAuthorization:
          !!authHeaders
            .Authorization,
      }
    );


    let response:
      any;


    let result:
      any;


    try {

      response =
        await api.post(
          requestUrl,
          {
            order_ref:
              orderRef,
          },
          {
            headers: {
              "Content-Type":
                "application/json",
              ...authHeaders,
            },
          }
        );


      result =
        response?.data;


    } catch (
      error: any
    ) {

      console.log(
        "[BusBooking][API][Payment] Create Order Error",
        {
          status:
            error?.response
              ?.status,
          message:
            error?.response
              ?.data
              ?.message ||
            error?.message ||
            error,
          data:
            error?.response
              ?.data,
        }
      );

      if (
        error?.response
          ?.status === 401
      ) {

        throw new Error(
          error?.response
            ?.data
            ?.message ||
          "Invalid access token. Please login again."
        );
      }


      // Carries the backend code (e.g. SEAT_HOLD_EXPIRED on HTTP 410) so the
      // screen can send the user back to seat selection.
      throw new BusBookingApiError(
        error?.response
          ?.data
          ?.message ||
        (error?.response
          ? "Unable to create payment order"
          : "Unable to reach the bus booking service. Please try again."),
        error?.response
          ?.status,
        error?.response
          ?.data
          ?.code
      );
    }


    console.log(
      "[BusBooking][API][Payment] Create Order Response",
      {

        status:
          response.status,

        success:
          result?.success,

        reused:
          result?.reused,

        orderId:
          result
            ?.data
            ?.orderId,

        amount:
          result
            ?.data
            ?.amount,

        currency:
          result
            ?.data
            ?.currency,

        order_ref:
          result
            ?.data
            ?.order_ref,

        message:
          result?.message,
      }
    );


    if (
      response.status ===
      401
    ) {

      throw new Error(
        result?.message ||
        "Your login session has expired. Please login again."
      );
    }


    if (
      response.status < 200 ||
      response.status >= 300 ||
      !result
        ?.success
    ) {

      throw new Error(
        result?.message ||
        "Unable to create Razorpay order"
      );
    }


    if (
      !result
        ?.data
        ?.orderId
    ) {

      throw new Error(
        "Razorpay order ID is missing"
      );
    }


    if (
      !result
        ?.data
        ?.key
    ) {

      throw new Error(
        "Razorpay key is missing"
      );
    }


    if (
      Number(
        result
          ?.data
          ?.amount ||
        0
      ) <=
      0
    ) {

      throw new Error(
        "Invalid Razorpay order amount"
      );
    }


    return result;
  };

/*
|--------------------------------------------------------------------------
| Customer Bookings
|--------------------------------------------------------------------------
*/

export type BusOrderStatus =
  | "pending_payment"
  | "payment_success"
  | "booking_in_progress"
  | "booking_review"
  | "confirmed"
  | "booking_failed"
  | "cancelled"
  | "expired";

export type BusOrderSummary = {
  orderRef: string;
  operatorName: string | null;
  busType: string | null;
  sourceCity: string | null;
  destinationCity: string | null;
  journeyDate: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  boardingPointName: string | null;
  droppingPointName: string | null;
  seatCount: number;
  seats: string[];
  totalAmount: number;
  amountPaid: number;
  status: BusOrderStatus;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  ticketNo: string | null;
  travelOperatorPNR: string | null;
  bookedAt: string | null;
};

export type BusOrderPassenger = {
  name: string;
  gender: string | null;
  age: number | null;
  seatName: string;
  leadPassenger: boolean;
  cancellationStatus: "processing" | "succeeded" | "failed" | null;
  refundStatus: "not_requested" | "pending" | "processed" | "failed" | null;
  refundAmount: number | null;
};

export type BusOrderRefund = {
  reason: "booking_failed" | "cancellation";
  amount: number;
  status: "pending" | "initiated" | "processed" | "failed";
  updatedAt: string | null;
};

export type BusOrderDetail = BusOrderSummary & {
  cancellable: boolean;
  passengers: BusOrderPassenger[];
  refunds: BusOrderRefund[];
  cancellationPolicy: any[];
};

export type BusOrdersPage = {
  data: BusOrderSummary[];
  page: number;
  hasMore: boolean;
};

export type BusPopularRoute = {
  sourceCityCode: string;
  sourceCity: string;
  destinationCityCode: string;
  destinationCity: string;
  bookings: number;
  startingFare: number;
};

export type CancelBusSeatPayload = {
  order_ref: string;
  seatName: string;
  remarks: string;
};

export type CancelBusSeatResult = {
  // false while the provider has not confirmed the cancellation yet.
  completed: boolean;
  message: string;
  refundAmount: number;
  refundStatus: string;
};

const toBusApiError = (error: any, fallback: string) =>
  new BusBookingApiError(
    Number(error?.response?.status) === 401
      ? "Your login session has expired. Please login again."
      : error?.response?.data?.message ||
        (error?.response
          ? fallback
          : "Unable to reach the bus booking service. Please try again."),
    error?.response?.status,
    error?.response?.data?.code
  );

export const getBusOrdersApi = async (
  page = 1,
  limit = 20
): Promise<BusOrdersPage> => {
  try {
    const response = await api.get(
      `${BUS_BOOKING_BASE_URL}/api/busbooking/orders`,
      { params: { page, limit }, timeout: BUS_REQUEST_TIMEOUT_MS }
    );

    return {
      data: Array.isArray(response.data?.data) ? response.data.data : [],
      page: Number(response.data?.page || page),
      hasMore: Boolean(response.data?.hasMore),
    };
  } catch (error: any) {
    throw toBusApiError(error, "Unable to load your bus bookings");
  }
};

export const getBusOrderDetailApi = async (
  orderRef: string
): Promise<BusOrderDetail> => {
  try {
    const response = await api.get(
      `${BUS_BOOKING_BASE_URL}/api/busbooking/orders/${encodeURIComponent(orderRef)}`,
      { timeout: BUS_REQUEST_TIMEOUT_MS }
    );

    if (!response.data?.success || !response.data?.data) {
      throw new BusBookingApiError("Unable to load this bus booking");
    }

    return response.data.data;
  } catch (error: any) {
    if (error instanceof BusBookingApiError) throw error;
    throw toBusApiError(error, "Unable to load this bus booking");
  }
};

/*
|--------------------------------------------------------------------------
| Cancel A Booked Seat
|--------------------------------------------------------------------------
|
| POST /api/busbooking/cancel   { order_ref, seatName, remarks }
|
| 200 -> cancelled, refund queued
| 202 -> provider has not confirmed yet; the backend keeps tracking it
|
|--------------------------------------------------------------------------
*/

export const cancelBusSeatApi = async (
  payload: CancelBusSeatPayload
): Promise<CancelBusSeatResult> => {
  try {
    const response = await api.post(
      `${BUS_BOOKING_BASE_URL}/api/busbooking/cancel`,
      payload,
      { timeout: BUS_BOOK_TIMEOUT_MS }
    );

    const result = response.data;

    if (!result?.success) {
      throw new BusBookingApiError(
        result?.message || "Unable to cancel bus seat",
        response.status
      );
    }

    return {
      completed: response.status === 200,
      message: String(result?.message || "Bus seat cancelled successfully"),
      refundAmount: Number(result?.data?.refundAmount || 0),
      refundStatus: String(result?.data?.refundStatus || "not_requested"),
    };
  } catch (error: any) {
    if (error instanceof BusBookingApiError) throw error;
    throw toBusApiError(error, "Unable to cancel bus seat");
  }
};

/*
|--------------------------------------------------------------------------
| Popular Routes
|--------------------------------------------------------------------------
*/

export const getPopularBusRoutesApi = async (): Promise<BusPopularRoute[]> => {
  try {
    const response = await api.get(
      `${BUS_BOOKING_BASE_URL}/api/busbooking/popular-routes`,
      { timeout: BUS_REQUEST_TIMEOUT_MS }
    );

    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error: any) {
    throw toBusApiError(error, "Unable to load popular routes");
  }
};
