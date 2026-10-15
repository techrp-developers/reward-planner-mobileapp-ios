import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import BusBookingStatusPopup, {
  useBusBookingPopup,
} from "../BusBookingStatusPopup";
import type { BusBookingStackParamList } from "../../navigation/BusBookingStack";
import {
  cancelBusSeatApi,
  getBusOrderDetailApi,
  type BusOrderDetail,
  type BusOrderPassenger,
} from "../../services/busBookingApi";
import {
  BUS_STATUS_COLORS,
  formatBusAmount,
  formatBusDate,
  formatBusTime,
  getBusOrderStatus,
  parseBusDateTime,
} from "../../utils/busOrderFormat";

const MAX_REMARKS_LENGTH = 500;

const getPolicyText = (policy: any) =>
  String(policy?.PolicyString || policy?.policyString || "").trim();

const getSeatCancellationLabel = (passenger: BusOrderPassenger) => {
  if (passenger.cancellationStatus === "processing") {
    return "Cancellation in progress";
  }

  if (passenger.cancellationStatus !== "succeeded") {
    return null;
  }

  if (!passenger.refundAmount) {
    return "Cancelled";
  }

  return passenger.refundStatus === "processed"
    ? `Cancelled - ${formatBusAmount(passenger.refundAmount)} refunded`
    : `Cancelled - ${formatBusAmount(passenger.refundAmount)} refund in progress`;
};

