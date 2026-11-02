import React, { useState } from "react";
import { View, Button, Alert, ActivityIndicator, StyleSheet } from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { checkPaymentStatus, createPaymentOrder, verifyPayment } from "../api/Payment";
import i18n from "../../../i18n";


const PaymentScreen = () => {
  const orderId = 101;
  const [loading, setLoading] = useState(false);

  const startPayment = async () => {
    try {
      setLoading(true);

      // ✅ Step 1: Create Order from Backend
      const data = await createPaymentOrder(orderId);

      const options = {
        key: data.key,
        amount: data.amount, // must be in paise
        currency: data.currency || "INR",
        order_id: data.orderId, // Razorpay order id
        name: "Reward Planners",
        description: "Order Payment",
        prefill: {
          email: "test@test.com",
          contact: "9999999999",
        },
        theme: { color: "#3399cc" },
      };

      setLoading(false);

      // ✅ Step 2: Open Razorpay Checkout
      RazorpayCheckout.open(options)
        .then(async (response) => {
          try {
            // ✅ Step 3: Verify Payment
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            if (verifyRes.success) {
              Alert.alert(i18n.t("products:paymentScreen.success"), i18n.t("products:paymentScreen.paymentVerifiedSuccessfully"));
            } else {
              Alert.alert(i18n.t("products:paymentScreen.verificationFailed"), i18n.t("products:paymentScreen.pleaseContactSupport"));
            }

          } catch (error) {
            __DEV__ && console.log("Verification error:", error);
            pollPaymentStatus();
          }
        })
        .catch((error: any) => {
          const errorCode = String(error?.code ?? "");
          const errorText =
            error?.description ||
            error?.message ||
            error?.error?.description ||
            "";

          const isUserCancelled =
            errorCode === "0" ||
            /cancel|cancelled|dismiss|closed|back/i.test(String(errorText));

          if (isUserCancelled) {
            Alert.alert(i18n.t("products:paymentScreen.paymentCancelled"), i18n.t("products:paymentScreen.youExitedThePaymentWindow"));
            return;
          }

          Alert.alert(
            i18n.t("products:paymentScreen.msg.paymentFailed"),
            String(errorText || i18n.t("products:r2.paymentCancelled"))
          );
        });

    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        i18n.t("products:paymentScreen.msg.error"),
        error?.response?.data?.message || "Failed to create order"
      );
    }
  };

  // ✅ Poll Payment Status (Backup Verification)
  const pollPaymentStatus = async () => {
    let attempts = 0;
    const maxAttempts = 5;

    const checkStatus = async () => {
      try {
        const res = await checkPaymentStatus(orderId);

        if (res.status === "paid" || res.status === "captured") {
          Alert.alert(i18n.t("products:paymentScreen.success"), i18n.t("products:paymentScreen.paymentVerifiedSuccessfully"));
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          Alert.alert(
            i18n.t("products:paymentScreen.msg.verificationPending"),
            i18n.t("products:paymentScreen.msg.paymentIsBeingVerifiedPlease")
          );
        }

      } catch  {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 2000);
        }
      }
    };

    checkStatus();
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3399cc" />
      ) : (
        <Button title="Pay ₹300" onPress={startPayment} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
});

export default PaymentScreen;