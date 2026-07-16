import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
interface Props {
  title: string;
  description: string;

  // backend-driven dropdown options
  reasonOptions: string[];

  // form values
  values: {
    name: string;
    reason: string;
    mobile: string;
    email: string;
    notes: string;
  };

  onChange: (key: keyof Props['values'], value: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

const ServiceInterestForm: React.FC<Props> = ({
  title,
  description,
  reasonOptions,
  values,
  onChange,
  onSubmit,
  canSubmit,
}) => {
  const [showReasonModal, setShowReasonModal] = useState(false);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>

      {/* NAME */}
      <Text style={styles.label}>
        Name <Text style={styles.star}>*</Text>
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={values.name}
          onChangeText={(t) => onChange('name', t)}
          placeholder="Enter your name here"
          placeholderTextColor="#A3A3A3"
          style={[styles.input, { paddingRight: 42 }]}
        />
        <View style={styles.rightIcon}>
          <MaterialIcons name="person-outline" size={18} color="#8A8A8A" />
        </View>
      </View>

      {/* DROPDOWN */}
      <Text style={styles.label}>
        Reason for PAN Card Request <Text style={styles.star}>*</Text>
      </Text>
      <Pressable style={styles.inputWrap} onPress={() => setShowReasonModal(true)}>
        <Text style={[styles.input, !values.reason && { color: '#A3A3A3' }]}>
          {values.reason || 'Select an option'}
        </Text>
        <View style={styles.rightIcon}>
          <MaterialIcons name="keyboard-arrow-down" size={22} color="#8A8A8A" />
        </View>
      </Pressable>

      {/* MOBILE */}
      <Text style={styles.label}>
        Mobile Number <Text style={styles.star}>*</Text>
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={values.mobile}
          onChangeText={(t) => onChange('mobile', t.replace(/[^0-9]/g, ''))}
          placeholder="Enter your Mobile Number here"
          placeholderTextColor="#A3A3A3"
          style={[styles.input, { paddingRight: 42 }]}
          keyboardType="number-pad"
          maxLength={10}
        />
        <View style={styles.rightIcon}>
          <MaterialIcons name="call" size={18} color="#8A8A8A" />
        </View>
      </View>

      {/* EMAIL */}
      <Text style={styles.label}>
        Email ID <Text style={styles.star}>*</Text>
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={values.email}
          onChangeText={(t) => onChange('email', t)}
          placeholder="Enter your Email ID here"
          placeholderTextColor="#A3A3A3"
          style={[styles.input, { paddingRight: 42 }]}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.rightIcon}>
          <MaterialIcons name="mail-outline" size={18} color="#8A8A8A" />
        </View>
      </View>

      {/* NOTES */}
      <Text style={styles.optionalLabel}>Additional Notes (optional)</Text>
      <View style={[styles.inputWrap, styles.textAreaWrap]}>
        <TextInput
          value={values.notes}
          onChangeText={(t) => onChange('notes', t)}
          placeholder="Enter any specific questions or requirements you'd like to share"
          placeholderTextColor="#A3A3A3"
          style={[styles.input, styles.textArea]}
          multiline
        />
      </View>

      {/* SUBMIT */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onSubmit}
        disabled={!canSubmit}
        style={!canSubmit ? styles.submitBtnDisabled : undefined}
      >
        <LinearGradient colors={['#8665FF', '#5B47A3']} style={styles.submitBtn}>
          <Text style={styles.submitText}>Submit</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* DROPDOWN MODAL */}
      <Modal visible={showReasonModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowReasonModal(false)}
        >
          <View style={styles.modalCard}>
            <FlatList
              data={reasonOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.optionRow}
                  onPress={() => {
                    onChange('reason', item);
                    setShowReasonModal(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default ServiceInterestForm;
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  /* ================= CARD ================= */
  card: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEDED',
    padding: 14,
  },

  /* ================= HEADER ================= */
  heading: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202020',
  },

  desc: {
    fontSize: 11.5,
    color: '#6B6B6B',
    marginTop: 6,
    lineHeight: 16,
  },

  /* ================= LABELS ================= */
  label: {
    marginTop: 14,
    fontSize: 13,
    color: '#111111',
  },

  star: {
    color: '#E11D48',
    fontWeight: '600',
  },

  optionalLabel: {
    marginTop: 14,
    fontSize: 13,
    color: '#606060',
  },

  /* ================= INPUT ================= */
  inputWrap: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  input: {
    fontSize: 13,
    color: '#222222',
    padding: 0,
    margin: 0,
  },

  rightIcon: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 34,
  },

  /* ================= TEXTAREA ================= */
  textAreaWrap: {
    height: 92,
    paddingTop: 10,
    paddingBottom: 10,
  },

  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  /* ================= SUBMIT ================= */
  submitBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitBtnDisabled: {
    opacity: 0.55,
  },

  submitText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  /* ================= DROPDOWN MODAL ================= */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    maxHeight: 320,
  },

  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },

  optionText: {
    fontSize: 14,
    color: '#202020',
  },
});
