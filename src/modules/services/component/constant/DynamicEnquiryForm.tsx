import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { EnquiryField } from '../../types/ServiceTypes';

interface Props {
  title: string;
  description: string;
  fields: EnquiryField[];
  values: Record<string, string>;
  onChange: (fieldName: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

interface SelectState {
  open: boolean;
  field: EnquiryField | null;
}

function getKeyboardType(fieldType: string): 'default' | 'email-address' | 'number-pad' | 'phone-pad' {
  const t = fieldType.toLowerCase();
  if (t === 'number') return 'number-pad';
  if (t === 'phone') return 'phone-pad';
  return 'default';
}

const DynamicEnquiryForm: React.FC<Props> = ({
  title,
  description,
  fields,
  values,
  onChange,
  onSubmit,
  isSubmitting = false,
}) => {
  const [selectState, setSelectState] = useState<SelectState>({ open: false, field: null });

  const canSubmit =
    !isSubmitting &&
    fields
      .filter((f) => f.is_required === 1)
      .every((f) => !!String(values[f.field_name] ?? '').trim());

  const renderField = (field: EnquiryField, index: number) => {
    const value = values[field.field_name] ?? '';
    const isRequired = field.is_required === 1;
    const fieldType = String(field.field_type ?? 'text').toLowerCase();

    return (
      <View key={`${field.field_name || 'field'}-${index}`}>
        <Text style={styles.label}>
          {field.label}
          {isRequired && <Text style={styles.star}> *</Text>}
        </Text>

        {fieldType === 'select' ? (
          /* ── Dropdown ── */
          <Pressable
            style={styles.inputWrap}
            onPress={() => {
              Keyboard.dismiss();
              setTimeout(() => setSelectState({ open: true, field }), 80);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Select ${field.label}`}
          >
            <Text style={[styles.inputText, !value && styles.placeholder]}>
              {value || `Select ${field.label}`}
            </Text>
            <View style={styles.rightIcon}>
              <MaterialIcons name="keyboard-arrow-down" size={22} color="#8A8A8A" />
            </View>
          </Pressable>
        ) : fieldType === 'textarea' ? (
          /* ── Textarea ── */
          <View style={[styles.inputWrap, styles.textAreaWrap]}>
            <TextInput
              value={value}
              onChangeText={(t) => onChange(field.field_name, t)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              placeholderTextColor="#A3A3A3"
              style={[styles.inputText, styles.textArea]}
              multiline
              textAlignVertical="top"
            />
          </View>
        ) : (
          /* ── Text / Number ── */
          <View style={styles.inputWrap}>
            <TextInput
              value={value}
              onChangeText={(t) => {
                const sanitized = fieldType === 'number' ? t.replace(/[^0-9]/g, '') : t;
                onChange(field.field_name, sanitized);
              }}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              placeholderTextColor="#A3A3A3"
              style={styles.inputTextWithPadding}
              keyboardType={getKeyboardType(fieldType)}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="chat-bubble-outline" size={18} color="#5B47A3" />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.heading}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>
        </View>
      </View>

      {fields.map(renderField)}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onSubmit}
        disabled={!canSubmit}
        style={[styles.submitBtnShadow, !canSubmit && styles.submitBtnDisabled]}
      >
        <LinearGradient colors={['#8665FF', '#5B47A3']} style={styles.submitBtn}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Select dropdown modal ── */}
      <Modal
        visible={selectState.open}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setSelectState({ open: false, field: null })}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectState({ open: false, field: null })}
        >
          <View style={styles.modalCard}>
            {!!selectState.field?.label && (
              <Text style={styles.modalTitle}>{selectState.field.label}</Text>
            )}
            <FlatList
              data={selectState.field?.options ?? []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = values[selectState.field?.field_name ?? ''] === item;
                return (
                  <Pressable
                    style={styles.optionRow}
                    onPress={() => {
                      if (selectState.field) {
                        onChange(selectState.field.field_name, item);
                      }
                      setSelectState({ open: false, field: null });
                    }}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={16} color="#8665FF" />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default DynamicEnquiryForm;

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  headerTextCol: {
    flex: 1,
  },
  heading: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  desc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  label: {
    marginTop: 14,
    fontSize: 13,
    color: '#111111',
    fontWeight: '500',
  },
  star: {
    color: '#E11D48',
    fontWeight: '600',
  },
  inputWrap: {
    marginTop: 6,
    borderWidth: 1.2,
    borderColor: '#ECE7FF',
    borderRadius: 10,
    backgroundColor: '#FAF9FF',
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inputText: {
    fontSize: 13,
    color: '#222222',
    padding: 0,
    margin: 0,
  },
  inputTextWithPadding: {
    fontSize: 13,
    color: '#222222',
    padding: 0,
    margin: 0,
    paddingRight: 12,
  },
  placeholder: {
    color: '#A3A3A3',
  },
  rightIcon: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 34,
  },
  textAreaWrap: {
    minHeight: 92,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  textArea: {
    width: '100%',
    minHeight: 72,
  },
  submitBtnShadow: {
    marginTop: 16,
    borderRadius: 10,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  /* ── Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    maxHeight: 380,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202020',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  optionText: {
    fontSize: 14,
    color: '#202020',
    flex: 1,
  },
  optionTextSelected: {
    color: '#8665FF',
    fontWeight: '600',
  },
});
