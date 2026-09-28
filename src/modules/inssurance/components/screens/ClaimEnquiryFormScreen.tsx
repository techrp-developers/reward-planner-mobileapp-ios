import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { rs, fs } from '../../../../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';
import { submitClaimEnquiry } from '../../services/inssuranceApi';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const ClaimEnquiryFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useAppTheme();
  
  const claimType = route.params?.claimType ?? 'cashless'; // 'cashless' | 'reimbursement'
  const isCashless = claimType === 'cashless';

  // --- Form Fields State ---
  const [hospitalName, setHospitalName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [contactNo, setContactNo] = useState('');
  
  // Bank details for reimbursement
  const [accNumber, setAccNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // --- UI States ---
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInputWrapperStyle = (hasError: boolean) => [
    styles.inputWrapper,
    {
      backgroundColor: isDark ? '#1C272E' : '#FFFFFF',
      borderColor: hasError 
        ? '#EF4444' 
        : isDark 
          ? 'rgba(255,255,255,0.08)' 
          : '#E2E8F0',
    }
  ];
  const [isSuccess, setIsSuccess] = useState(false);

  // --- Calendar Picker States ---
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<'admission' | 'discharge'>('admission');
  const [viewDate, setViewDate] = useState(new Date());

  const openCalendar = (target: 'admission' | 'discharge') => {
    setCalendarTarget(target);
    const existingDateStr = target === 'admission' ? admissionDate : dischargeDate;
    if (existingDateStr && existingDateStr.includes('-')) {
      const parts = existingDateStr.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          setViewDate(new Date(y, m, d));
          setCalendarVisible(true);
          return;
        }
      }
    }
    setViewDate(new Date());
    setCalendarVisible(true);
  };

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const d = String(day).padStart(2, '0');
    const m = String(viewDate.getMonth() + 1).padStart(2, '0');
    const y = viewDate.getFullYear();
    const formatted = `${d}-${m}-${y}`;

    if (calendarTarget === 'admission') {
      setAdmissionDate(formatted);
      if (errors.admissionDate) setErrors(prev => ({ ...prev, admissionDate: '' }));
    } else {
      setDischargeDate(formatted);
      if (errors.dischargeDate) setErrors(prev => ({ ...prev, dischargeDate: '' }));
    }
    setCalendarVisible(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const formatted = `${d}-${m}-${y}`;

    if (calendarTarget === 'admission') {
      setAdmissionDate(formatted);
      if (errors.admissionDate) setErrors(prev => ({ ...prev, admissionDate: '' }));
    } else {
      setDischargeDate(formatted);
      if (errors.dischargeDate) setErrors(prev => ({ ...prev, dischargeDate: '' }));
    }
    setCalendarVisible(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!hospitalName.trim()) newErrors.hospitalName = 'Hospital name is required';
    if (!diagnosis.trim()) newErrors.diagnosis = 'Diagnosis details are required';
    if (!admissionDate.trim()) newErrors.admissionDate = 'Admission date is required';
    if (!contactNo.trim()) newErrors.contactNo = 'Contact number is required';
    
    if (isCashless) {
      if (!estimatedCost.trim()) newErrors.estimatedCost = 'Estimated cost is required';
      if (!doctorName.trim()) newErrors.doctorName = 'Doctor name is required';
    } else {
      if (!dischargeDate.trim()) newErrors.dischargeDate = 'Discharge date is required';
      if (!actualCost.trim()) newErrors.actualCost = 'Bill amount is required';
      if (!accNumber.trim()) newErrors.accNumber = 'Account number is required';
      if (!ifscCode.trim()) newErrors.ifscCode = 'IFSC code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        claim_type: claimType,
        hospital_name: hospitalName,
        diagnosis: diagnosis,
        admission_date: admissionDate,
        contact_no: contactNo,
        estimated_cost: isCashless ? estimatedCost : null,
        doctor_name: isCashless ? doctorName : null,
        discharge_date: !isCashless ? dischargeDate : null,
        actual_cost: !isCashless ? actualCost : null,
        acc_number: !isCashless ? accNumber : null,
        ifsc_code: !isCashless ? ifscCode : null,
      };

      const result = await submitClaimEnquiry(payload);
      setIsSubmitting(false);

      if (result.success) {
        setIsSuccess(true);
      } else {
        alert(result.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setIsSubmitting(false);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleBackToDashboard = () => {
    navigation.navigate('HealthDashboard');
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#F8FAFC', justifyContent: 'center' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.successContainer}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.successBadge}
          >
            <MaterialCommunityIcons name="check-decagram" size={54} color="#FFFFFF" />
          </LinearGradient>
          
          <Text style={[styles.successTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Enquiry Submitted!
          </Text>
          <Text style={[styles.successSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
            Your {isCashless ? 'Cashless' : 'Reimbursement'} enquiry request was raised successfully.
          </Text>

          <View style={[styles.infoSuccessCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#005b7f" style={{ marginRight: rs(8) }} />
            <Text style={[styles.infoSuccessText, { color: isDark ? '#D4D4D8' : '#003950' }]}>
              Our medical claims assessor team is verifying details and will contact you as soon as possible.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.backBtnSuccess}
            onPress={handleBackToDashboard}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#009ac7', '#005b7f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Back to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Computed values for calendar grid
  const calendarYear = viewDate.getFullYear();
  const calendarMonth = viewDate.getMonth();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 for Sunday
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === calendarYear && today.getMonth() === calendarMonth;
  const todayDate = today.getDate();

  const selectedValue = calendarTarget === 'admission' ? admissionDate : dischargeDate;
  let selectedDayNum: number | null = null;
  if (selectedValue && selectedValue.includes('-')) {
    const parts = selectedValue.split('-');
    if (parts.length === 3 && parseInt(parts[2], 10) === calendarYear && parseInt(parts[1], 10) - 1 === calendarMonth) {
      selectedDayNum = parseInt(parts[0], 10);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0B151C' : '#F4FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={isDark ? ['#0B151C', '#060B0E'] : ['#F4FAFC', '#E8F5FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header bar */}
          <View style={styles.topHeader}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="arrow-left" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {isCashless ? 'Cashless Claim Form' : 'Reimbursement Form'}
              </Text>
            </View>

            <View style={styles.claimTypeBadge}>
              <Text style={styles.claimTypeText}>
                {isCashless ? 'CASHLESS' : 'REIMBURSEMENT'}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
            
            {/* Field: Hospital Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>Hospital Name</Text>
              <View style={getInputWrapperStyle(!!errors.hospitalName)}>
                <MaterialCommunityIcons name="hospital-building" size={20} color="#005b7f" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                  placeholder="e.g. Apollo Hospital"
                  placeholderTextColor={isDark ? '#52525B' : '#94A3B8'}
                  value={hospitalName}
                  onChangeText={(val) => {
                    setHospitalName(val);
                    if (errors.hospitalName) setErrors(prev => ({ ...prev, hospitalName: '' }));
                  }}
                />
              </View>
              {errors.hospitalName && <Text style={styles.errorText}>{errors.hospitalName}</Text>}
            </View>

            {/* Field: Diagnosis */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>Diagnosis / Treatment Name</Text>
              <View style={getInputWrapperStyle(!!errors.diagnosis)}>
                <MaterialCommunityIcons name="medical-bag" size={20} color="#005b7f" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                  placeholder="e.g. Cataract Surgery, Malaria"
                  placeholderTextColor={isDark ? '#52525B' : '#94A3B8'}
                  value={diagnosis}
                  onChangeText={(val) => {
                    setDiagnosis(val);
                    if (errors.diagnosis) setErrors(prev => ({ ...prev, diagnosis: '' }));
                  }}
                />
              </View>
              {errors.diagnosis && <Text style={styles.errorText}>{errors.diagnosis}</Text>}
            </View>

            {/* Field: Admission Date & Discharge Date */}
            <View style={styles.flexRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: rs(8) }]}>
                <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>Admission Date</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openCalendar('admission')}
                  style={[getInputWrapperStyle(!!errors.admissionDate), { justifyContent: 'space-between' }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="calendar" size={18} color="#005b7f" style={styles.inputIcon} />
                    <Text
                      style={[
                        styles.dateText,
                        { color: admissionDate ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#52525B' : '#94A3B8') }
                      ]}
                    >
                      {admissionDate || 'DD-MM-YYYY'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#005b7f" />
                </TouchableOpacity>
                {errors.admissionDate && <Text style={styles.errorText}>{errors.admissionDate}</Text>}
              </View>

              {!isCashless && (
                <View style={[styles.inputGroup, { flex: 1, marginLeft: rs(8) }]}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>Discharge Date</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => openCalendar('discharge')}
                    style={[getInputWrapperStyle(!!errors.dischargeDate), { justifyContent: 'space-between' }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <MaterialCommunityIcons name="calendar" size={18} color="#005b7f" style={styles.inputIcon} />
                      <Text
                        style={[
                          styles.dateText,
                          { color: dischargeDate ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#52525B' : '#94A3B8') }
                        ]}
                      >
                        {dischargeDate || 'DD-MM-YYYY'}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#005b7f" />
                  </TouchableOpacity>
                  {errors.dischargeDate && <Text style={styles.errorText}>{errors.dischargeDate}</Text>}
                </View>
              )}
            </View>

            {/* Field: Doctor Name (Cashless Only) */}
            {isCashless && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>Treating Doctor Name</Text>
                <View style={getInputWrapperStyle(!!errors.doctorName)}>
                  <MaterialCommunityIcons name="doctor" size={20} color="#005b7f" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                    placeholder="e.g. Dr. Ravi Verma"
                    placeholderTextColor={isDark ? '#52525B' : '#94A3B8'}
                    value={doctorName}
                    onChangeText={(val) => {
                      setDoctorName(val);
                      if (errors.doctorName) setErrors(prev => ({ ...prev, doctorName: '' }));
                    }}
                  />
                </View>
                {errors.doctorName && <Text style={styles.errorText}>{errors.doctorName}</Text>}
              </View>
            )}

            {/* Field: Cost (Estimated vs Actual Bill amount) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>
                {isCashless ? 'Estimated Treatment Cost (INR)' : 'Actual Claim Bill Amount (INR)'}
              </Text>
              <View style={getInputWrapperStyle(!!(errors.estimatedCost || errors.actualCost))}>
                <MaterialCommunityIcons name="currency-inr" size={18} color="#005b7f" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                  placeholder="e.g. 75000"
                  placeholderTextColor={isDark ? '#52525B' : '#94A3B8'}
                  keyboardType="numeric"
                  value={isCashless ? estimatedCost : actualCost}
                  onChangeText={(val) => {
                    if (isCashless) {
                      setEstimatedCost(val);
                      if (errors.estimatedCost) setErrors(prev => ({ ...prev, estimatedCost: '' }));
                    } else {
                      setActualCost(val);
                      if (errors.actualCost) setErrors(prev => ({ ...prev, actualCost: '' }));
                    }
                  }}
                />
              </View>
              {isCashless ? (
                errors.estimatedCost && <Text style={styles.errorText}>{errors.estimatedCost}</Text>
              ) : (
                errors.actualCost && <Text style={styles.errorText}>{errors.actualCost}</Text>
              )}
            </View>

            {/* Fields: Banking details for Reimbursement */}
            {!isCashless && (
              <View style={styles.bankingSection}>
                <Text style={[styles.bankingTitle, { color: isDark ? '#FFFFFF' : '#003950' }]}>
                  Refund Bank Details
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>Bank Account Number</Text>
                  <View style={getInputWrapperStyle(!!errors.accNumber)}>
                    <MaterialCommunityIcons name="bank" size={18} color="#005b7f" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                      placeholder="e.g. 100234567890"
                      placeholderTextColor={isDark ? '#52525B' : '#94A3B8'}
                      keyboardType="numeric"
                      value={accNumber}
                      onChangeText={(val) => {
                        setAccNumber(val);
                        if (errors.accNumber) setErrors(prev => ({ ...prev, accNumber: '' }));
                      }}
                    />
                  </View>
                  {errors.accNumber && <Text style={styles.errorText}>{errors.accNumber}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>IFSC Code</Text>
                  <View style={getInputWrapperStyle(!!errors.ifscCode)}>
                    <MaterialCommunityIcons name="bank-outline" size={18} color="#005b7f" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                      placeholder="e.g. SBIN0004561"
                      placeholderTextColor={isDark ? '#52525B' : '#94A3B8'}
                      autoCapitalize="characters"
                      value={ifscCode}
                      onChangeText={(val) => {
                        setIfscCode(val);
                        if (errors.ifscCode) setErrors(prev => ({ ...prev, ifscCode: '' }));
                      }}
                    />
                  </View>
                  {errors.ifscCode && <Text style={styles.errorText}>{errors.ifscCode}</Text>}
                </View>
              </View>
            )}

            {/* Field: Contact Number */}
            <View style={[styles.inputGroup, { marginBottom: rs(10) }]}>
              <Text style={[styles.inputLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>Patient Contact Number</Text>
              <View style={getInputWrapperStyle(!!errors.contactNo)}>
                <MaterialCommunityIcons name="phone" size={18} color="#005b7f" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor={isDark ? '#52525B' : '#94A3B8'}
                  keyboardType="phone-pad"
                  value={contactNo}
                  onChangeText={(val) => {
                    setContactNo(val);
                    if (errors.contactNo) setErrors(prev => ({ ...prev, contactNo: '' }));
                  }}
                />
              </View>
              {errors.contactNo && <Text style={styles.errorText}>{errors.contactNo}</Text>}
            </View>

          {/* Submit Action */}
          <TouchableOpacity
            style={[styles.submitBtn, { opacity: isSubmitting ? 0.8 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#009ac7', '#005b7f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.btnText}>Submit Enquiry</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>

    {/* Interactive Calendar Modal */}
    <Modal
      visible={calendarVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setCalendarVisible(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.modalOverlay}
        onPress={() => setCalendarVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.calendarModalContent, { backgroundColor: isDark ? '#1C272E' : '#FFFFFF' }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <View style={styles.calendarModalHeader}>
            <View>
              <Text style={[styles.calendarModalTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Select {calendarTarget === 'admission' ? 'Admission' : 'Discharge'} Date
              </Text>
              <Text style={[styles.calendarModalSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setCalendarVisible(false)}
              style={[styles.calendarCloseBtn, { backgroundColor: isDark ? '#2B3942' : '#F1F5F9' }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={18} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={[styles.monthNavRow, { borderBottomColor: isDark ? '#2B3942' : '#F1F5F9' }]}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={[styles.navArrowBtn, { backgroundColor: isDark ? '#2B3942' : '#F8FAFC' }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-left" size={22} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>

            <Text style={[styles.monthNavLabel, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {MONTH_NAMES[calendarMonth]} {calendarYear}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={[styles.navArrowBtn, { backgroundColor: isDark ? '#2B3942' : '#F8FAFC' }]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-right" size={22} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>
          </View>

          {/* Weekdays Row */}
          <View style={styles.weekDaysRow}>
            {WEEK_DAYS.map((w, idx) => (
              <View key={idx} style={styles.weekDayCol}>
                <Text style={[styles.weekDayText, { color: isDark ? '#94A3B8' : '#64748B' }]}>{w}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.dayCol} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected = day === selectedDayNum;
              const isToday = isCurrentMonth && day === todayDate;

              return (
                <View key={`day-${day}`} style={styles.dayCol}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSelectDay(day)}
                    style={[
                      styles.dayCircle,
                      isSelected && styles.dayCircleSelected,
                      isToday && !isSelected && styles.dayCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: isSelected ? '#FFFFFF' : isDark ? '#FFFFFF' : '#0F172A' },
                        isSelected && styles.dayTextSelected,
                        isToday && !isSelected && { color: '#005b7f', fontWeight: '700' },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Footer Quick Actions */}
          <View style={[styles.calendarFooter, { borderTopColor: isDark ? '#2B3942' : '#F1F5F9' }]}>
            <TouchableOpacity
              style={[styles.calendarTodayBtn, { backgroundColor: isDark ? '#2B3942' : '#F1F5F9' }]}
              onPress={handleSelectToday}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="calendar-today" size={16} color="#005b7f" style={{ marginRight: 6 }} />
              <Text style={styles.calendarTodayText}>Select Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calendarCancelBtn}
              onPress={() => setCalendarVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.calendarCancelText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    marginTop: rs(24),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(148,163,184,0.12)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
  },
  backBtn: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(12),
    borderWidth: 0.5,
    borderColor: 'rgba(148,163,184,0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTitle: {
    fontSize: fs(15),
    fontWeight: '700',
  },
  claimTypeBadge: {
    backgroundColor: '#e5f6fd',
    paddingHorizontal: rs(8),
    paddingVertical: rs(4),
    borderRadius: rs(4),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 91, 127, 0.2)',
  },
  claimTypeText: {
    fontSize: fs(8),
    fontWeight: '700',
    color: '#005b7f',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    paddingHorizontal: rs(16),
    paddingTop: rs(16),
    paddingBottom: rs(36),
  },
  formContainer: {
    borderRadius: rs(16),
    padding: rs(16),
    borderWidth: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.015,
    shadowRadius: 8,
    elevation: 1,
    marginTop: rs(12),
  },
  inputGroup: {
    marginBottom: rs(14),
  },
  inputLabel: {
    fontSize: fs(11),
    fontWeight: '700',
    marginBottom: rs(6),
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: rs(10),
    paddingHorizontal: rs(10),
    height: rs(44),
  },
  inputIcon: {
    marginRight: rs(8),
  },
  textInput: {
    flex: 1,
    fontSize: fs(13),
    fontWeight: '600',
    height: '100%',
    padding: 0,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: fs(9),
    fontWeight: '600',
    marginTop: rs(4),
    marginLeft: rs(2),
  },
  flexRow: {
    flexDirection: 'row',
  },
  bankingSection: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(148,163,184,0.15)',
    paddingTop: rs(14),
    marginTop: rs(4),
    marginBottom: rs(6),
  },
  bankingTitle: {
    fontSize: fs(12),
    fontWeight: '700',
    marginBottom: rs(12),
  },
  submitBtn: {
    borderRadius: rs(12),
    overflow: 'hidden',
    marginTop: rs(24),
    shadowColor: '#005b7f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  btnGradient: {
    height: rs(48),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: fs(14),
    fontWeight: '700',
  },
  
  // Success page styles
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: rs(24),
  },
  successBadge: {
    width: rs(90),
    height: rs(90),
    borderRadius: rs(45),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(24),
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  successTitle: {
    fontSize: fs(22),
    fontWeight: '700',
    marginBottom: rs(8),
  },
  successSub: {
    fontSize: fs(12),
    textAlign: 'center',
    lineHeight: fs(17),
    fontWeight: '500',
    marginBottom: rs(20),
  },
  infoSuccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rs(12),
    padding: rs(12),
    marginBottom: rs(36),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 91, 127, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  infoSuccessText: {
    flex: 1,
    fontSize: fs(11),
    lineHeight: fs(15),
    fontWeight: '600',
  },
  backBtnSuccess: {
    borderRadius: rs(12),
    overflow: 'hidden',
    width: '100%',
  },
  dateText: {
    fontSize: fs(12),
    marginLeft: rs(8),
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: rs(20),
  },
  calendarModalContent: {
    width: '100%',
    borderRadius: rs(20),
    padding: rs(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  calendarModalTitle: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  calendarModalSub: {
    fontSize: fs(11),
    fontWeight: '500',
    marginTop: rs(2),
  },
  calendarCloseBtn: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rs(14),
    paddingBottom: rs(10),
    borderBottomWidth: 0.5,
  },
  navArrowBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavLabel: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginTop: rs(10),
    marginBottom: rs(6),
  },
  weekDayCol: {
    width: '14.28%',
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: fs(11),
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: rs(4),
  },
  dayCol: {
    width: '14.28%',
    height: rs(38),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: rs(2),
  },
  dayCircle: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: '#005b7f',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: '#005b7f',
  },
  dayText: {
    fontSize: fs(12),
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rs(14),
    paddingTop: rs(12),
    borderTopWidth: 0.5,
  },
  calendarTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
    borderRadius: rs(8),
  },
  calendarTodayText: {
    fontSize: fs(11.5),
    fontWeight: '700',
    color: '#005b7f',
  },
  calendarCancelBtn: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
  },
  calendarCancelText: {
    fontSize: fs(11.5),
    fontWeight: '600',
  },
});

export default ClaimEnquiryFormScreen;
