import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import ProductHeadColor from '../../constants/heading/Poduct_Head_Color';
import { HomeStackParamList } from '../../navigation/types';
import { useQueryClient } from '@tanstack/react-query';
import { addAddress, fetchAddressByID, fetchAllAddress, fetchCountries, fetchStatesByCountry } from '../../api/AddressApi';
import { addressesQueryKey } from '../../navigation/navigationPerformance';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const NOMINATIM_USER_AGENT = 'RewardPlannersApp/1.0 (support@rewardplanners.com)';
const PRIMARY_COLOR = '#6D28D9';
const DEFAULT_REGION: Region = {
  latitude: 18.5204,
  longitude: 73.8567,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type AddAddressMapRoute = RouteProp<HomeStackParamList, 'AddAddressMap'>;

type Coordinates = {
  latitude: number;
  longitude: number;
};

type MapCoordinateEvent = {
  nativeEvent: {
    coordinate: Coordinates;
  };
};

type NominatimAddress = {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state_district?: string;
  state?: string;
  country?: string;
  postcode?: string;
};

type NominatimResult = {
  place_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
};

type NominatimReverseResult = {
  display_name?: string;
  address?: NominatimAddress;
};

type ResolvedAddress = {
  displayName: string;
  address1: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
  latitude: number;
  longitude: number;
};

type ExistingAddress = {
  address_id?: number;
  is_default?: number | string | boolean;
  contact_name?: string;
  city?: string;
  address1?: string;
};

type CountryRecord = {
  id?: number;
  country_id?: number;
  name?: string;
  country_name?: string;
};

type StateRecord = {
  id?: number;
  state_id?: number;
  name?: string;
  state_name?: string;
};

function getRecords<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data as T[];
    }
    if (Array.isArray(record.results)) {
      return record.results as T[];
    }
  }

  return [];
}

