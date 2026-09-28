import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import type {
  RouteProp,
} from "@react-navigation/native";

import type {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import LinearGradient from "react-native-linear-gradient";
import RazorpayCheckout from "react-native-razorpay";
import BusBookingStatusPopup, {
  useBusBookingPopup,
} from "../BusBookingStatusPopup";

import type {
  BusBookingStackParamList,
} from "../../navigation/BusBookingStack";
import {
  bookBusTicketApi,
  verifyBusPaymentApi,
  createBusPaymentOrderApi,
} from "../../services/busBookingApi";
import { fetchWalletBalance } from "../../../ecommerce/api/WalleteAPI";

import Selectedseat1 from "../../assets/icons/selectedseat1.svg";
import Selectedseat2 from "../../assets/icons/selectedseat2.svg";
import BusImage1 from "../../assets/banners/busimage1.svg";


/*
|--------------------------------------------------------------------------
| Fare Helper
|--------------------------------------------------------------------------
*/

const getFareValue = (
  price: string
) => {

  return (
    Number(
      String(
        price || ""
      ).replace(
        /[^\d.]/g,
        ""
      )
    ) || 0
  );
};


/*
|--------------------------------------------------------------------------
| Date Helper
|--------------------------------------------------------------------------
*/

const formatJourneyDate = (
  dateValue: string
): string => {

  if (!dateValue) {
    return "-";
  }

  const date =
    new Date(
      dateValue
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "-";
  }


  return date
    .toLocaleDateString(
      "en-IN",
      {
        day:
          "2-digit",

        month:
          "short",
      }
    )
    .toUpperCase();
};


/*
|--------------------------------------------------------------------------
| Boarding / Dropping Title Helper
|--------------------------------------------------------------------------
*/

const getPointTitle = (
  point: any
): string => {

  if (!point) {
    return "-";
  }


  /*
  |--------------------------------------------------------------------------
  | Old flow may send string
  |--------------------------------------------------------------------------
  */

  if (
    typeof point === "string"
  ) {

    return point;
  }


  /*
  |--------------------------------------------------------------------------
  | New API flow sends complete object
  |--------------------------------------------------------------------------
  */

  return String(
    point?.Name ||
    point?.Location ||
    "-"
  );
};


/*
|--------------------------------------------------------------------------
| Boarding / Dropping Address Helper
|--------------------------------------------------------------------------
*/

const getPointAddress = (
  point: any
): string => {

  if (
    !point ||
    typeof point === "string"
  ) {

    return "";
  }


  const values = [
    point?.Location,
    point?.Address,
    point?.Landmark,
  ]
    .map(
      value =>
        String(
          value || ""
        ).trim()
    )
    .filter(Boolean);


  /*
  |--------------------------------------------------------------------------
  | Remove duplicate values
  |--------------------------------------------------------------------------
  */

  return Array.from(
    new Set(values)
  ).join(", ");
};


/*
|--------------------------------------------------------------------------
| Bus Summary Screen
|--------------------------------------------------------------------------
*/

export default function BusSummaryScreen() {
  const {
    popup,
    showPopup,
    hidePopup,
  } = useBusBookingPopup();

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const navigation =
    useNavigation<
      NativeStackNavigationProp<
        BusBookingStackParamList
      >
    >();


  /*
  |--------------------------------------------------------------------------
  | Route
  |--------------------------------------------------------------------------
  */

  const route =
    useRoute<
      RouteProp<
        BusBookingStackParamList,
        "BusSummaryScreen"
      >
    >();


  /*
  |--------------------------------------------------------------------------
  | Route Params
  |--------------------------------------------------------------------------
  */

  const {
    bus,
    selectedSeats,
    passengers,
    boardingPoint,
    droppingPoint,
    blockResponse,
  } =
    route.params;


  /*
  |--------------------------------------------------------------------------
  | Screen Width
  |--------------------------------------------------------------------------
  */

  const {
    width,
  } =
    useWindowDimensions();


  const slideWidth =
    width - 16;
  const [
    useRewardCoins,
    setUseRewardCoins,
  ] = React.useState(false);
  const [
    walletBalance,
    setWalletBalance,
  ] = React.useState(0);
  const [
    loadingWalletBalance,
    setLoadingWalletBalance,
  ] = React.useState(true);

  const [
    creatingPaymentOrder,
    setCreatingPaymentOrder,
  ] =
    React.useState(
      false
    );

  const [
    processingPayment,
    setProcessingPayment,
  ] =
    React.useState(
      false
    );

  const redeemableCoins =
    Math.max(
      0,
      walletBalance
    );

  React.useEffect(() => {
    let mounted = true;

    const loadWalletBalance = async () => {
      try {
        setLoadingWalletBalance(true);
        const response = await fetchWalletBalance();

        if (!mounted) {
          return;
        }

        setWalletBalance(
          Number(
            response?.data?.balance || 0
          )
        );
      } catch (error) {
        console.log(
          "[BusBooking][Summary] Wallet balance load failed",
          error
        );

        if (!mounted) {
          return;
        }

        setWalletBalance(0);
      } finally {
        if (mounted) {
          setLoadingWalletBalance(false);
        }
      }
    };

    loadWalletBalance();

    return () => {
      mounted = false;
    };
  }, []);


  /*
  |--------------------------------------------------------------------------
  | Provider Confirmed Boarding / Dropping
  |--------------------------------------------------------------------------
  |
  | After Block API succeeds, prefer provider-confirmed point information.
  | If it is unavailable, use navigation values.
  |
  |--------------------------------------------------------------------------
  */

  const finalBoardingPoint =
    blockResponse
      ?.boardingPoint ||
    boardingPoint;


  const finalDroppingPoint =
    blockResponse
      ?.droppingPoint ||
    droppingPoint;


  /*
  |--------------------------------------------------------------------------
  | Boarding Point Display Data
  |--------------------------------------------------------------------------
  */

  const boardingPointTitle =
    getPointTitle(
      finalBoardingPoint
    );


  const boardingPointAddress =
    getPointAddress(
      finalBoardingPoint
    );


  const boardingTime =
    typeof finalBoardingPoint ===
      "object"
      ? String(
          finalBoardingPoint
            ?.Time ||
          ""
        )
      : "";


  /*
  |--------------------------------------------------------------------------
  | Dropping Point Display Data
  |--------------------------------------------------------------------------
  */

  const droppingPointTitle =
    getPointTitle(
      finalDroppingPoint
    );


  const droppingPointAddress =
    getPointAddress(
      finalDroppingPoint
    );


  const droppingTime =
    typeof finalDroppingPoint ===
      "object"
      ? String(
          finalDroppingPoint
            ?.Time ||
          ""
        )
      : "";


  /*
  |--------------------------------------------------------------------------
  | Block Key
  |--------------------------------------------------------------------------
  */

  const blockKey =
    String(
      blockResponse
        ?.blockKey ||
      ""
    );

  const orderRef =
    String(
      blockResponse
        ?.order_ref || blockResponse?.orderRef ||
      ""
    ).trim();

  const localOrderId =
    Number(
      blockResponse
        ?.localOrderId ||
      0
    );

  const traceId =
    String(
      blockResponse
        ?.traceId ||
      ""
    ).trim();

  const srdvIndex =
    String(
      blockResponse
        ?.srdvIndex ||
      ""
    ).trim();

  const resultIndex =
    String(
      blockResponse
        ?.resultIndex ||
      ""
    ).trim();


  /*
  |--------------------------------------------------------------------------
  | Bus Route
  |--------------------------------------------------------------------------
  */

  const sourceCity =
    String(
      bus?.from ||
      ""
    )
      .split(",")[0]
      .trim();


  const destinationCity =
    String(
      bus?.to ||
      ""
    )
      .split(",")[0]
      .trim();


  /*
  |--------------------------------------------------------------------------
  | Journey Date
  |--------------------------------------------------------------------------
  */

  const departureDate =
    String(
      blockResponse
        ?.bus
        ?.departureTime ||

      bus
        ?.raw
        ?.DepartureTime ||

      bus
        ?.DepartureTime ||

      ""
    );


  const formattedJourneyDate =
    formatJourneyDate(
      departureDate
    );


  /*
  |--------------------------------------------------------------------------
  | Fare
  |--------------------------------------------------------------------------
  */

  const baseFare =
    getFareValue(
      bus?.price
    ) *
    selectedSeats.length;



/*
|--------------------------------------------------------------------------
| Authoritative Payable Amount
|--------------------------------------------------------------------------
|
| The backend calculated this after successful provider Block and stored
| the same amount in busbooking_orders.total_amount.
|
|--------------------------------------------------------------------------
*/

const backendPayableAmount =
  Number(
    blockResponse
      ?.payableAmount ||
    0
  );


const totalAmount =
  backendPayableAmount > 0

    ? backendPayableAmount

    : baseFare;


/*
|--------------------------------------------------------------------------
| Remove Fake Charges For Payment
|--------------------------------------------------------------------------
*/

const taxes =
  0;


const rewardDiscount =
  0;

const rewardEarned =
  Math.max(
    0,
    Math.round(
      totalAmount * 0.03
    )
  );

  const openRazorpayCheckout =
    React.useCallback(
      async (
        order: {
          data?: {
            key?: string;
            orderId?: string;
            amount?: number;
            currency?: string;
          };
        }
      ) => {

        if (
          !order?.data?.key ||
          !order?.data?.orderId ||
          !Number.isFinite(
            Number(
              order?.data?.amount
            )
          )
        ) {

          throw new Error(
            "Razorpay order details are missing."
          );
        }

        const firstPassenger =
          Array.isArray(
            passengers
          ) &&
          passengers.length > 0
            ? passengers[0]
            : null;

        const options = {
          key:
            order.data.key,
          amount:
            Number(
              order.data.amount
            ),
          currency:
            order.data.currency ||
            "INR",
          order_id:
            order.data.orderId,
          name:
            "Rewards Planners",
          description:
            `Bus Ticket ${sourceCity} to ${destinationCity}`,
          prefill: {
            name:
              firstPassenger?.fullName ||
              "Rewards Planners User",
            contact:
              firstPassenger?.phone ||
              "",
            email:
              firstPassenger?.email ||
              "",
          },
          theme: {
            color:
              "#D31637",
          },
        };

        console.log(
          "[BusBooking][Summary] RAZORPAY OPTIONS",
          {
            order_id:
              options.order_id,
            amount:
              options.amount,
            key:
              options.key,
          }
        );

        setProcessingPayment(
          true
        );

        try {
          const paymentResult =
            await RazorpayCheckout.open(
              options
            );

          await verifyBusPaymentApi({
            razorpay_order_id: paymentResult.razorpay_order_id,
            razorpay_payment_id: paymentResult.razorpay_payment_id,
            razorpay_signature: paymentResult.razorpay_signature,
          });
          const bookingResponse = await bookBusTicketApi({ order_ref: orderRef });

          console.log(
            "[BusBooking][Summary] BOOK SUCCESS",
            bookingResponse
          );

          showPopup({
            title: "Booking Confirmed",
            message: bookingResponse?.ticketNo
              ? `Ticket No: ${bookingResponse.ticketNo}`
              : "Bus ticket booked successfully.",
            variant: "success",
            onClose: () => navigation.navigate("BookingHomeScreen"),
          });
        } catch (error: any) {
          console.log(
            "[BusBooking][Summary] RAZORPAY ERROR",
            error
          );

          const message =
            error?.description ||
            error?.message ||
            error?.error?.description ||
            "Payment was cancelled or failed.";

          showPopup({
            title: String(message).toLowerCase().includes("cancel")
              ? "Payment Cancelled"
              : "Payment Failed",
            message: String(message),
            variant: String(message).toLowerCase().includes("cancel") ? "warning" : "error",
          });
        } finally {
          setProcessingPayment(
            false
          );
        }
      },
      [
        orderRef,
        destinationCity,
        navigation,
        passengers,
        resultIndex,
        sourceCity,
        srdvIndex,
        traceId,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Proceed To Payment
  |--------------------------------------------------------------------------
  */

  const handleProceedToPayment =
    React.useCallback(
      async () => {

        if (
          creatingPaymentOrder ||
          processingPayment
        ) {
          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Block Key Required
        |--------------------------------------------------------------------------
        */

        if (
          !blockKey
        ) {

          console.log(
            "[BusBooking][Summary] Missing BlockKey"
          );


          showPopup({
            title: "Booking Error",
            message: "Seat block information is missing. Please select the bus and seat again.",
            variant: "error",
          });


          return;
        }


        /*
        |--------------------------------------------------------------------------
        | Log
        |--------------------------------------------------------------------------
        */

        console.log(
          "======================================"
        );


        console.log(
          "[BusBooking][Summary] PROCEED TO PAYMENT",
          {
            blockKey,

            selectedSeats,

            totalAmount,

            boardingPointId:
              typeof finalBoardingPoint ===
                "object"
                ? finalBoardingPoint
                    ?.Id
                : null,

            droppingPointId:
              typeof finalDroppingPoint ===
                "object"
                ? finalDroppingPoint
                    ?.Id
                : null,
          }
        );


        console.log(
          "======================================"
        );

const orderRef =
  String(
    blockResponse
      ?.order_ref || blockResponse?.orderRef ||
    ""
  );


if (
  !orderRef
) {

  showPopup({
    title: "Booking Error",
    message: "Local bus booking reference is missing. Please select the seat again.",
    variant: "error",
  });

  return;
}

        if (
          !localOrderId
        ) {

          showPopup({
            title: "Booking Error",
            message: "Local bus booking order is missing. Please select the seat again.",
            variant: "error",
          });

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Create Payment Order
        |--------------------------------------------------------------------------
        */

        try {

          setCreatingPaymentOrder(
            true
          );

          const paymentOrder =
            await createBusPaymentOrderApi({
              order_ref:
                orderRef,
            });

          await openRazorpayCheckout(
            paymentOrder
          );
        } catch (error: any) {

          console.log(
            "[BusBooking][Summary] PAYMENT FLOW ERROR",
            error?.message ||
            error
          );

          showPopup({
            title: String(error?.message || "").toLowerCase().includes("token")
              ? "Session Expired"
              : "Payment Error",
            message: error?.message || "Unable to start bus payment.",
            variant: "error",
          });
        } finally {

          setCreatingPaymentOrder(
            false
          );
        }
      },

      [
        blockKey,
        creatingPaymentOrder,
        finalBoardingPoint,
        finalDroppingPoint,
        localOrderId,
        openRazorpayCheckout,
        orderRef,
        passengers,
        processingPayment,
        selectedSeats,
        totalAmount,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (

    <SafeAreaView
      style={
        styles.safeArea
      }
      edges={[
        "top",
        "left",
        "right",
      ]}
    >

      {/*
      |--------------------------------------------------------------------------
      | Header
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.header
        }
      >

        <TouchableOpacity
          activeOpacity={
            0.85
          }
          onPress={
            () =>
              navigation.goBack()
          }
          style={
            styles.backButton
          }
        >

          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color="#77737B"
          />

        </TouchableOpacity>


        <View
          style={
            styles.headerTextWrap
          }
        >

          <Text
            style={
              styles.routeTitle
            }
          >
            {sourceCity || "-"}
            {" - "}
            {destinationCity || "-"}
          </Text>


          <Text
            style={
              styles.routeMeta
            }
          >

            {formattedJourneyDate}

            {" - "}

            {selectedSeats.length}

            {" "}

            {selectedSeats.length ===
            1
              ? "PASSENGER"
              : "PASSENGERS"}

          </Text>

        </View>


        <View
          style={
            styles.headerActions
          }
        />

      </View>


      {/*
      |--------------------------------------------------------------------------
      | Main Scroll
      |--------------------------------------------------------------------------
      */}

      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/*
        |--------------------------------------------------------------------------
        | Bus Image
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.sliderRow
          }
        >

          <View
            style={[
              styles.slideCard,
              {
                width:
                  slideWidth,
              },
            ]}
          >

            <BusImage1
              width="100%"
              height="100%"
            />

          </View>

        </View>


        {/*
        |--------------------------------------------------------------------------
        | Boarding / Dropping Points
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.pointsWrap
          }
        >

          <View
            style={
              styles.pointTimelineRow
            }
          >

            {/*
            |--------------------------------------------------------------------------
            | Timeline Icons
            |--------------------------------------------------------------------------
            */}

            <View
              style={
                styles.pointIconColumn
              }
            >

              <MaterialCommunityIcons
                name="map-marker-outline"
                size={22}
                color="#FFC7CD"
              />


              <View
                style={
                  styles.pointConnector
                }
              />


              <MaterialCommunityIcons
                name="map-marker-outline"
                size={22}
                color="#C8102E"
              />

            </View>


            {/*
            |--------------------------------------------------------------------------
            | Point Details
            |--------------------------------------------------------------------------
            */}

            <View
              style={
                styles.pointDetailsColumn
              }
            >

              {/*
              |--------------------------------------------------------------------------
              | Boarding
              |--------------------------------------------------------------------------
              */}

              <View
                style={
                  styles.pointBlockTop
                }
              >

                <Text
                  style={
                    styles.pointLabel
                  }
                >
                  Boarding point
                </Text>


                <Text
                  style={
                    styles.pointTitle
                  }
                >
                  {boardingPointTitle}
                </Text>


                {!!boardingPointAddress && (

                  <Text
                    style={
                      styles.pointAddress
                    }
                  >
                    {boardingPointAddress}
                  </Text>

                )}


                <Text
                  style={
                    styles.pointTime
                  }
                >
                  {boardingTime ||
                    "--:--"}
                </Text>

              </View>


              {/*
              |--------------------------------------------------------------------------
              | Dropping
              |--------------------------------------------------------------------------
              */}

              <View
                style={
                  styles.pointBlockBottom
                }
              >

                <Text
                  style={
                    styles.pointLabel
                  }
                >
                  Dropping point
                </Text>


                <Text
                  style={
                    styles.pointTitle
                  }
                >
                  {droppingPointTitle}
                </Text>


                {!!droppingPointAddress && (

                  <Text
                    style={
                      styles.pointAddress
                    }
                  >
                    {droppingPointAddress}
                  </Text>

                )}


                <Text
                  style={
                    styles.pointTime
                  }
                >
                  {droppingTime ||
                    "--:--"}
                </Text>

              </View>

            </View>

          </View>

        </View>


        {/*
        |--------------------------------------------------------------------------
        | Selected Seats
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.sectionBlock
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            Selected Seats
          </Text>


          <View
            style={
              styles.selectedSeatsCard
            }
          >

            {selectedSeats.map(
              (
                seat,
                index
              ) => (
                <React.Fragment
                  key={
                    String(
                      seat
                    )
                  }
                >

                  <View
                    style={
                      styles.selectedSeatItem
                    }
                  >
                    <View
                      style={
                        styles.selectedSeatWrap
                      }
                    >

                      {index %
                        2 ===
                      0 ? (

                        <Selectedseat1
                          width={60}
                          height={82}
                        />

                      ) : (

                        <Selectedseat2
                          width={60}
                          height={82}
                        />

                      )}

                    </View>

                    <Text
                      style={
                        styles.selectedSeatLabel
                      }
                    >
                      Seat {String(
                        seat
                      )}
                    </Text>
                  </View>


                  {index !==
                  selectedSeats.length -
                    1 ? (

                    <View
                      style={
                        styles.selectedSeatDivider
                      }
                    />

                  ) : null}

                </React.Fragment>

              )
            )}

          </View>

        </View>


        {/*
        |--------------------------------------------------------------------------
        | Passenger List
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.sectionBlock
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            Passenger List
          </Text>


          <View
            style={
              styles.passengerListCard
            }
          >

            {passengers.map(
              (
                passenger,
                index
              ) => (

                <View
                  key={
                    `${
                      passenger
                        ?.seat ||
                      index
                    }-${index}`
                  }
                  style={[
                    styles.passengerRow,

                    index !==
                    passengers.length -
                      1
                      ? styles.passengerRowBorder
                      : null,
                  ]}
                >

                  <View
                    style={
                      styles.passengerAvatar
                    }
                  >

                    <MaterialCommunityIcons
                      name="account-outline"
                      size={19}
                      color="#D31637"
                    />

                  </View>


                  <View
                    style={
                      styles.passengerInfo
                    }
                  >

                    <Text
                      style={
                        styles.passengerName
                      }
                    >

                      {String(
                        passenger
                          ?.fullName ||
                        `Passenger ${
                          index +
                          1
                        }`
                      )}

                    </Text>


                    <Text
                      style={
                        styles.passengerMeta
                      }
                    >

                      Adult · Seat{" "}

                      {String(
                        passenger
                          ?.seat ||
                        selectedSeats[
                          index
                        ] ||
                        "-"
                      )}

                    </Text>

                  </View>


                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={18}
                    color="#9A93A0"
                  />

                </View>

              )
            )}

          </View>

        </View>


        {/*
        |--------------------------------------------------------------------------
        | Rewards Card
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.pointsCard
          }
        >

          <View
            style={
              styles.pointsCardHeader
            }
          >

            <View
              style={[
                styles.pointsIcon,
                useRewardCoins &&
                redeemableCoins > 0
                  ? styles.pointsIconActive
                  : styles.pointsIconDisabled,
              ]}
            >

              <MaterialCommunityIcons
                name="star-four-points"
                size={18}
                color={
                  useRewardCoins &&
                  redeemableCoins > 0
                    ? "#D31637"
                    : "#8E8A90"
                }
              />

            </View>


            <View
              style={
                styles.pointsCardTextWrap
              }
            >

              <Text
                style={
                  styles.pointsCardTitle
                }
              >
                Redeem Rewards Planner Points
              </Text>


              <Text
                style={
                  styles.pointsCardSubtext
                }
              >
                {loadingWalletBalance
                  ? "Loading your available RP coins..."
                  : redeemableCoins > 0
                    ? `You currently have ${redeemableCoins.toLocaleString("en-IN")} RP coins in your wallet for redemption.`
                    : "No RP coins are available in this wallet right now."}
              </Text>

            </View>


            <TouchableOpacity
              activeOpacity={0.88}
              disabled={redeemableCoins <= 0}
              onPress={() =>
                setUseRewardCoins(
                  current =>
                    !current
                )
              }
              style={[
                styles.pointsToggleTrack,
                useRewardCoins &&
                redeemableCoins > 0
                  ? styles.pointsToggleTrackActive
                  : null,
                redeemableCoins <= 0
                  ? styles.pointsToggleTrackDisabled
                  : null,
              ]}
            >

              <View
                style={[
                  styles.pointsToggleThumb,
                  useRewardCoins &&
                  redeemableCoins > 0
                    ? styles.pointsToggleThumbActive
                    : null,
                ]}
              />

            </TouchableOpacity>

          </View>


          <View
            style={
              styles.pointsCardFooter
            }
          >

            <Text
              style={
                styles.pointsBalanceText
              }
            >
              {loadingWalletBalance
                ? "Current Balance: Loading..."
                : `Current Balance: ${walletBalance.toLocaleString("en-IN")} Coins`}

            </Text>


            <Text
              style={[
                styles.pointsAppliedText,
                useRewardCoins &&
                redeemableCoins > 0
                  ? styles.pointsAppliedTextActive
                  : null,
              ]}
            >
              {redeemableCoins <= 0
                ? "Unavailable"
                : useRewardCoins
                  ? "Redeem enabled"
                  : "Disabled"}
            </Text>

          </View>

        </View>


        {/*
        |--------------------------------------------------------------------------
        | Fare Summary
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.fareCard
          }
        >

          <Text
            style={
              styles.fareCardTitle
            }
          >
            Fare Summary
          </Text>


          {/*
          |--------------------------------------------------------------------------
          | Base Fare
          |--------------------------------------------------------------------------
          */}

          <View
            style={
              styles.fareRow
            }
          >

            <Text
              style={
                styles.fareLabel
              }
            >

              Base Fare (
              {selectedSeats.length}{" "}
              {selectedSeats.length ===
              1
                ? "Seat"
                : "Seats"}
              )

            </Text>


            <Text
              style={
                styles.fareValue
              }
            >

              ₹
              {baseFare.toLocaleString(
                "en-IN"
              )}

            </Text>

          </View>


          {/*
          |--------------------------------------------------------------------------
          | Taxes
          |--------------------------------------------------------------------------
          */}

          <View
            style={
              styles.fareRow
            }
          >

            <Text
              style={
                styles.fareLabel
              }
            >
              Taxes & Fees
            </Text>


            <Text
              style={
                styles.fareValue
              }
            >

              ₹
              {taxes.toLocaleString(
                "en-IN"
              )}

            </Text>

          </View>


          {/*
          |--------------------------------------------------------------------------
          | Reward Discount
          |--------------------------------------------------------------------------
          */}

          <View
            style={
              styles.fareRow
            }
          >

            <View
              style={
                styles.discountRow
              }
            >

              <Text
                style={
                  styles.fareLabel
                }
              >
                Reward Discount
              </Text>


              <View
                style={
                  styles.rpBadge
                }
              >

                <Text
                  style={
                    styles.rpBadgeText
                  }
                >
                  RP COINS
                </Text>

              </View>

            </View>


            <Text
              style={
                styles.discountValue
              }
            >

              -₹
              {rewardDiscount.toLocaleString(
                "en-IN"
              )}

            </Text>

          </View>


          <View
            style={
              styles.fareDivider
            }
          />


          {/*
          |--------------------------------------------------------------------------
          | Total
          |--------------------------------------------------------------------------
          */}

          <View
            style={
              styles.totalRow
            }
          >

            <View>

              <Text
                style={
                  styles.totalLabel
                }
              >
                TOTAL AMOUNT
              </Text>


              <Text
                style={
                  styles.totalValue
                }
              >

                ₹
                {totalAmount.toLocaleString(
                  "en-IN"
                )}

              </Text>

            </View>


            <View
              style={
                styles.earnedWrap
              }
            >

              <Text
                style={
                  styles.earnedLabel
                }
              >
                EARNED
              </Text>


              <Text
                style={
                  styles.earnedValue
                }
              >
                +{rewardEarned.toLocaleString("en-IN")} RP coins
              </Text>

            </View>

          </View>

        </View>

      </ScrollView>


      {/*
      |--------------------------------------------------------------------------
      | Bottom Payment Section
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.bottomBar
        }
      >

        <TouchableOpacity
          activeOpacity={
            0.9
          }
          disabled={
            creatingPaymentOrder ||
            processingPayment
          }
          onPress={
            handleProceedToPayment
          }
          style={[
            styles.payButtonWrap,
            creatingPaymentOrder ||
            processingPayment
              ? styles.disabledButton
              : null,
          ]}
        >

          <LinearGradient
            colors={[
              "#D31637",
              "#B20C28",
            ]}
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 0,
            }}
            style={
              styles.payButton
            }
          >

            {creatingPaymentOrder ||
            processingPayment ? (

              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />


                <Text
                  style={
                    styles.payButtonText
                  }
                >
                  {processingPayment
                    ? "Opening Payment..."
                    : "Creating Payment..."}
                </Text>
              </>

            ) : (

              <>
                <Text
                  style={
                    styles.payButtonText
                  }
                >
                  Proceed to Payment
                </Text>


                <MaterialCommunityIcons
                  name="arrow-right"
                  size={18}
                  color="#FFFFFF"
                />
              </>

            )}

          </LinearGradient>

        </TouchableOpacity>


        <Text
          style={
            styles.footerNote
          }
        >

          By clicking, you agree to our Terms of Service and Privacy Policy.

        </Text>

      </View>

      <BusBookingStatusPopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        variant={popup.variant}
        buttonText={popup.buttonText}
        onClose={hidePopup}
      />

    </SafeAreaView>
  );
}


/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({

    safeArea: {
      flex: 1,
      backgroundColor:
        "#FBF8F5",
    },


    scroll: {
      flex: 1,
    },


    content: {
      paddingBottom: 28,
    },


    /*
    |--------------------------------------------------------------------------
    | Header
    |--------------------------------------------------------------------------
    */

    header: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 14,
      flexDirection: "row",
      alignItems: "center",
    },


    backButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },


    headerTextWrap: {
      flex: 1,
    },


    routeTitle: {
      color: "#343038",
      fontSize: 17,
      fontWeight: "700",
    },


    routeMeta: {
      marginTop: 2,
      color: "#8B8590",
      fontSize: 11,
      fontWeight: "600",
    },


    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },


    alertButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },


    profileButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        "#5E7280",
      alignItems: "center",
      justifyContent: "center",
    },


    /*
    |--------------------------------------------------------------------------
    | Slider
    |--------------------------------------------------------------------------
    */

    sliderRow: {
      paddingHorizontal: 8,
    },


    slideCard: {
      height: 220,
      overflow: "hidden",
      marginTop: 18,
    },


    /*
    |--------------------------------------------------------------------------
    | Boarding / Dropping
    |--------------------------------------------------------------------------
    */

    pointsWrap: {
      marginTop: 18,
      marginHorizontal: 12,
    },


    pointTimelineRow: {
      flexDirection: "row",
      alignItems:
        "flex-start",
    },


    pointIconColumn: {
      width: 28,
      alignItems: "center",
      paddingTop: 2,
    },


    pointConnector: {
      width: 2,
      minHeight: 82,
      backgroundColor:
        "#8F8A93",
      marginVertical: 6,
    },


    pointDetailsColumn: {
      flex: 1,
      marginLeft: 14,
    },


    pointBlockTop: {
      paddingBottom: 16,
    },


    pointBlockBottom: {
      paddingTop: 2,
    },


    pointLabel: {
      color: "#5F5A64",
      fontSize: 12,
      fontWeight: "500",
    },


    pointTitle: {
      marginTop: 4,
      color: "#3C3841",
      fontSize: 16,
      fontWeight: "700",
    },


    pointAddress: {
      marginTop: 3,
      color: "#8B8590",
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 17,
    },


    pointTime: {
      marginTop: 4,
      color: "#57525C",
      fontSize: 16,
      fontWeight: "600",
    },


    /*
    |--------------------------------------------------------------------------
    | Common Section
    |--------------------------------------------------------------------------
    */

    sectionBlock: {
      marginTop: 18,
      marginHorizontal: 12,
    },


    sectionTitle: {
      color: "#403B45",
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 12,
    },


    /*
    |--------------------------------------------------------------------------
    | Selected Seats
    |--------------------------------------------------------------------------
    */

    selectedSeatsCard: {
      minHeight: 108,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#E84153",
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 18,
      paddingVertical: 18,
      flexDirection: "row",
      alignItems: "center",
    },


    selectedSeatItem: {
      alignItems: "center",
      justifyContent: "center",
    },

    selectedSeatWrap: {
      width: 60,
      height: 82,
      alignItems: "center",
      justifyContent: "center",
    },

    selectedSeatLabel: {
      marginTop: 8,
      color: "#3D3841",
      fontSize: 12,
      fontWeight: "800",
    },


    selectedSeatDivider: {
      width: 1,
      height: 88,
      backgroundColor:
        "#B7AEB4",
      marginHorizontal: 18,
    },


    /*
    |--------------------------------------------------------------------------
    | Passenger List
    |--------------------------------------------------------------------------
    */

    passengerListCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#ECE2DD",
      overflow: "hidden",
      paddingVertical: 6,
    },


    passengerRow: {
      minHeight: 66,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
    },


    passengerRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor:
        "#F0E8E3",
    },


    passengerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        "#FFEDEF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },


    passengerInfo: {
      flex: 1,
    },


    passengerName: {
      color: "#3D3841",
      fontSize: 15,
      fontWeight: "700",
    },


    passengerMeta: {
      marginTop: 3,
      color: "#948E99",
      fontSize: 12,
      fontWeight: "500",
    },


    /*
    |--------------------------------------------------------------------------
    | Rewards Card
    |--------------------------------------------------------------------------
    */

    pointsCard: {
      marginTop: 18,
      marginHorizontal: 12,
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#ECE2DD",
      paddingHorizontal: 16,
      paddingVertical: 18,
    },


    pointsCardHeader: {
      flexDirection: "row",
      alignItems: "center",
    },


    pointsIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    pointsIconActive: {
      backgroundColor:
        "#FDECEF",
    },

    pointsIconDisabled: {
      backgroundColor:
        "#EFEDEF",
    },


    pointsCardTextWrap: {
      flex: 1,
    },


    pointsCardTitle: {
      color: "#403B45",
      fontSize: 15,
      fontWeight: "700",
    },


    pointsCardSubtext: {
      marginTop: 2,
      color: "#99929A",
      fontSize: 12,
      fontWeight: "500",
    },


    pointsToggleTrack: {
      width: 42,
      height: 24,
      borderRadius: 12,
      backgroundColor:
        "#D7D3D8",
      paddingHorizontal: 2,
      justifyContent: "center",
    },

    pointsToggleTrackActive: {
      backgroundColor:
        "#D31637",
    },

    pointsToggleTrackDisabled: {
      backgroundColor:
        "#D7D3D8",
    },


    pointsToggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor:
        "#FFFFFF",
      alignSelf: "flex-start",
    },

    pointsToggleThumbActive: {
      alignSelf: "flex-end",
    },


    pointsCardFooter: {
      marginTop: 16,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent:
        "space-between",
    },


    pointsBalanceText: {
      color: "#7A747C",
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 18,
    },


    pointsAppliedText: {
      color: "#7A747C",
      fontSize: 14,
      fontWeight: "700",
    },

    pointsAppliedTextActive: {
      color: "#D31637",
    },


    /*
    |--------------------------------------------------------------------------
    | Fare
    |--------------------------------------------------------------------------
    */

    fareCard: {
      marginTop: 18,
      marginHorizontal: 12,
      marginBottom: 12,
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#ECE2DD",
      paddingHorizontal: 16,
      paddingVertical: 18,
    },


    fareCardTitle: {
      color: "#403B45",
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 14,
    },


    fareRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 14,
    },


    fareLabel: {
      color: "#6F6A73",
      fontSize: 13,
      fontWeight: "500",
    },


    fareValue: {
      color: "#3D3841",
      fontSize: 14,
      fontWeight: "700",
    },


    discountRow: {
      flexDirection: "row",
      alignItems: "center",
    },


    rpBadge: {
      marginLeft: 8,
      borderRadius: 10,
      backgroundColor:
        "#FFF0D2",
      paddingHorizontal: 8,
      paddingVertical: 4,
    },


    rpBadgeText: {
      color: "#D69200",
      fontSize: 10,
      fontWeight: "700",
    },


    discountValue: {
      color: "#D31637",
      fontSize: 14,
      fontWeight: "700",
    },


    fareDivider: {
      height: 1,
      backgroundColor:
        "#F0E8E3",
      marginBottom: 14,
    },


    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },


    totalLabel: {
      color: "#7A747C",
      fontSize: 11,
      fontWeight: "700",
    },


    totalValue: {
      marginTop: 4,
      color: "#2D2831",
      fontSize: 22,
      fontWeight: "800",
    },


    earnedWrap: {
      alignItems:
        "flex-end",
    },


    earnedLabel: {
      color: "#7A747C",
      fontSize: 11,
      fontWeight: "700",
    },


    earnedValue: {
      marginTop: 4,
      color: "#D31637",
      fontSize: 13,
      fontWeight: "700",
    },


    /*
    |--------------------------------------------------------------------------
    | Bottom Bar
    |--------------------------------------------------------------------------
    */

    bottomBar: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor:
        "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor:
        "#EFE6E1",
    },


    payButtonWrap: {
      borderRadius: 18,
      overflow: "hidden",
    },

    disabledButton: {
      opacity: 0.7,
    },


    payButton: {
      minHeight: 54,
      paddingHorizontal: 22,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },


    payButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },


    footerNote: {
      marginTop: 10,
      textAlign: "center",
      color: "#9A93A0",
      fontSize: 11,
      fontWeight: "500",
      lineHeight: 16,
    },

  });
