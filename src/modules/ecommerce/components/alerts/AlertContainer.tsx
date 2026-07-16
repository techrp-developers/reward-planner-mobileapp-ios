import React, { useContext } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertContext } from "./AlertContext";
import { AlertItem } from "./AlertItem";

export function AlertContainer() {
  const context = useContext(AlertContext);

  if (!context || context.alerts.length === 0) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.alertsList}>
        {context.alerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onDismiss={context.dismiss}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },

  alertsList: {
    paddingVertical: 12,
  },
});