function normalize(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

function firstAddressPart(displayName: string): string {
  return displayName.split(',')[0]?.trim() || displayName;
}

function isDefaultAddress(address: ExistingAddress): boolean {
  return address.is_default === 1 || address.is_default === '1' || address.is_default === true;
}

function buildRegion(latitude: number, longitude: number, delta = 0.03): Region {
  return {
    latitude,
    longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export default function AddAddressMapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddAddressMapRoute>();
  const manageOnly = route.params?.manageOnly === true;
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, 16);
  const mapRef = useRef<MapView | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [markerCoords, setMarkerCoords] = useState<Coordinates | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<ResolvedAddress | null>(null);
  const [existingAddress, setExistingAddress] = useState<ExistingAddress | null>(null);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const url = `${NOMINATIM_BASE_URL}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': NOMINATIM_USER_AGENT,
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        throw new Error('Unable to resolve selected location.');
      }

      const data = (await response.json()) as NominatimReverseResult;
      const address = data.address ?? {};
      const displayName = data.display_name ?? `${latitude}, ${longitude}`;
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.county ||
        address.state_district ||
        '';
      const address1 = address.road || address.suburb || address.neighbourhood || firstAddressPart(displayName);

      if (!mountedRef.current) {
        return;
      }

      setResolvedAddress({
        displayName,
        address1,
        city,
        state: address.state || '',
        country: address.country || '',
        postcode: address.postcode || '',
        latitude,
        longitude,
      });
      setSheetOpen(true);
    } catch (error) {
      console.warn('Reverse geocode failed:', error);
    }
  }, []);

  const moveToLocation = useCallback(
    (coords: Coordinates, delta = 0.03) => {
      const nextRegion = buildRegion(coords.latitude, coords.longitude, delta);
      setRegion(nextRegion);
      setMarkerCoords(coords);
      mapRef.current?.animateToRegion(nextRegion, 800);
      reverseGeocode(coords.latitude, coords.longitude);
    },
    [reverseGeocode]
  );

  const getCurrentLocation = useCallback(() => {
    Geolocation.getCurrentPosition(
      position => {
        moveToLocation(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          0.02
        );
      },
      error => {
        Alert.alert('Location Error', error.message || 'Could not get your current location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }, [moveToLocation]);

  const requestLocationPermission = useCallback(async () => {
    try {
      const permission =
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
          : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      const result = await request(permission);

      if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
        getCurrentLocation();
      }
    } catch (error) {
      console.warn('Location permission request failed:', error);
    }
  }, [getCurrentLocation]);

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  const loadExistingAddress = useCallback(async () => {
    try {
      const response = await fetchAllAddress();
      const addresses = getRecords<ExistingAddress>(response);
      setExistingAddress(addresses.find(isDefaultAddress) ?? addresses[0] ?? null);
    } catch (error) {
      console.warn('Failed to load existing addresses:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExistingAddress();
    }, [loadExistingAddress])
  );

  const searchAddress = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const url = `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(
        trimmedQuery
      )}&format=json&limit=6&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': NOMINATIM_USER_AGENT,
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        throw new Error('Could not fetch address search results.');
      }

      const data = (await response.json()) as NominatimResult[];
      if (mountedRef.current) {
        setSearchResults(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.warn('Address search failed:', error);
      if (mountedRef.current) {
        setSearchResults([]);
      }
    } finally {
      if (mountedRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      searchAddress(text);
    }, 500);
  };

  const selectSearchResult = (item: NominatimResult) => {
    const latitude = Number.parseFloat(item.lat);
    const longitude = Number.parseFloat(item.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      Alert.alert('Invalid Location', 'This search result does not include valid coordinates.');
      return;
    }

    Keyboard.dismiss();
    setSearchQuery(item.display_name);
    setSearchResults([]);
    moveToLocation({ latitude, longitude });
  };

  const handleMapPress = (event: MapCoordinateEvent) => {
    Keyboard.dismiss();
    setSearchResults([]);
    moveToLocation(event.nativeEvent.coordinate);
  };

  const handleMarkerDragEnd = (event: MapCoordinateEvent) => {
    moveToLocation(event.nativeEvent.coordinate);
  };

  const resolveStateId = async (): Promise<number | undefined> => {
    if (!resolvedAddress?.country || !resolvedAddress.state) {
      return undefined;
    }

    const countriesResponse = await fetchCountries();
    const countries = getRecords<CountryRecord>(countriesResponse);
    const matchedCountry = countries.find(country => {
      const countryName = country.name || country.country_name;
      return normalize(countryName) === normalize(resolvedAddress.country);
    });
    const countryId = matchedCountry?.id ?? matchedCountry?.country_id;

    if (!countryId) {
      return undefined;
    }

    const statesResponse = await fetchStatesByCountry(countryId);
    const states = getRecords<StateRecord>(statesResponse);
    const matchedState = states.find(state => {
      const stateName = state.name || state.state_name;
      return normalize(stateName) === normalize(resolvedAddress.state);
    });

    return matchedState?.id ?? matchedState?.state_id;
  };

  const handleSaveLocation = async () => {
    if (!resolvedAddress) {
      Alert.alert('No Location Selected', 'Please tap the map or search for an address first.');
      return;
    }

    setIsSaving(true);
    try {
      let stateId: number | undefined;
      try {
        stateId = await resolveStateId();
      } catch (error) {
        console.warn('State lookup failed:', error);
      }

      const payload: Parameters<typeof addAddress>[0] = {
        address_type: 'home',
        address1: resolvedAddress.address1 || firstAddressPart(resolvedAddress.displayName),
        address2: resolvedAddress.displayName,
        city: resolvedAddress.city,
        zipcode: resolvedAddress.postcode || '000000',
        landmark: '',
        contact_name: existingAddress?.contact_name || '',
        contact_phone: '',
        is_default: 0,
        latitude: resolvedAddress.latitude,
        longitude: resolvedAddress.longitude,
        ...(stateId ? { state_id: stateId } : {}),
      };

      await addAddress(payload);
      queryClient.invalidateQueries({ queryKey: addressesQueryKey }).catch(() => {});

      Alert.alert('Address Saved', 'Your selected location has been saved successfully.', [
        {
          text: 'Add Details',
          onPress: () => navigation.navigate('AddressDetails', { mode: 'add', manageOnly }),
        },
        {
          text: 'Done',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save address. Please try again.';
      Alert.alert('Save Failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeAddress = () => {
    navigation.navigate('AddressSelect', { fromCart: !manageOnly, manageOnly });
  };

  const handleAddMoreDetails = async () => {
    if (!existingAddress?.address_id) {
      navigation.navigate('AddressDetails', { mode: 'add', manageOnly });
      return;
    }

    try {
      const apiAddress = await fetchAddressByID(existingAddress.address_id);
      const normalizedType = String(apiAddress?.address_type || 'other').toLowerCase();
      const saveAs = normalizedType === 'home' ? 'Home' : normalizedType === 'work' ? 'Work' : 'Other';

      navigation.navigate('AddressDetails', {
        mode: 'edit',
        addressId: existingAddress.address_id,
        manageOnly,
        initialData: {
          saveAs,
          flatHouseBuilding: apiAddress?.address1 || '',
          areaLocality: apiAddress?.address2 || '',
          landmark: apiAddress?.landmark || '',
          name: apiAddress?.contact_name || '',
          phone: apiAddress?.contact_phone || '',
          pincode: String(apiAddress?.zipcode || ''),
          city: apiAddress?.city || '',
          state: apiAddress?.state || '',
          state_id: Number(apiAddress?.state_id) || undefined,
          isDefault: Number(apiAddress?.is_default) === 1,
        },
      });
    } catch (error) {
      console.warn('Failed to load existing address for editing:', error);
      Alert.alert('Error', 'Could not load address details for editing. Please try again.');
    }
  };

  const clearResolvedAddress = () => {
    setResolvedAddress(null);
    setMarkerCoords(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProductHeadColor title="Select Location" onBackPress={() => navigation.goBack()} />

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          initialRegion={DEFAULT_REGION}
          region={region}
          mapType={Platform.OS === 'android' ? 'none' : 'standard'}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={handleMapPress}
          onRegionChangeComplete={setRegion}
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            maximumNativeZ={19}
            tileSize={256}
            zIndex={1}
          />

          {markerCoords ? (
            <Marker
              coordinate={markerCoords}
              draggable
              onDragEnd={handleMarkerDragEnd}
              title="Selected Location"
            />
          ) : null}
        </MapView>

        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={PRIMARY_COLOR} />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search village, city, address..."
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              style={styles.searchInput}
              onSubmitEditing={() => searchAddress(searchQuery)}
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={PRIMARY_COLOR} />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity onPress={clearResolvedAddress} activeOpacity={0.75}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>

          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              style={styles.resultsList}
              keyExtractor={item => String(item.place_id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.resultItem}
                  onPress={() => selectSearchResult(item)}
                >
                  <MaterialCommunityIcons name="map-marker-outline" size={17} color={PRIMARY_COLOR} />
                  <Text style={styles.resultText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ) : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={requestLocationPermission}
          style={[styles.myLocationButton, { bottom: sheetOpen ? safeBottom + 224 : safeBottom + 8 }]}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={22} color={PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>

      {sheetOpen ? (
        <View style={[styles.bottomSheet, { bottom: safeBottom, paddingBottom: 96 }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {resolvedAddress ? 'Deliver here?' : 'Delivering to'}
            </Text>
            <TouchableOpacity activeOpacity={0.75} onPress={() => setSheetOpen(false)} style={styles.sheetCloseButton}>
              <MaterialCommunityIcons name="close" size={20} color="#1C1C22" />
            </TouchableOpacity>
          </View>

          {resolvedAddress ? (
            <View style={styles.resolvedCard}>
              <MaterialCommunityIcons name="map-marker" size={22} color={PRIMARY_COLOR} />
              <View style={styles.resolvedContent}>
                <Text style={styles.resolvedTitle} numberOfLines={1}>
                  {resolvedAddress.city || resolvedAddress.state || 'Selected Location'}
                </Text>
                <Text style={styles.resolvedText} numberOfLines={2}>
                  {resolvedAddress.displayName}
                </Text>
                <Text style={styles.coordinatesText}>
                  {resolvedAddress.latitude.toFixed(6)}, {resolvedAddress.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.existingAddressRow}>
                <View style={styles.existingAddressTextBlock}>
                  <Text style={styles.existingName} numberOfLines={1}>
                    {existingAddress?.contact_name || 'No saved contact'}
                  </Text>
                  <Text style={styles.existingCity} numberOfLines={1}>
                    {existingAddress?.city || existingAddress?.address1 || 'No saved address yet'}
                  </Text>
                </View>
                <TouchableOpacity activeOpacity={0.75} onPress={handleChangeAddress}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity activeOpacity={0.85} onPress={handleAddMoreDetails} style={styles.fullPrimaryButton}>
                <Text style={styles.primaryButtonText}>Add more address details</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <Text style={styles.hintText}>
                Tap anywhere on the map or drag the pin to set your location
              </Text>
            </>
          )}

          {resolvedAddress ? (
            <View style={styles.actionRow}>
              <TouchableOpacity activeOpacity={0.85} onPress={clearResolvedAddress} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Change</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSaveLocation}
                disabled={isSaving}
                style={[styles.primaryButton, isSaving && styles.disabledButton]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Save Location</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSheetOpen(true)}
          style={[styles.reopenButton, { bottom: safeBottom }]}
        >
          <MaterialCommunityIcons name="chevron-up" size={20} color="#FFFFFF" />
          <Text style={styles.reopenText}>
            {resolvedAddress ? 'View selected address' : 'View address options'}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const sharedShadow = {
  elevation: 6,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
  },
  searchWrapper: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 20,
  },
  searchBar: {
    ...sharedShadow,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: '#1C1C22',
  },
  resultsList: {
    ...sharedShadow,
    maxHeight: 220,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
  },
  myLocationButton: {
    ...sharedShadow,
    position: 'absolute',
    right: 16,
    zIndex: 15,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    marginBottom: 12,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C22',
  },
  sheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  existingAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECECF4',
    borderRadius: 12,
    backgroundColor: '#FAFAFC',
  },
  existingAddressTextBlock: {
    flex: 1,
  },
  existingName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C22',
  },
  existingCity: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  resolvedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
  },
  resolvedContent: {
    flex: 1,
  },
  resolvedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C22',
  },
  resolvedText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  coordinatesText: {
    marginTop: 5,
    fontSize: 11,
    color: '#9CA3AF',
    fontVariant: ['tabular-nums'],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fullPrimaryButton: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 48,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  disabledButton: {
    opacity: 0.65,
  },
  hintText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    color: '#9CA3AF',
  },
  reopenButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 30,
    height: 48,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 6,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  reopenText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
