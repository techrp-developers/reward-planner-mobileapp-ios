import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BBPSHead from '../../constatnt/BBPSHead';
import { useAuth } from '../../../common/auth/context/AuthContext';
import { fetchBillLocations, BillLocation } from '../../api/BillsAPI';
import { useBbpsTheme } from '../../utils/useBbpsTheme';

// Assets
import jio from '../../assets/Sample/jio.png';
import airtel from '../../assets/Sample/airtel.png';
import vi from '../../assets/Sample/VI_Card.png';

const RECENT_RECHARGES: any[] = [];
const CONTACTS: any[] = [];

function ReachargeHomeScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const bbpsTheme = useBbpsTheme();
  const [mobileNumber, setMobileNumber] = useState(
    route?.params?.mobileNumber ?? user?.phone ?? '',
  );

  // Location / circle state
  const [locations, setLocations] = useState<BillLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<BillLocation | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationsLoading, setLocationsLoading] = useState(false);

  useEffect(() => {
    if (!route?.params?.mobileNumber && user?.phone) setMobileNumber(user.phone);
  }, [route?.params?.mobileNumber, user?.phone]);

  // Fetch locations once on mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocationsLoading(true);
        const data = await fetchBillLocations();
        setLocations(data);
      } catch (e) {
        console.error('Failed to load locations', e);
      } finally {
        setLocationsLoading(false);
      }
    };
    loadLocations();
  }, []);

  const myNumberEntry = user?.phone
    ? {
        id: 'my-number',
        name: user?.name || 'My Number',
        number: user.phone,
        status: 'Your registered number',
        icon: vi,
        type: 'My Number',
      }
    : null;

  // Navigate with both number and location when Recharge is pressed
  const handleRechargePress = (overrideNumber?: string) => {
    const number = overrideNumber ?? mobileNumber;
    navigation.navigate('RechargeSection', {
      mobileNumber: number,
      selectedLocation: selectedLocation ?? undefined,
    });
  };

  const filteredLocations = locations.filter(loc =>
    loc.operator_location_name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    loc.abbreviation.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const renderItem = (item: any) => (
    <View key={item.id} style={styles.rechargeItem}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Image source={item.icon} style={styles.providerIcon} resizeMode="contain" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.contactNumber}>{item.number}</Text>
          <Text style={styles.rechargeStatus}>{item.status}</Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleRechargePress(item.number)}
        style={styles.rechargeBtnWrap}
      >
        <LinearGradient
          colors={['#8665FF', '#5B47A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rechargeBtn}
        >
          <Text style={styles.rechargeBtnText}>Recharge</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Location picker modal
  const renderLocationModal = () => (
    <Modal
      visible={locationModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setLocationModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Circle</Text>
            <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
              <Icon name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Search inside modal */}
          <View style={styles.modalSearchContainer}>
            <Icon name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search circle..."
              placeholderTextColor="#9CA3AF"
              value={locationSearch}
              onChangeText={setLocationSearch}
            />
          </View>

          {locationsLoading ? (
            <ActivityIndicator size="large" color="#8665FF" style={{ marginTop: 32 }} />
          ) : (
            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.operator_location_id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.locationItem,
                    selectedLocation?.operator_location_id === item.operator_location_id &&
                      styles.locationItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedLocation(item);
                    setLocationModalVisible(false);
                    setLocationSearch('');
                  }}
                >
                  <View style={styles.locationItemLeft}>
                    <View style={styles.locationAbbrevBadge}>
                      <Text style={styles.locationAbbrevText}>
                        {item.abbreviation?.substring(0, 2).toUpperCase() || '??'}
                      </Text>
                    </View>
                    <Text style={styles.locationName}>{item.operator_location_name}</Text>
                  </View>
                  {selectedLocation?.operator_location_id === item.operator_location_id && (
                    <Icon name="check-circle" size={20} color="#8665FF" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No circles found</Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: bbpsTheme.colors.background }]}>
      <BBPSHead
        title="Recharge or Pay Mobile Bill"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
            {/* ── Input Section ── */}
            <View style={[styles.content, { backgroundColor: bbpsTheme.colors.surface, shadowColor: bbpsTheme.colors.shadow }]}>
              {/* Mobile Number */}
              <View style={styles.labelRow}>
                <Text style={styles.label}>Enter Mobile Number</Text>
                <View style={styles.operatorRow}>
                  <Image source={jio} style={styles.operatorIcon} />
                  <Image source={airtel} style={styles.operatorIcon} />
                  <Image source={vi} style={styles.operatorIcon} />
                </View>
              </View>
              <View style={[styles.inputContainer, { backgroundColor: bbpsTheme.colors.surfaceAlt, borderColor: bbpsTheme.colors.border }]}>
                <TextInput
                  style={[styles.input, { color: bbpsTheme.colors.text }]}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#C4B8F5"
                  maxLength={10}
                />
                <View style={styles.contactButton}>
                  <Icon name="notebook-outline" size={26} color="#7F5DF0" />
                </View>
              </View>

              {/* Circle / Location Selector */}
              <Text style={[styles.label, { marginTop: 18, marginBottom: 12 }]}>
                Select Circle
              </Text>
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: bbpsTheme.colors.surfaceAlt,
                    borderColor: bbpsTheme.colors.border,
                  },
                  selectedLocation ? styles.inputContainerSelected : null,
                ]}
                onPress={() => setLocationModalVisible(true)}
                activeOpacity={0.8}
              >
                {selectedLocation ? (
                  <View style={styles.selectedLocationRow}>
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>
                        {selectedLocation.abbreviation?.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.selectedLocationText}>
                      {selectedLocation.operator_location_name}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.placeholderText, { color: bbpsTheme.colors.subtle }]}>
                    {locationsLoading ? 'Loading circles…' : 'Choose your telecom circle'}
                  </Text>
                )}
                <Icon
                  name="chevron-down"
                  size={22}
                  color={selectedLocation ? '#8665FF' : '#C4B8F5'}
                />
              </TouchableOpacity>

              {/* Optional: show a hint when circle is not yet selected */}
              {!selectedLocation && (
                <Text style={styles.hintText}>
                  Circle helps find the right plans for your number
                </Text>
              )}
            </View>

            {/* ── Proceed Button (only shown when both fields are filled) ── */}
            {mobileNumber.length === 10 && selectedLocation && (
              <TouchableOpacity
                style={[styles.proceedWrapper, styles.proceedBtnWrap]}
                activeOpacity={0.85}
                onPress={() => handleRechargePress()}
              >
                <LinearGradient
                  colors={bbpsTheme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.proceedBtn}
                >
                  <Text style={styles.proceedBtnText}>View Plans & Recharge</Text>
                  <Icon name="arrow-right" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* ── My Number Section ── */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>My Number</Text>
            </View>
            <View style={[styles.listBackground, { backgroundColor: bbpsTheme.colors.surface, borderColor: bbpsTheme.colors.border }]}>
              {myNumberEntry && renderItem(myNumberEntry)}
            </View>

            {/* ── My Recharges & Bill ── */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>My Recharges & Bill</Text>
            </View>
            <View style={[styles.listBackground, { backgroundColor: bbpsTheme.colors.surface, borderColor: bbpsTheme.colors.border }]}>
              {RECENT_RECHARGES.map((item, index, arr) => (
                <View key={item.id}>
                  {renderItem(item)}
                  {index < arr.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </View>

            {/* ── Contacts ── */}
            <View style={styles.contactsHeader}>
              <Text style={styles.contactsTitle}>Contacts</Text>
              <View>
                <Icon name="magnify" size={22} color="#7F5DF0" />
              </View>
            </View>
            <View style={[styles.sectionContainer, { backgroundColor: bbpsTheme.colors.surface, borderColor: bbpsTheme.colors.border }]}>
              {CONTACTS.map((contact) => (
                <View key={contact.id} style={styles.listItem}>
                  <View style={[styles.avatarCircle, { backgroundColor: contact.color }]} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{contact.name}</Text>
                    <Text style={styles.itemSubText}>{contact.number}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.buttonCenter}>
              <View style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
              </View>
            </View>
        </View>
      </ScrollView>

      {/* Location Picker Modal */}
      {renderLocationModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: { fontSize: 15, fontWeight: '600', color: '#444' },
  operatorRow: { flexDirection: 'row' },
  operatorIcon: { width: 20, height: 15, marginLeft: 6, resizeMode: 'contain' },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0FA',
    paddingHorizontal: 15,
    height: 55,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  inputContainerSelected: {
    borderColor: '#8665FF',
    backgroundColor: '#F5F0FF',
  },
  input: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827' },
  contactButton: { paddingLeft: 10 },

  // Location selector
  placeholderText: { flex: 1, fontSize: 15, color: '#C4B8F5' },
  selectedLocationRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  selectedBadge: {
    backgroundColor: '#8665FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  selectedBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  selectedLocationText: { fontSize: 15, fontWeight: '600', color: '#1F2937', flex: 1 },
  hintText: { fontSize: 12, color: '#B0A8D4', marginTop: 6, marginLeft: 4 },

  // Proceed button
  proceedWrapper: { marginHorizontal: 20, marginTop: 16, marginBottom: 4 },
  proceedBtnWrap: {
    borderRadius: 14,
    backgroundColor: '#5B47A3',
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  proceedBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionAccent: { width: 4, height: 14, borderRadius: 2, backgroundColor: '#8665FF' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },

  listBackground: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  rechargeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#F0EDFB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9FF',
  },
  providerIcon: { width: 30, height: 30 },
  textContainer: { marginLeft: 12, flex: 1 },
  contactName: { fontSize: 15, fontWeight: '700', color: '#333' },
  contactNumber: { fontSize: 13, color: '#666', marginVertical: 2 },
  rechargeStatus: { fontSize: 12, color: '#888' },
  rechargeBtnWrap: {
    borderRadius: 10,
    backgroundColor: '#5B47A3',
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  rechargeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rechargeBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#F3F1FC', marginLeft: 60 },

  contactsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  contactsTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  buttonCenter: { alignItems: 'center', paddingVertical: 30 },
  viewAllButton: {
    width: 180,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#8665FF',
    backgroundColor: '#F3EFFF',
  },
  viewAllText: { color: '#5B47A3', fontWeight: '700', fontSize: 16 },
  sectionContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F1FC',
  },
  avatarCircle: { width: 45, height: 45, borderRadius: 22.5 },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  itemSubText: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  // Skeleton
  skeletonSectionGap: { marginTop: 12 },
  skeletonTextBlock: { flex: 1, marginLeft: 12, marginRight: 10 },
  skeletonLineGap: { marginTop: 6 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '75%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0FA',
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
  },
  modalSearchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#333' },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F1FC',
  },
  locationItemSelected: { backgroundColor: '#F5F0FF', borderRadius: 10, paddingHorizontal: 8 },
  locationItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationAbbrevBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EDE9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationAbbrevText: { fontSize: 12, fontWeight: '800', color: '#8665FF' },
  locationName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 32, fontSize: 15 },
});

export default ReachargeHomeScreen;
