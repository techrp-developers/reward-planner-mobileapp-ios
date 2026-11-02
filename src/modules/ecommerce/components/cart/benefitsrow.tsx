import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";

type BenefitsRowProps = {
  is_returnable?: number | boolean;
  is_replaceable?: number | boolean;
  return_window_days?: number;
};

export default function BenefitsRow(props: BenefitsRowProps) {
  const { t: tx } = useTranslation();
  const { theme } = useAppTheme();
  const isReturnable = Boolean(props.is_returnable);
  const isReplaceable = Boolean(props.is_replaceable);

  const returnText = isReturnable
    ? `${props.return_window_days ?? 7} Day Return`
    : i18n.t("products:r2.nonReturnable");

  const replacementText = isReplaceable ? i18n.t("products:r2.replacementAvailable") : i18n.t("products:r2.noReplacement");

  return (
    <View style={styles.benefitsRow}>
      <View style={styles.benefitItem}>
        <MaterialCommunityIcons
          name={isReturnable ? "refresh" : "close-circle-outline"}
          size={26}
          color={isReturnable ? "#10B981" : "#EF4444"}
        />
        <Text style={[styles.benefitText, isReturnable ? styles.textGreen : styles.textRed]}>
          {returnText}
        </Text>
      </View>

      <View style={styles.benefitItem}>
        <MaterialCommunityIcons
          name={isReplaceable ? "swap-horizontal" : "close-circle-outline"}
          size={26}
          color={isReplaceable ? "#6366F1" : "#EF4444"}
        />
        <Text style={[styles.benefitText, isReplaceable ? styles.textIndigo : styles.textRed]}>
          {replacementText}
        </Text>
      </View>

      <View style={styles.benefitItem}>
        <MaterialCommunityIcons name="flash" size={26} color="#F97316" />
        <Text style={[styles.benefitText, { color: theme.secondaryText }]}>{tx("products:benefitsrow.fastDelivery")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  benefitsRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  benefitItem: {
    width: "33.33%",
    alignItems: "center",
    gap: 6,
  },

  benefitText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#444",
    textAlign: "center",
  },

  textGreen:  { color: "#10B981" },
  textIndigo: { color: "#6366F1" },
  textRed:    { color: "#EF4444" },
});