export default function BusOrderDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BusBookingStackParamList>>();
  const route =
    useRoute<RouteProp<BusBookingStackParamList, "BusOrderDetailScreen">>();
  const { orderRef } = route.params;
  const { popup, showPopup, hidePopup } = useBusBookingPopup();

  const [order, setOrder] = React.useState<BusOrderDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cancelSeat, setCancelSeat] = React.useState<string | null>(null);
  const [remarks, setRemarks] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);

  const loadOrder = React.useCallback(async () => {
    try {
      setOrder(await getBusOrderDetailApi(orderRef));
      setError(null);
    } catch (loadError: any) {
      setError(loadError?.message || "Unable to load this bus booking");
    }
  }, [orderRef]);

  React.useEffect(() => {
    let active = true;

    loadOrder().finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [loadOrder]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadOrder();
    setRefreshing(false);
  }, [loadOrder]);

  const closeCancelModal = React.useCallback(() => {
    if (!cancelling) {
      setCancelSeat(null);
      setRemarks("");
    }
  }, [cancelling]);

  const handleConfirmCancel = React.useCallback(async () => {
    const seatName = cancelSeat;
    const reason = remarks.trim();

    if (!seatName || !reason || cancelling) {
      return;
    }

    setCancelling(true);

    try {
      const result = await cancelBusSeatApi({
        order_ref: orderRef,
        seatName,
        remarks: reason,
      });

      setCancelSeat(null);
      setRemarks("");

      showPopup({
        title: result.completed ? "Seat Cancelled" : "Cancellation In Progress",
        message: result.completed
          ? result.refundAmount > 0
            ? `Seat ${seatName} is cancelled. ${formatBusAmount(result.refundAmount)} will be refunded to your original payment method.`
            : `Seat ${seatName} is cancelled. No refund is due under the operator's cancellation policy.`
          : `We are confirming the cancellation of seat ${seatName} with the operator. Check this booking again shortly.`,
        variant: result.completed ? "success" : "info",
      });
    } catch (cancelError: any) {
      showPopup({
        title: "Cancellation Failed",
        message: cancelError?.message || "Unable to cancel bus seat",
        variant: "error",
      });
    } finally {
      setCancelling(false);
      // Whatever happened, show the booking as the backend now has it.
      loadOrder();
    }
  }, [cancelSeat, cancelling, loadOrder, orderRef, remarks, showPopup]);

  const status = order
    ? getBusOrderStatus(order.status, order.paymentStatus)
    : null;
  const statusColors = status ? BUS_STATUS_COLORS[status.tone] : null;

  // A seat can only be cancelled before the bus leaves.
  const departure = parseBusDateTime(order?.departureTime);
  const canCancelSeats =
    Boolean(order?.cancellable) &&
    (!departure || departure.getTime() > Date.now());

  const policyLines = (order?.cancellationPolicy || [])
    .map(getPolicyText)
    .filter(Boolean);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#77737B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#D31637" />
        </View>
      ) : !order ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={34} color="#C81E3A" />
          <Text style={styles.stateTitle}>Could not load booking</Text>
          <Text style={styles.stateMessage}>{error}</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#D31637"]}
              tintColor="#D31637"
            />
          }
        >
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <Text style={styles.routeText}>
                {order.sourceCity || "-"}{" "}
                <Text style={styles.routeArrow}>{"->"}</Text>{" "}
                {order.destinationCity || "-"}
              </Text>
              {status && statusColors ? (
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: statusColors.background },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusColors.text }]}>
                    {status.label}
                  </Text>
                </View>
              ) : null}
            </View>

            {order.operatorName ? (
              <Text style={styles.operatorText}>
                {order.operatorName}
                {order.busType ? ` - ${order.busType}` : ""}
              </Text>
            ) : null}

            <View style={styles.timingRow}>
              <View style={styles.timingBlock}>
                <Text style={styles.timeText}>{formatBusTime(order.departureTime)}</Text>
                <Text style={styles.dateText}>
                  {formatBusDate(order.departureTime || order.journeyDate)}
                </Text>
                {order.boardingPointName ? (
                  <Text style={styles.pointText}>{order.boardingPointName}</Text>
                ) : null}
              </View>

              <MaterialCommunityIcons name="arrow-right" size={18} color="#D31637" />

              <View style={[styles.timingBlock, styles.timingBlockRight]}>
                <Text style={styles.timeText}>{formatBusTime(order.arrivalTime)}</Text>
                <Text style={[styles.dateText, styles.textRight]}>
                  {formatBusDate(order.arrivalTime)}
                </Text>
                {order.droppingPointName ? (
                  <Text style={[styles.pointText, styles.textRight]}>
                    {order.droppingPointName}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ticket</Text>
            <DetailRow label="Booking Ref" value={order.orderRef} />
            {order.ticketNo ? (
              <DetailRow label="Ticket No" value={order.ticketNo} />
            ) : null}
            {order.travelOperatorPNR ? (
              <DetailRow label="Operator PNR" value={order.travelOperatorPNR} />
            ) : null}
            <DetailRow label="Amount Paid" value={formatBusAmount(order.amountPaid)} />
            <DetailRow label="Booked On" value={formatBusDate(order.bookedAt)} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Passengers</Text>

            {order.passengers.map((passenger) => {
              const cancellationLabel = getSeatCancellationLabel(passenger);
              const passengerMeta = [
                passenger.gender,
                passenger.age ? `${passenger.age} yrs` : null,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <View key={passenger.seatName} style={styles.passengerRow}>
                  <View style={styles.passengerTextWrap}>
                    <Text style={styles.passengerName}>
                      {passenger.name || "Passenger"}
                    </Text>
                    <Text style={styles.passengerMeta}>
                      Seat {passenger.seatName}
                      {passengerMeta ? ` - ${passengerMeta}` : ""}
                    </Text>
                    {cancellationLabel ? (
                      <Text style={styles.cancelledText}>{cancellationLabel}</Text>
                    ) : null}
                  </View>

                  {canCancelSeats && !cancellationLabel ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.cancelSeatButton}
                      onPress={() => setCancelSeat(passenger.seatName)}
                    >
                      <Text style={styles.cancelSeatButtonText}>Cancel seat</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </View>

          {order.refunds.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Refunds</Text>
              {order.refunds.map((refund, index) => (
                <DetailRow
                  key={`${refund.reason}-${index}`}
                  label={
                    refund.reason === "booking_failed"
                      ? "Booking not completed"
                      : "Seat cancellation"
                  }
                  value={`${formatBusAmount(refund.amount)} - ${
                    refund.status === "processed" ? "Refunded" : "In progress"
                  }`}
                />
              ))}
            </View>
          ) : null}

          {policyLines.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cancellation Policy</Text>
              {policyLines.map((line, index) => (
                <Text key={`${line}-${index}`} style={styles.policyText}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}

      <Modal
        visible={cancelSeat !== null}
        transparent
        animationType="fade"
        onRequestClose={closeCancelModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancel seat {cancelSeat}?</Text>
            <Text style={styles.modalMessage}>
              The refund depends on the operator's cancellation policy and goes
              back to your original payment method.
            </Text>

            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Reason for cancellation"
              placeholderTextColor="#B0AAB3"
              maxLength={MAX_REMARKS_LENGTH}
              multiline
              editable={!cancelling}
              style={styles.remarksInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={cancelling}
                style={styles.modalSecondaryButton}
                onPress={closeCancelModal}
              >
                <Text style={styles.modalSecondaryText}>Keep seat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                disabled={cancelling || !remarks.trim()}
                style={[
                  styles.modalPrimaryButton,
                  cancelling || !remarks.trim() ? styles.buttonDisabled : null,
                ]}
                onPress={handleConfirmCancel}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalPrimaryText}>Cancel seat</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBF8F4",
  },
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
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#3B3740",
    fontSize: 17,
    fontWeight: "700",
    marginRight: 38,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  stateTitle: {
    marginTop: 12,
    color: "#3B3740",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  stateMessage: {
    marginTop: 6,
    color: "#8F8F95",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 26,
    borderRadius: 21,
    backgroundColor: "#D31637",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E2DA",
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#3B3740",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeText: {
    flex: 1,
    color: "#3B3740",
    fontSize: 17,
    fontWeight: "700",
  },
  routeArrow: {
    color: "#D31637",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  operatorText: {
    marginTop: 4,
    color: "#8F8F95",
    fontSize: 13,
    fontWeight: "500",
  },
  timingRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  timingBlock: {
    flex: 1,
  },
  timingBlockRight: {
    alignItems: "flex-end",
  },
  timeText: {
    color: "#3B3740",
    fontSize: 20,
    fontWeight: "800",
  },
  dateText: {
    marginTop: 2,
    color: "#5B5860",
    fontSize: 12,
    fontWeight: "600",
  },
  pointText: {
    marginTop: 4,
    color: "#8F8F95",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
  },
  textRight: {
    textAlign: "right",
  },
  detailRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailLabel: {
    color: "#8F8F95",
    fontSize: 13,
    fontWeight: "500",
  },
  detailValue: {
    flex: 1,
    color: "#3B3740",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  passengerRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  passengerTextWrap: {
    flex: 1,
  },
  passengerName: {
    color: "#3B3740",
    fontSize: 14,
    fontWeight: "700",
  },
  passengerMeta: {
    marginTop: 2,
    color: "#8F8F95",
    fontSize: 12,
    fontWeight: "500",
  },
  cancelledText: {
    marginTop: 4,
    color: "#C77900",
    fontSize: 12,
    fontWeight: "600",
  },
  cancelSeatButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#D31637",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelSeatButtonText: {
    color: "#D31637",
    fontSize: 12,
    fontWeight: "700",
  },
  policyText: {
    marginTop: 6,
    color: "#5B5860",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 22,
  },
  modalTitle: {
    color: "#25222A",
    fontSize: 18,
    fontWeight: "800",
  },
  modalMessage: {
    marginTop: 8,
    color: "#66616D",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
  },
  remarksInput: {
    marginTop: 14,
    minHeight: 84,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8E2DA",
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#3B3740",
    fontSize: 14,
    textAlignVertical: "top",
  },
  modalActions: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8E2DA",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryText: {
    color: "#5B5860",
    fontSize: 14,
    fontWeight: "700",
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#D31637",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
