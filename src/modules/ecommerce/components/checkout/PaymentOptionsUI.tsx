import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type PaymentKey = "phonepe" | "any_upi" | "card";

const CARD_BG = "#FFFFFF";
const BORDER = "#CCCCCC";
const PURPLE = "#6A55FF";
const MUTED = "#6B7280";
const GREEN = "#16A34A";

export default function PaymentOptionsUI() {
    const [selected, setSelected] = useState<PaymentKey>("phonepe");

    const upiOptions = useMemo(
        () => [
            {
                key: "phonepe" as const,
                title: "Phonepe",
                subtitle: "",
                extra: "",
            },
            {
                key: "any_upi" as const,
                title: "Pay by any UPI App",
                subtitle: "Google Pay, Paytm , PhonePe and more",
                extra: "",
            },
        ],
        []
    );

    return (
        <View style={styles.screen}>
            {/* UPI */}
            <Text style={styles.sectionTitle}>UPI</Text>

            <View style={styles.groupCard}>
                {upiOptions.map((opt, idx) => {
                    const isSelected = selected === opt.key;
                    return (
                        <TouchableOpacity
                            key={opt.key}
                            activeOpacity={0.85}
                            onPress={() => setSelected(opt.key)}
                            style={[
                                styles.optionRow,
                                isSelected && styles.optionRowSelected,
                                idx === 0 && styles.optionFirst,
                                idx === upiOptions.length - 1 && styles.optionLast,
                            ]}
                        >
                            <Radio checked={isSelected} />

                            <View style={styles.textBlock}>
                                <Text style={styles.optionTitle}>{opt.title}</Text>

                                {!!opt.subtitle && (
                                    <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                                )}

                                {!!opt.extra && <Text style={styles.optionExtra}>{opt.extra}</Text>}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Card */}
            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Card</Text>

            <View style={styles.singleCard}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelected("card")}
                    style={[
                        styles.optionRow,
                        selected === "card" && styles.optionRowSelected,
                        styles.optionSingle,
                    ]}
                >
                    <Radio checked={selected === "card"} />

                    <View style={styles.textBlock}>
                        <Text style={styles.optionTitle}>Credit / Debit / ATM Card</Text>
                        <Text style={styles.optionSubtitle}>Add and secure cards as per RBI guidelines</Text>

                        <View style={styles.cardBottomRow}>
                            <Text style={styles.optionExtraGreen}>Get upto 5% cashback</Text>
                            <Text style={styles.optionExtraGreen}>  2 more offers available</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Grey banner text */}
            <View style={styles.banner}>
                <Text style={styles.bannerText}>
                    583 Thousands Happy Customers{"\n"}and Still Counting!
                </Text>
                <Text style={styles.bannerEmoji}>☺</Text>
            </View>


        </View>
    );
}

function Radio({ checked }: { checked: boolean }) {
    return (
        <View style={[styles.radioOuter, checked && styles.radioOuterChecked]}>
            {checked ? <View style={styles.radioInner} /> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        paddingTop: 14,
    },

    sectionTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#111",
        marginBottom: 10,
                paddingHorizontal: 16,

    },

    // group card (UPI)
    groupCard: {
        backgroundColor: CARD_BG,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        overflow: "hidden",
    },

    // single card (Card)
    singleCard: {
        backgroundColor: CARD_BG,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        overflow: "hidden",
    },

    optionRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 14,
        paddingHorizontal: 14,
        backgroundColor: CARD_BG,
    },

    optionRowSelected: {
        backgroundColor: "#F2F4FF", // light selected bg like screenshot
    },

    optionFirst: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },

    optionLast: {
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },

    optionSingle: {
        borderRadius: 12,
    },

    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.6,
        borderColor: "#9CA3AF",
        marginTop: 2,
        justifyContent: "center",
        alignItems: "center",
    },

    radioOuterChecked: {
        borderColor: PURPLE,
    },

    radioInner: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: PURPLE,
    },

    textBlock: {
        flex: 1,
        paddingLeft: 12,
    },

    optionTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#111",
        lineHeight: 18,
    },

    optionSubtitle: {
        marginTop: 3,
        fontSize: 13,
        color: MUTED,
        lineHeight: 17,
    },

    optionExtra: {
        marginTop: 4,
        fontSize: 12.5,
        color: MUTED,
    },

    cardBottomRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 4,
    },

    optionExtraGreen: {
        fontSize: 12.5,
        color: GREEN,
        fontWeight: "700",
    },

    banner: {
        marginTop: 28,
        backgroundColor: "#F8F9FD",
        borderRadius: 12,
        paddingVertical: 24,
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.35, // faded watermark look
    },

    bannerText: {
        textAlign: "center",
        fontSize: 20,
        fontWeight: "800",
        color: "#6B7280",
        lineHeight: 26,
    },

    bannerEmoji: {
        marginTop: 10,
        fontSize: 22,
        color: "#6B7280",
    },
});
