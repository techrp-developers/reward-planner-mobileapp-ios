import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import { handleNavigateWithPrefetch } from "../../navigation/navigationPerformance";

type Props = {
  title?: string;
  onBackPress?: () => void;
  onHelpPress?: () => void;
  showHelp?: boolean;
  isDark?: boolean;
};

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export default function OrderHeading({
  title = "My Orders",
  onBackPress,
  onHelpPress,
  showHelp = true,
  isDark = false,
}: Props) {
  const navigation = useNavigation<Nav>();

  const handleBack = () => {
    handleNavigateWithPrefetch({
      navigate: onBackPress ?? (() => navigation.goBack()),
    });
  };

  const handleHelp = () => {
    handleNavigateWithPrefetch({
      navigate: onHelpPress ?? (() => {
        try {
          (navigation as any).navigate("HelpForm");
        } catch {
          const parentNav = (navigation as any).getParent?.();
          const rootNav = parentNav?.getParent?.()?.getParent?.();

          rootNav?.navigate?.("HelpForm");
        }
      }),
    });
  };

  const bg = isDark ? "#09090B" : "#FFFFFF";
  const iconColor = isDark ? "#D1D5DB" : "#374151";
  const borderColor = isDark ? "#27272A" : "#F3F4F6";

  return (
    <SafeAreaView edges={["top"]} style={[styles.safe, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: bg, borderBottomColor: borderColor }]}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={styles.iconBtn}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={iconColor}
          />
        </TouchableOpacity>

        {/* Title */}
        <Text style={[styles.title, { color: iconColor }]} numberOfLines={1}>
          {title}
        </Text>

        {showHelp ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleHelp}
            style={[styles.helpBtn, { borderColor: isDark ? "#3F3F46" : "#E5E7EB", backgroundColor: bg }]}
          >
            <MaterialCommunityIcons
              name="chat-outline"
              size={16}
              color="#EC4899"
              style={styles.helpIcon}
            />
            <Text style={styles.helpText}>Help</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },

  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  helpBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },

  helpIcon: {
    marginRight: 4,
  },

  helpText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EC4899", // pink like design
  },
});
