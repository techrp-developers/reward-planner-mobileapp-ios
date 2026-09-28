import React from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  createBusPaymentOrderApi,
  bookBusTicketApi,
  verifyBusPaymentApi,
} from "../../services/busBookingApi";

import type {
  CreateBusPaymentOrderResponse,
} from "../../services/busBookingApi";


/*
|--------------------------------------------------------------------------
| Payment Screen
|--------------------------------------------------------------------------
*/

export default function PaymentScreen() {
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
        "PaymentScreen"
      >
    >();


  /*
  |--------------------------------------------------------------------------
  | Params
  |--------------------------------------------------------------------------
  */

  const {
    bus,
    selectedSeats,
    passengers,
    totalAmount,
    boardingPoint,
    droppingPoint,
    blockResponse,
  } =
    route.params;


  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [
    creatingPaymentOrder,
    setCreatingPaymentOrder,
  ] =
    React.useState(
      false
    );


  const [
    paymentOrder,
    setPaymentOrder,
  ] =
    React.useState<
      CreateBusPaymentOrderResponse |
      null
    >(
      null
    );

  const [
    processingPayment,
    setProcessingPayment,
  ] =
    React.useState(
      false
    );


  /*
  |--------------------------------------------------------------------------
  | Local Booking
  |--------------------------------------------------------------------------
  */

  const orderRef =
    String(
      blockResponse
        ?.order_ref || blockResponse?.orderRef ||
      ""
    );


  const localOrderId =
    Number(
      blockResponse
        ?.localOrderId ||
      0
    );


  const blockKey =
    String(
      blockResponse
        ?.blockKey ||
      ""
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
  | Amount
  |--------------------------------------------------------------------------
  */

  const payableAmount =
    Number(
      blockResponse
        ?.payableAmount ||
      totalAmount ||
      0
    );


  /*
  |--------------------------------------------------------------------------
  | Route
  |--------------------------------------------------------------------------
  */

  const sourceCity =
    String(
      bus?.from ||
      "-"
    )
      .split(",")[0]
      .trim();


  const destinationCity =
    String(
      bus?.to ||
      "-"
    )
      .split(",")[0]
      .trim();


  /*
  |--------------------------------------------------------------------------
  | Boarding
  |--------------------------------------------------------------------------
  */

  const boardingName =
    String(
      boardingPoint
        ?.Name ||
      boardingPoint
        ?.Location ||
      "-"
    );


  /*
  |--------------------------------------------------------------------------
  | Dropping
  |--------------------------------------------------------------------------
  */

  const droppingName =
    String(
      droppingPoint
        ?.Name ||
      droppingPoint
        ?.Location ||
      "-"
    );

  const openRazorpayCheckout =
    React.useCallback(
      async (
        order:
          CreateBusPaymentOrderResponse
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
          "[BusBooking][Payment] RAZORPAY OPTIONS",
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
            "[BusBooking][Payment] BOOK SUCCESS",
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
            "[BusBooking][Payment] RAZORPAY ERROR",
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
  | Create Razorpay Order
  |--------------------------------------------------------------------------
  */

  const handleProceedToPayment =
    React.useCallback(
      async () => {

        /*
        |--------------------------------------------------------------------------
        | Prevent Double Tap
        |--------------------------------------------------------------------------
        */

        if (
          creatingPaymentOrder
        ) {

          return;
        }


        /*
        |--------------------------------------------------------------------------
        | Validate Block
        |--------------------------------------------------------------------------
        */

        if (
          !blockKey
        ) {

          showPopup({
            title: "Payment Error",
            message: "Seat block information is missing. Please select your seat again.",
            variant: "error",
          });


          return;
        }


        /*
        |--------------------------------------------------------------------------
        | Validate Local Booking
        |--------------------------------------------------------------------------
        */

        if (
          !orderRef
        ) {

          showPopup({
            title: "Payment Error",
            message: "Bus booking order reference is missing. Please select your seat again.",
            variant: "error",
          });


          return;
        }


        if (
          !localOrderId
        ) {

          showPopup({
            title: "Payment Error",
            message: "Local bus booking order is missing.",
            variant: "error",
          });


          return;
        }


        /*
        |--------------------------------------------------------------------------
        | Validate Amount
        |--------------------------------------------------------------------------
        */

        if (
          !Number.isFinite(
            payableAmount
          ) ||
          payableAmount <= 0
        ) {

          showPopup({
            title: "Payment Error",
            message: "Invalid payment amount.",
            variant: "error",
          });


          return;
        }


        /*
        |--------------------------------------------------------------------------
        | Existing Razorpay Order
        |--------------------------------------------------------------------------
        */

        if (
          paymentOrder
            ?.success &&
          paymentOrder
            ?.data
            ?.orderId
        ) {

          await openRazorpayCheckout(
            paymentOrder
          );
          return;
        }


        try {

          setCreatingPaymentOrder(
            true
          );


          console.log(
            "======================================"
          );


          console.log(
            "[BusBooking][Payment] CREATE ORDER REQUEST",
            {

              order_ref:
                orderRef,

              localOrderId,

              payableAmount,

              sourceCity,

              destinationCity,

              selectedSeats,
            }
          );


          console.log(
            "======================================"
          );


          /*
          |--------------------------------------------------------------------------
          | IMPORTANT
          |--------------------------------------------------------------------------
          |
          | We only send order_ref.
          |
          | We do NOT send amount from React Native.
          |
          |--------------------------------------------------------------------------
          */

          const response =
            await createBusPaymentOrderApi({

              order_ref:
                orderRef,
            });


          setPaymentOrder(
            response
          );


          console.log(
            "======================================"
          );


          console.log(
            "[BusBooking][Payment] CREATE ORDER SUCCESS",
            {

              reused:
                response.reused,

              razorpayOrderId:
                response
                  .data
                  .orderId,

              amount:
                response
                  .data
                  .amount,

              currency:
                response
                  .data
                  .currency,

              order_ref:
                response
                  .data
                  .order_ref,
            }
          );


          console.log(
            "======================================"
          );


          /*
          |--------------------------------------------------------------------------
          | CURRENT CHECKPOINT
          |--------------------------------------------------------------------------
          |
          | Razorpay order is now created.
          |
          | razorpay_orders should contain:
          |
          | module = busbooking
          | ref_id = BB-ORD-xxxx
          |
          |--------------------------------------------------------------------------
          */

          await openRazorpayCheckout(
            response
          );

          return;


          Alert.alert(
            "Payment Order Created",
            `Order: ${response.data.orderId}\nAmount: ₹${(
              Number(
                response
                  .data
                  .amount ||
                0
              ) /
              100
            ).toLocaleString(
              "en-IN"
            )}\n\nBus Ref: ${response.data.order_ref}`
          );


          /*
          |--------------------------------------------------------------------------
          | NEXT STEP
          |--------------------------------------------------------------------------
          |
          | After this checkpoint works, use the SAME Razorpay Checkout code
          | already used by your Service module.
          |
          | Values to pass into Service Razorpay checkout:
          |
          | response.data.key
          | response.data.orderId
          | response.data.amount
          | response.data.currency
          |
          | DO NOT call /book here yet.
          |
          |--------------------------------------------------------------------------
          */


        } catch (
          error: any
        ) {

          console.log(
            "[BusBooking][Payment] CREATE ORDER ERROR",
            error?.message ||
            error
          );


          const message =
            String(
              error?.message ||
              ""
            );


          showPopup({
            title: message.toLowerCase().includes("token")
              ? "Session Expired"
              : "Payment Error",
            message: message || "Unable to create Razorpay payment order.",
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

        destinationCity,

        localOrderId,

        openRazorpayCheckout,

        orderRef,

        payableAmount,

        paymentOrder,

        selectedSeats,

        sourceCity,
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
          style={
            styles.backButton
          }
          onPress={
            () =>
              navigation.goBack()
          }
        >

          <MaterialCommunityIcons
            name="chevron-left"
            size={30}
            color="#484249"
          />

        </TouchableOpacity>


        <Text
          style={
            styles.headerTitle
          }
        >
          Payment
        </Text>


        <View
          style={
            styles.headerSecure
          }
        >

          <MaterialCommunityIcons
            name="shield-check"
            size={23}
            color="#139B73"
          />

        </View>

      </View>


      {/*
      |--------------------------------------------------------------------------
      | Content
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
        | Amount Card
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.amountCard
          }
        >

          <Text
            style={
              styles.smallLabel
            }
          >
            TOTAL PAYABLE
          </Text>


          <Text
            style={
              styles.amount
            }
          >

            ₹
            {payableAmount
              .toLocaleString(
                "en-IN"
              )}

          </Text>


          <View
            style={
              styles.routeRow
            }
          >

            <MaterialCommunityIcons
              name="bus"
              size={20}
              color="#D31637"
            />


            <Text
              style={
                styles.routeText
              }
            >

              {sourceCity}

              {" → "}

              {destinationCity}

            </Text>

          </View>


          <Text
            style={
              styles.seatText
            }
          >

            {selectedSeats.length}

            {" "}

            {selectedSeats.length ===
            1
              ? "Seat"
              : "Seats"}

            {selectedSeats.length >
            0
              ? ` • ${selectedSeats
                  .map(
                    seat =>
                      String(
                        seat
                      )
                  )
                  .join(", ")}`
              : ""}

          </Text>

        </View>


        {/*
        |--------------------------------------------------------------------------
        | Trip Details
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.detailsCard
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            Trip Details
          </Text>


          <View
            style={
              styles.detailRow
            }
          >

            <View
              style={
                styles.detailIcon
              }
            >

              <MaterialCommunityIcons
                name="map-marker-outline"
                size={20}
                color="#D31637"
              />

            </View>


            <View
              style={
                styles.detailContent
              }
            >

              <Text
                style={
                  styles.detailLabel
                }
              >
                Boarding
              </Text>


              <Text
                style={
                  styles.detailValue
                }
              >
                {boardingName}
              </Text>

            </View>

          </View>


          <View
            style={
              styles.divider
            }
          />


          <View
            style={
              styles.detailRow
            }
          >

            <View
              style={
                styles.detailIcon
              }
            >

              <MaterialCommunityIcons
                name="map-marker-check-outline"
                size={20}
                color="#D31637"
              />

            </View>


            <View
              style={
                styles.detailContent
              }
            >

              <Text
                style={
                  styles.detailLabel
                }
              >
                Dropping
              </Text>


              <Text
                style={
                  styles.detailValue
                }
              >
                {droppingName}
              </Text>

            </View>

          </View>


          <View
            style={
              styles.divider
            }
          />


          <View
            style={
              styles.detailRow
            }
          >

            <View
              style={
                styles.detailIcon
              }
            >

              <MaterialCommunityIcons
                name="account-multiple-outline"
                size={20}
                color="#D31637"
              />

            </View>


            <View
              style={
                styles.detailContent
              }
            >

              <Text
                style={
                  styles.detailLabel
                }
              >
                Passengers
              </Text>


              <Text
                style={
                  styles.detailValue
                }
              >

                {Array.isArray(
                  passengers
                )
                  ? passengers.length
                  : selectedSeats.length}

              </Text>

            </View>

          </View>

        </View>


        {/*
        |--------------------------------------------------------------------------
        | Payment Methods
        |--------------------------------------------------------------------------
        */}

        <Text
          style={
            styles.sectionHeading
          }
        >
          Secure Payment
        </Text>


        <View
          style={
            styles.paymentMethodsCard
          }
        >

          <View
            style={
              styles.methodRow
            }
          >

            <View
              style={
                styles.methodIcon
              }
            >

              <MaterialCommunityIcons
                name="cellphone"
                size={22}
                color="#D31637"
              />

            </View>


            <View
              style={
                styles.methodContent
              }
            >

              <Text
                style={
                  styles.methodTitle
                }
              >
                UPI
              </Text>


              <Text
                style={
                  styles.methodSub
                }
              >
                Google Pay, PhonePe and supported UPI apps
              </Text>

            </View>

          </View>


          <View
            style={
              styles.methodDivider
            }
          />


          <View
            style={
              styles.methodRow
            }
          >

            <View
              style={
                styles.methodIcon
              }
            >

              <MaterialCommunityIcons
                name="credit-card-outline"
                size={22}
                color="#D31637"
              />

            </View>


            <View
              style={
                styles.methodContent
              }
            >

              <Text
                style={
                  styles.methodTitle
                }
              >
                Debit / Credit Card
              </Text>


              <Text
                style={
                  styles.methodSub
                }
              >
                Cards supported by Razorpay Checkout
              </Text>

            </View>

          </View>


          <View
            style={
              styles.methodDivider
            }
          />


          <View
            style={
              styles.methodRow
            }
          >

            <View
              style={
                styles.methodIcon
              }
            >

              <MaterialCommunityIcons
                name="bank-outline"
                size={22}
                color="#D31637"
              />

            </View>


            <View
              style={
                styles.methodContent
              }
            >

              <Text
                style={
                  styles.methodTitle
                }
              >
                Net Banking
              </Text>


              <Text
                style={
                  styles.methodSub
                }
              >
                Choose bank in secure checkout
              </Text>

            </View>

          </View>

        </View>


        {/*
        |--------------------------------------------------------------------------
        | Security
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.secureCard
          }
        >

          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={28}
            color="#139B73"
          />


          <View
            style={
              styles.secureContent
            }
          >

            <Text
              style={
                styles.secureTitle
              }
            >
              Secure Payment
            </Text>


            <Text
              style={
                styles.secureText
              }
            >
              Payment will be processed through your existing Razorpay integration.
            </Text>

          </View>

        </View>


        {/*
        |--------------------------------------------------------------------------
        | Razorpay Order Created
        |--------------------------------------------------------------------------
        */}

        {paymentOrder
          ?.success &&
        paymentOrder
          ?.data
          ?.orderId ? (

          <View
            style={
              styles.successCard
            }
          >

            <MaterialCommunityIcons
              name="check-circle"
              size={34}
              color="#139B73"
            />


            <View
              style={
                styles.successContent
              }
            >

              <Text
                style={
                  styles.successTitle
                }
              >
                Razorpay Order Created
              </Text>


              <Text
                style={
                  styles.successText
                }
              >
                {paymentOrder
                  .data
                  .orderId}
              </Text>


              <Text
                style={
                  styles.successRef
                }
              >
                {paymentOrder
                  .data
                  .order_ref}
              </Text>

            </View>

          </View>

        ) : null}


        {/*
        |--------------------------------------------------------------------------
        | Local Reference
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.referenceCard
          }
        >

          <Text
            style={
              styles.referenceLabel
            }
          >
            Booking Reference
          </Text>


          <Text
            style={
              styles.referenceValue
            }
          >
            {orderRef ||
              "-"}
          </Text>

        </View>

      </ScrollView>


      {/*
      |--------------------------------------------------------------------------
      | Bottom
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
            styles.payButtonWrapper,

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

            ) : paymentOrder
                ?.success ? (

              <>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={20}
                  color="#FFFFFF"
                />


                <Text
                  style={
                    styles.payButtonText
                  }
                >
                  Payment Order Ready
                </Text>
              </>

            ) : (

              <>
                <Text
                  style={
                    styles.payButtonText
                  }
                >

                  Pay ₹
                  {payableAmount
                    .toLocaleString(
                      "en-IN"
                    )}

                </Text>


                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color="#FFFFFF"
                />
              </>

            )}

          </LinearGradient>

        </TouchableOpacity>


        <View
          style={
            styles.poweredRow
          }
        >

          <MaterialCommunityIcons
            name="lock-outline"
            size={13}
            color="#8D8790"
          />


          <Text
            style={
              styles.poweredText
            }
          >
            Secure payment powered by Razorpay
          </Text>

        </View>

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

      flex:
        1,

      backgroundColor:
        "#FBF8F5",
    },


    header: {

      minHeight:
        62,

      paddingHorizontal:
        12,

      flexDirection:
        "row",

      alignItems:
        "center",

      backgroundColor:
        "#FBF8F5",
    },


    backButton: {

      width:
        42,

      height:
        42,

      alignItems:
        "center",

      justifyContent:
        "center",
    },


    headerTitle: {

      flex:
        1,

      marginLeft:
        4,

      fontSize:
        20,

      fontWeight:
        "700",

      color:
        "#312C34",
    },


    headerSecure: {

      width:
        42,

      height:
        42,

      alignItems:
        "center",

      justifyContent:
        "center",
    },


    scroll: {

      flex:
        1,
    },


    content: {

      paddingHorizontal:
        16,

      paddingTop:
        14,

      paddingBottom:
        30,
    },


    amountCard: {

      padding:
        20,

      backgroundColor:
        "#FFFFFF",

      borderRadius:
        18,

      borderWidth:
        1,

      borderColor:
        "#EBE2DE",
    },


    smallLabel: {

      fontSize:
        11,

      fontWeight:
        "700",

      letterSpacing:
        1.1,

      color:
        "#9A939B",
    },


    amount: {

      marginTop:
        5,

      fontSize:
        34,

      fontWeight:
        "800",

      color:
        "#29242C",
    },


    routeRow: {

      marginTop:
        18,

      flexDirection:
        "row",

      alignItems:
        "center",
    },


    routeText: {

      marginLeft:
        9,

      fontSize:
        15,

      fontWeight:
        "700",

      color:
        "#403A43",
    },


    seatText: {

      marginTop:
        8,

      marginLeft:
        29,

      fontSize:
        13,

      color:
        "#8E8791",
    },


    detailsCard: {

      marginTop:
        18,

      padding:
        18,

      backgroundColor:
        "#FFFFFF",

      borderRadius:
        18,

      borderWidth:
        1,

      borderColor:
        "#EBE2DE",
    },


    sectionTitle: {

      marginBottom:
        8,

      fontSize:
        17,

      fontWeight:
        "700",

      color:
        "#353039",
    },


    detailRow: {

      flexDirection:
        "row",

      alignItems:
        "center",

      minHeight:
        66,
    },


    detailIcon: {

      width:
        42,

      height:
        42,

      borderRadius:
        12,

      backgroundColor:
        "#FFF0F2",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight:
        13,
    },


    detailContent: {

      flex:
        1,
    },


    detailLabel: {

      fontSize:
        11,

      color:
        "#A29BA4",
    },


    detailValue: {

      marginTop:
        3,

      fontSize:
        14,

      fontWeight:
        "700",

      color:
        "#3D3740",
    },


    divider: {

      height:
        1,

      marginLeft:
        55,

      backgroundColor:
        "#F1EBE8",
    },


    sectionHeading: {

      marginTop:
        24,

      marginBottom:
        12,

      fontSize:
        18,

      fontWeight:
        "700",

      color:
        "#353039",
    },


    paymentMethodsCard: {

      backgroundColor:
        "#FFFFFF",

      borderRadius:
        18,

      borderWidth:
        1,

      borderColor:
        "#EBE2DE",

      overflow:
        "hidden",
    },


    methodRow: {

      minHeight:
        80,

      paddingHorizontal:
        16,

      flexDirection:
        "row",

      alignItems:
        "center",
    },


    methodIcon: {

      width:
        44,

      height:
        44,

      borderRadius:
        12,

      backgroundColor:
        "#FFF0F2",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight:
        14,
    },


    methodContent: {

      flex:
        1,
    },


    methodTitle: {

      fontSize:
        15,

      fontWeight:
        "700",

      color:
        "#3A343D",
    },


    methodSub: {

      marginTop:
        4,

      fontSize:
        12,

      lineHeight:
        17,

      color:
        "#96909A",
    },


    methodDivider: {

      height:
        1,

      marginLeft:
        74,

      backgroundColor:
        "#F0E9E6",
    },


    secureCard: {

      marginTop:
        20,

      padding:
        16,

      flexDirection:
        "row",

      alignItems:
        "center",

      borderRadius:
        16,

      backgroundColor:
        "#EEFBF7",

      borderWidth:
        1,

      borderColor:
        "#CBEDE2",
    },


    secureContent: {

      flex:
        1,

      marginLeft:
        12,
    },


    secureTitle: {

      fontSize:
        14,

      fontWeight:
        "700",

      color:
        "#08745E",
    },


    secureText: {

      marginTop:
        4,

      fontSize:
        12,

      lineHeight:
        17,

      color:
        "#60887F",
    },


    successCard: {

      marginTop:
        18,

      padding:
        16,

      flexDirection:
        "row",

      alignItems:
        "center",

      borderRadius:
        16,

      backgroundColor:
        "#EDFFF8",

      borderWidth:
        1,

      borderColor:
        "#C6EBDD",
    },


    successContent: {

      flex:
        1,

      marginLeft:
        12,
    },


    successTitle: {

      fontSize:
        14,

      fontWeight:
        "700",

      color:
        "#08745E",
    },


    successText: {

      marginTop:
        5,

      fontSize:
        12,

      color:
        "#58766F",
    },


    successRef: {

      marginTop:
        3,

      fontSize:
        12,

      fontWeight:
        "600",

      color:
        "#58766F",
    },


    referenceCard: {

      marginTop:
        18,

      padding:
        15,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      borderRadius:
        14,

      backgroundColor:
        "#F3EEEE",
    },


    referenceLabel: {

      fontSize:
        12,

      color:
        "#8D858D",
    },


    referenceValue: {

      fontSize:
        13,

      fontWeight:
        "700",

      color:
        "#4E464E",
    },


    bottomBar: {

      paddingHorizontal:
        16,

      paddingTop:
        14,

      paddingBottom:
        14,

      backgroundColor:
        "#FFFFFF",

      borderTopWidth:
        1,

      borderTopColor:
        "#EEE6E2",
    },


    payButtonWrapper: {

      overflow:
        "hidden",

      borderRadius:
        14,
    },


    disabledButton: {

      opacity:
        0.65,
    },


    payButton: {

      minHeight:
        56,

      paddingHorizontal:
        18,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        8,
    },


    payButtonText: {

      fontSize:
        16,

      fontWeight:
        "700",

      color:
        "#FFFFFF",
    },


    poweredRow: {

      marginTop:
        9,

      flexDirection:
        "row",

      justifyContent:
        "center",

      alignItems:
        "center",
    },


    poweredText: {

      marginLeft:
        5,

      fontSize:
        11,

      color:
        "#8D8790",
    },
  });
