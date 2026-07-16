import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { AlertConfig, AlertType } from "./AlertTypes";

interface AlertItemProps {
  alert: AlertConfig;
  onDismiss: (id: string) => void;
}

const getAlertStyles = (type: AlertType) => {
  const styleMap = {
    success: {
      bgColor: "#E8F5E9",
      borderColor: "#4CAF50",
      titleColor: "#2E7D32",
      messageColor: "#558B2F",
      icon: "check-circle",
      iconColor: "#4CAF50",
    },
    error: {
      bgColor: "#FFEBEE",
      borderColor: "#F44336",
      titleColor: "#C62828",
      messageColor: "#D32F2F",
      icon: "alert-circle",
      iconColor: "#F44336",
    },
    warning: {
      bgColor: "#FFF3E0",
      borderColor: "#FF9800",
      titleColor: "#E65100",
      messageColor: "#F57C00",
      icon: "alert",
      iconColor: "#FF9800",
    },
    info: {
      bgColor: "#E3F2FD",
      borderColor: "#2196F3",
      titleColor: "#1565C0",
      messageColor: "#1976D2",
      icon: "information",
      iconColor: "#2196F3",
    },
  };
  return styleMap[type];
};

export function AlertItem({ alert, onDismiss }: AlertItemProps) {
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const alertStyles = getAlertStyles(alert.type);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(alert.id);
    });
  };

  const customStyle: ViewStyle = {
    transform: [{ translateY: slideAnim }],
    opacity: opacityAnim,
  };

  return (
    <Animated.View style={[styles.alertContainer, customStyle]}>
      <View
        style={[
          styles.alert,
          {
            backgroundColor: alertStyles.bgColor,
            borderLeftColor: alertStyles.borderColor,
          },
        ]}
      >
        {/* Icon */}
        <MaterialCommunityIcons
          name={alertStyles.icon}
          size={24}
          color={alertStyles.iconColor}
          style={styles.icon}
        />

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: alertStyles.titleColor }]}>
            {alert.title}
          </Text>
          <Text style={[styles.message, { color: alertStyles.messageColor }]}>
            {alert.message}
          </Text>

          {/* Action Button */}
          {alert.actionText && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                alert.onAction?.();
                handleDismiss();
              }}
            >
              <Text
                style={[styles.actionText, { color: alertStyles.titleColor }]}
              >
                {alert.actionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Close Button */}
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={alertStyles.titleColor}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  alertContainer: {
    marginBottom: 12,
    marginHorizontal: 16,
  },

  alert: {
    flexDirection: "row",
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    paddingRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  icon: {
    marginRight: 12,
    marginTop: 2,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },

  message: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },

  actionBtn: {
    marginTop: 6,
    paddingVertical: 4,
  },

  actionText: {
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  closeBtn: {
    padding: 4,
    justifyContent: "center",
  },
});
