import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useServicesTheme } from "../utils/useServicesTheme";

interface StepProps {
  steps: string[];
  currentStep: number; // 0-based index
}

const StepIndicator: React.FC<StepProps> = ({ steps, currentStep }) => {
  const servicesTheme = useServicesTheme();

  return (
    <View style={styles.mainContainer}>
      <View style={styles.indicatorContainer}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <View key={index} style={[styles.stepWrapper, !isLast && styles.stepWrapperFlex]}>
              {/* Connector Line */}
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: servicesTheme.colors.divider },
                    isCompleted && styles.connectorCompleted,
                  ]}
                />
              )}

              {/* Step Circle and Label */}
              <View style={styles.stepContent}>
                <View
                  style={[
                    styles.stepCircle,
                    { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.divider },
                    isCompleted && styles.circleCompleted,
                    isActive && styles.circleActive,
                  ]}
                >
                  {isCompleted ? (
                    <MaterialIcons name="check" size={18} color="#FFF" />
                  ) : (
                    <Text style={[styles.stepNumber, { color: servicesTheme.colors.text }, (isActive || isCompleted) && styles.textWhite]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    { color: servicesTheme.colors.muted },
                    isActive && styles.labelActive,
                    isCompleted && styles.labelCompleted,
                  ]}
                >
                  {step}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  stepWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepWrapperFlex: {
    flex: 1,
  },
  stepContent: {
    alignItems: "center",
    zIndex: 1,
    width: 60,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  circleActive: {
    backgroundColor: "#8665FF",
    borderColor: "#8665FF",
    shadowColor: "#8665FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  circleCompleted: {
    backgroundColor: "#6C4AB6",
    borderColor: "#6C4AB6",
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  textWhite: {
    color: "#FFF",
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    position: "absolute",
    top: 45,
    width: 80,
  },
  labelActive: {
    color: "#6C4AB6",
    fontWeight: "700",
  },
  labelCompleted: {
    color: "#8665FF",
  },
  connector: {
    position: "absolute",
    top: 18,
    left: 30,
    right: -30,
    height: 3,
    zIndex: 0,
  },
  connectorCompleted: {
    backgroundColor: "#8665FF",
  },
});

export default StepIndicator;
