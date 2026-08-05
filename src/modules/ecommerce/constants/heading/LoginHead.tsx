import React from "react";
import {
  View,
  useWindowDimensions,
  StatusBar,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import BackgroundImage from "../../../../navbar/assete/Background1.jpeg";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  showSearch?: boolean;
  search?: string;
  onChangeSearch?: (v: string) => void;
  onFocusSearch?: () => void;
  onBack?: () => void;
};

function LoginHead({ showSearch, search, onChangeSearch, onFocusSearch, onBack }: Props) {
  const { width } = useWindowDimensions();
  const { isDark, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = Math.round(width * 0.4);

  return (
    <View style={[styles.container, { height: HEADER_HEIGHT }]}>
      <StatusBar translucent backgroundColor="transparent" />

      <Image
        source={BackgroundImage}
        style={styles.absoluteFill}
        resizeMode="cover"
      />

      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={[styles.backBtn, { top: insets.top + 10 }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {showSearch && (
        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={isDark ? "#FFFFFF" : "#111827"} />
          <TextInput
            placeholder="Search products"
            placeholderTextColor={theme.secondaryText}
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={onChangeSearch}
            onFocus={onFocusSearch}
          />
        </View>
      )}
    </View>
  );
}

export default LoginHead;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  backBtn: {
    position: "absolute",
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
    textAlignVertical: "center",
  },
});
