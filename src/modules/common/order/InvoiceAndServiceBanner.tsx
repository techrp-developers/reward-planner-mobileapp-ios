import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import Share from "react-native-share";
import ServiceBanner from "../../../assets/order/serviceBanner.svg";
import { fetchOrderInvoice } from "../../ecommerce/api/OrderApi";

type InvoiceAndServiceBannerProps = {
  orderId: number | string;
};

export default function InvoiceAndServiceBanner({ orderId }: InvoiceAndServiceBannerProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadInvoice = async () => {
    try {
      setIsDownloading(true);
      const response = await fetchOrderInvoice(orderId);

      if (!response.success) {
        const errorMessage =
          "message" in response && response.message
            ? response.message
            : "Could not fetch invoice PDF";
        Alert.alert("Download Failed", errorMessage);
        return;
      }

      await Share.open({
        title: "Download Invoice",
        url: `data:application/pdf;base64,${response.base64}`,
        type: "application/pdf",
        filename: response.fileName.replace(/\.pdf$/i, ""),
        failOnCancel: false,
        saveToFiles: Platform.OS === "ios",
        ...(Platform.OS === "android" ? ({ useInternalStorage: true } as Record<string, unknown>) : {}),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Could not download invoice PDF";
      Alert.alert("Download Failed", message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Invoice row */}
      <View style={styles.invoiceRow}>
        <Text style={styles.invoiceText}>
          Save a copy of your order
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleDownloadInvoice}
          disabled={isDownloading}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.downloadAction}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : (
            <Text style={styles.downloadText}>Download Invoice</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Banner card */}
      <View style={styles.bannerCard}>
        <ServiceBanner width="100%" height={200} />
      </View>

      {/* Pagination dots (static) */}
      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },

  /* Invoice row */
  invoiceRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  invoiceText: {
    fontSize: 13,
    color: "#374151",
  },

  downloadText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366F1",
  },

  downloadAction: {
    minWidth: 110,
    alignItems: "flex-end",
  },

  /* Banner */
  bannerCard: {
    // backgroundColor: "#FFF7ED",
    // borderRadius: 14,
    overflow: "hidden",
    paddingVertical: 0,
  },

  /* Dots */
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 4,
  },

  dotActive: {
    backgroundColor: "#111827",
    width: 16,
    borderRadius: 4,
  },
});
