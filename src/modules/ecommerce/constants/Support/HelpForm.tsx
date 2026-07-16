import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  createSupportTicket,
  fetchSupportCategories,
  SupportCategory,
} from "../../api/SupportApi";

import { useAlert } from "../../components/alerts";
import type { AppStackParamList } from "../../../../navigation/RootNavigator";

type HelpFormProps = NativeStackScreenProps<AppStackParamList, "HelpForm">;

export default function HelpForm({ navigation }: HelpFormProps) {
  const alert = useAlert();

  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<SupportCategory | null>(null);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  const successOpacity = useRef(new Animated.Value(0)).current;
  const successTranslateY = useRef(new Animated.Value(60)).current;
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showDropdown, setShowDropdown] = useState(false);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // ============================ LOAD CATEGORIES ============================

  const loadCategories = useCallback(async () => {
    try {
      setCategoryLoading(true);

      const res = await fetchSupportCategories();

      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (error) {
      console.log("Category load failed", error);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const hideSuccessCard = useCallback(() => {
    Animated.parallel([
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(successTranslateY, {
        toValue: 60,
        duration: 240,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSuccessVisible(false);
      navigation.goBack();
    });
  }, [navigation, successOpacity, successTranslateY]);

  const showSuccessCard = useCallback(() => {
    setIsSuccessVisible(true);
    successOpacity.setValue(0);
    successTranslateY.setValue(60);

    Animated.parallel([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(successTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = setTimeout(() => {
        hideSuccessCard();
      }, 2600);
    });
  }, [hideSuccessCard, successOpacity, successTranslateY]);

  // ============================ SUBMIT ============================

  const handleCreateTicket = useCallback(async () => {
    try {
      if (!selectedCategory?.category_id) {
        alert.error("Validation Error", "Please select category");
        return;
      }

      if (subject.trim().length < 3) {
        alert.error(
          "Validation Error",
          "Subject must be minimum 3 characters"
        );
        return;
      }

      if (description.trim().length < 10) {
        alert.error(
          "Validation Error",
          "Description must be minimum 10 characters"
        );
        return;
      }

      setLoading(true);

      const res = await createSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
        category_id: selectedCategory.category_id,
      });

      if (res.success) {
        alert.success(
          "Ticket Created",
          res.message || "Support ticket created successfully"
        );

        setSubject("");
        setDescription("");
        setSelectedCategory(null);

        showSuccessCard();
        return;
      }

      alert.error("Ticket Error", res.message);
    } catch (error: any) {
      alert.error(
        "Ticket Error",
        error?.message || "Failed to create support ticket"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, subject, description, alert, navigation, showSuccessCard]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.headerWrap}>
            <Text style={styles.headerTitle}>Support Ticket</Text>

            <Text style={styles.headerSub}>
              Raise your issue and our team will help you.
            </Text>
          </View>

          {/* CARD */}

          <View style={styles.card}>
            {/* CATEGORY */}

            <Text style={styles.label}>Category</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.inputWrap}
              onPress={() => setShowDropdown((prev) => !prev)}
            >
              <MaterialCommunityIcons
                name="shape-outline"
                size={18}
                color="#999"
                style={styles.inputIcon}
              />

              <Text
                style={[
                  styles.dropdownText,
                  !selectedCategory && styles.placeholderText,
                ]}
              >
                {selectedCategory?.name || "Select Category"}
              </Text>

              <MaterialCommunityIcons
                name={showDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color="#A654CD"
              />
            </TouchableOpacity>

            {showDropdown && (
              <View style={styles.dropdown}>
                {categoryLoading ? (
                  <ActivityIndicator color="#852BAF" />
                ) : (
                  categories.map((item) => (
                    <TouchableOpacity
                      key={item.category_id}
                      style={styles.dropdownItem}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedCategory(item);
                        setShowDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* SUBJECT */}

            <Text style={styles.label}>Subject</Text>

            <View style={styles.inputWrap}>
              <MaterialCommunityIcons
                name="text-box-outline"
                size={18}
                color="#999"
                style={styles.inputIcon}
              />

              <TextInput
                placeholder="Enter Subject"
                placeholderTextColor="#999"
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* DESCRIPTION */}

            <Text style={styles.label}>Description</Text>

            <View style={styles.textAreaWrap}>
              <TextInput
                placeholder="Describe your issue..."
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* BUTTON */}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreateTicket}
              disabled={loading}
            >
              <LinearGradient
                colors={["#FC8BAD", "#A654CD"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>Create Ticket</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {isSuccessVisible ? (
          <View style={styles.successWrapper} pointerEvents="none">
            <Animated.View
              style={[
                styles.successCard,
                {
                  opacity: successOpacity,
                  transform: [{ translateY: successTranslateY }],
                },
              ]}
            >
              <View style={styles.successIconWrap}>
                <LinearGradient
                  colors={["#FC8BAD", "#A654CD"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.successIconBackground}
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={48}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>
              <Text style={styles.successTitle}>Thank You ✨</Text>
              <Text style={styles.successDescription}>
                Our support team received your request and will get back to you shortly.
              </Text>
            </Animated.View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F0FF",
  },

  keyboardWrap: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  headerWrap: {
    paddingHorizontal: 24,
    paddingTop: 30,
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#852BAF",
  },

  headerSub: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    minHeight: "100%",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#852BAF",
    marginBottom: 10,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 18,
    height: 52,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },

  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },

  placeholderText: {
    color: "#999",
  },

  dropdown: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    marginTop: -10,
    marginBottom: 18,
    overflow: "hidden",
  },

  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },

  textAreaWrap: {
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    marginBottom: 24,
    minHeight: 140,
  },

  textArea: {
    fontSize: 14,
    color: "#333",
    minHeight: 120,
  },

  submitBtn: {
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  submitText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },

  successWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
  },

  successCard: {
    width: "92%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 18,
  },

  successIconWrap: {
    marginBottom: 18,
  },

  successIconBackground: {
    width: 90,
    height: 90,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F1F35",
    textAlign: "center",
    marginBottom: 10,
  },

  successDescription: {
    fontSize: 15,
    color: "#4B5268",
    textAlign: "center",
    lineHeight: 22,
  },
});
