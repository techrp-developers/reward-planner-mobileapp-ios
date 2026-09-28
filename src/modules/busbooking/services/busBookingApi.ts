import { getAuthHeaders } from "../../common/auth/api/AuthAPI";
import { SERVER_URL } from "../../../config/apiConfig";

const BUS_REQUEST_TIMEOUT_MS = 20_000;
const nativeFetch = globalThis.fetch.bind(globalThis);
const nativeConsole = globalThis.console;

// Redact credentials even when a server response/error echoes request data.
const sensitiveValues = new Set<string>();
const safeLogValue = (value: unknown): string => {
  const seen = new WeakSet<object>();
  let text = JSON.stringify(value, (key, item) => {
    if (/authorization|token|signature|password|secret/i.test(key)) return "[REDACTED]";
    if (item && typeof item === "object") {
      if (seen.has(item)) return "[Circular]";
      seen.add(item);
    }
    return item;
  }) ?? "";
  for (const secret of sensitiveValues) text = text.split(secret).join("[REDACTED]");
  return text.replace(/Bearer\s+[^"\s]+/gi, "Bearer [REDACTED]");
};

// Keep detailed provider and booking diagnostics out of production builds.
const console = {
  log: (...args: unknown[]) => {
    if (__DEV__) nativeConsole.log(...args.map(safeLogValue));
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
  Seat: SeatLayoutSeat;

  Title:
    string;

  FirstName:
    string;

  LastName:
    string;

  Gender:
    string;

  Age:
    number;

  Email:
    string;

  PhoneNo:
    string;

  LeadPassenger:
    boolean;

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
  email?: string;

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


export type BookBusResponse = {
  success: boolean;

  message: string;

  traceId: string;

  srdvIndex: string;

  resultIndex: string;

  bookingId: number | string;

  bookingStatus: string;

  ticketNo: string;

  travelOperatorPNR: string;
};

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

// Bus booking is mounted outside CRM in both local and live environments.
export const BUS_BOOKING_BASE_URL = `${SERVER_URL.replace(/\/$/, "")}/api/busbooking`;

// AuthAPI holds the customer session established by /v1/auth login/OTP.
// Never substitute an administrator token or an axios global default here.
const getCustomerAuthHeaders = async () => {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) throw new Error("Please log in to book a bus.");
  sensitiveValues.add(headers.Authorization.replace(/^Bearer\s+/i, ""));
  return { Authorization: headers.Authorization };
};

const getAdminAuthHeaders = (adminAccessToken: string) => {
  const token = adminAccessToken.trim().replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("A CRM administrator access token is required.");
  sensitiveValues.add(token);
  return { Authorization: `Bearer ${token}` };
};

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

export const getBusBalanceApi = async (adminAccessToken: string): Promise<BusProviderBalanceResponse> => {
  const authHeaders = getAdminAuthHeaders(adminAccessToken);
  const requestUrl = `${BUS_BOOKING_BASE_URL}/balance`;

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
  query: string = ""
): Promise<City[]> => {
  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/cities?q=${encodeURIComponent(query)}`;

  console.log("[BusBooking][API][Cities] Request", {
    query,
    requestUrl,
  });

  let response: Response;
  let result: any;

  try {
    response = await fetch(
      requestUrl,
      {
        headers: {
          Accept: "application/json",
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
  const authHeaders = await getCustomerAuthHeaders();
  const requestUrl = `${BUS_BOOKING_BASE_URL}/search`;

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
    await getCustomerAuthHeaders();

  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/seat-layout`;


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
    await getCustomerAuthHeaders();


  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/boarding-dropping-points`;


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

    if (payload.passengers.some(passenger => !passenger.Seat || passenger.Seat.SeatName !== passenger.SeatName)) {
      throw new Error("Selected seat details are missing. Please select your seats again.");
    }

    const authHeaders =
      await getCustomerAuthHeaders();


    const requestUrl =
      `${BUS_BOOKING_BASE_URL}/block`;


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

    result.orderRef = result.order_ref || result.orderRef;

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
| Book Bus Ticket
|--------------------------------------------------------------------------
*/

export const bookBusTicketApi = async (
  payload: BookBusPayload
): Promise<BookBusResponse> => {

  /*
  |--------------------------------------------------------------------------
  | Auth Headers
  |--------------------------------------------------------------------------
  */

  const authHeaders =
    await getCustomerAuthHeaders();


  /*
  |--------------------------------------------------------------------------
  | Backend URL
  |--------------------------------------------------------------------------
  */

  const requestUrl =
    `${BUS_BOOKING_BASE_URL}/book`;


  /*
  |--------------------------------------------------------------------------
  | Request Log
  |--------------------------------------------------------------------------
  */

  console.log(
    "======================================"
  );

  console.log(
    "[BusBooking][API][Book] Request",
    {
      requestUrl,

      order_ref: payload.order_ref,

      hasAuthorization:
        !!authHeaders.Authorization,
    }
  );

  console.log(
    "======================================"
  );


  let response: Response;

  let result: any;


  /*
  |--------------------------------------------------------------------------
  | API Call
  |--------------------------------------------------------------------------
  */

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


  } catch (
    error: any
  ) {

    console.log(
      "[BusBooking][API][Book] Network Error",
      {
        requestUrl,

        message:
          error?.message ||
          error,
      }
    );


    throw new Error(
      "Network request failed while booking bus ticket"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Response Log
  |--------------------------------------------------------------------------
  */

  console.log(
    "======================================"
  );

  console.log(
    "[BusBooking][API][Book] Response",
    {
      ok:
        response.ok,

      status:
        response.status,

      success:
        result?.success,

      bookingId:
        result?.bookingId,

      bookingStatus:
        result?.bookingStatus,

      ticketNo:
        result?.ticketNo,

      travelOperatorPNR:
        result?.travelOperatorPNR,

      message:
        result?.message,
    }
  );

  console.log(
    "======================================"
  );


  /*
  |--------------------------------------------------------------------------
  | Error Handling
  |--------------------------------------------------------------------------
  */

  if (
    !response.ok ||
    !result?.success
  ) {

    console.log(
      "[BusBooking][API][Book] Error",
      result
    );


    throw new Error(
      result?.message ||
      "Unable to book bus ticket"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Success
  |--------------------------------------------------------------------------
  */

  return result;
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
      await getCustomerAuthHeaders();


    const requestUrl =
      `${BUS_BOOKING_BASE_URL}/create-order`;


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
        await fetch(requestUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ order_ref: orderRef }),
        });
      result = await response.json();


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


      throw new Error(
        error?.response
          ?.data
          ?.message ||
        error?.message ||
        "Unable to create payment order"
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

export type VerifyBusPaymentPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type CancelBusPayload = {
  order_ref: string;
  seatName: string;
  remarks: string;
};

type BusActionResponse = { success: boolean; message?: string; data?: unknown };

const postBusAction = async (
  endpoint: string,
  payload: object,
  headers: { Authorization: string },
): Promise<BusActionResponse> => {
  const requestUrl = `${BUS_BOOKING_BASE_URL}/${endpoint}`;
  console.log("[BusBooking][API] Request", { requestUrl, hasAuthorization: true });
  const response = await fetch(requestUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  console.log("[BusBooking][API] Response", { requestUrl, status: response.status, success: result?.success });
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `Bus ${endpoint} failed`);
  }
  return result;
};

export const verifyBusPaymentApi = async (payload: VerifyBusPaymentPayload) => {
  if (!payload.razorpay_order_id || !payload.razorpay_payment_id || !payload.razorpay_signature) {
    throw new Error("Razorpay Checkout payment verification details are missing.");
  }
  return postBusAction("verify-payment", payload, await getCustomerAuthHeaders());
};

export const cancelBusTicketApi = async (payload: CancelBusPayload) => {
  if (!payload.order_ref.trim() || !payload.seatName.trim() || payload.remarks.length > 500) {
    throw new Error("Order reference and seat are required; remarks must be at most 500 characters.");
  }
  return postBusAction("cancel", payload, await getCustomerAuthHeaders());
};

// Admin-only operations must never read the customer session implicitly.
export const getBusBalanceLogApi = async (adminAccessToken: string) =>
  postBusAction("balance-log", {}, getAdminAuthHeaders(adminAccessToken));
