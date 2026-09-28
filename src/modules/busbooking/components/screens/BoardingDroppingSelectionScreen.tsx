import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import type { BusBookingStackParamList } from '../../navigation/BusBookingStack';
import { getBoardingDroppingPointsApi } from '../../services/busBookingApi';

import type { BoardingDroppingPoint } from '../../services/busBookingApi';

type ActiveTab = 'boarding' | 'dropping';

type PointItem = {
  id: string;

  time: string;

  title: string;

  city: string;

  raw: BoardingDroppingPoint;
};

type PointRowProps = {
  item: PointItem;
  isSelected: boolean;
  onPress: () => void;
};

function PointRow({ item, isSelected, onPress }: PointRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.pointRow}
    >
      <Text style={styles.pointTime}>{item.time}</Text>

      <View style={styles.pointTextWrap}>
        <Text style={styles.pointTitle}>{item.title}</Text>
      </View>

      <View
        style={[
          styles.radioOuter,
          isSelected ? styles.radioOuterSelected : null,
        ]}
      >
        {isSelected ? <View style={styles.radioInner} /> : null}
      </View>
    </TouchableOpacity>
  );
}
/*
|--------------------------------------------------------------------------
| Build UI Point From API Point
|--------------------------------------------------------------------------
*/

const mapPointToUi = (
  point: BoardingDroppingPoint,
  city: string,
): PointItem => {
  /*
  |--------------------------------------------------------------------------
  | Build Address Text
  |--------------------------------------------------------------------------
  */

  const parts = [point.Name, point.Location, point.Address, point.Landmark];

  /*
  |--------------------------------------------------------------------------
  | Remove Blank / Duplicate Values
  |--------------------------------------------------------------------------
  */

  const uniqueParts = Array.from(
    new Set(parts.map(value => String(value || '').trim()).filter(Boolean)),
  );

  return {
    id: String(point.Id),

    time: String(point.Time || '--:--'),

    title: uniqueParts.join(', '),

    city,

    raw: point,
  };
};

export default function BoardingDroppingSelectionScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BusBookingStackParamList>>();

  const route =
    useRoute<
      RouteProp<BusBookingStackParamList, 'BoardingDroppingSelectionScreen'>
    >();

  /*
  |--------------------------------------------------------------------------
  | Navigation Data
  |--------------------------------------------------------------------------
  */

  const { bus, passengers, selectedSeats, traceId, srdvIndex, resultIndex, isWomenBooking } =
    route.params;

  /*
  |--------------------------------------------------------------------------
  | City Names
  |--------------------------------------------------------------------------
  */

  const sourceCity = String(bus?.from || '')
    .split(',')[0]
    .trim();

  const destinationCity = String(bus?.to || '')
    .split(',')[0]
    .trim();

  /*
  |--------------------------------------------------------------------------
  | UI State
  |--------------------------------------------------------------------------
  */

  const [activeTab, setActiveTab] = React.useState<ActiveTab>('boarding');

  const [boardingPoints, setBoardingPoints] = React.useState<PointItem[]>([]);

  const [droppingPoints, setDroppingPoints] = React.useState<PointItem[]>([]);

  const [selectedBoardingPointId, setSelectedBoardingPointId] = React.useState<
    string | null
  >(null);

  const [selectedDroppingPointId, setSelectedDroppingPointId] = React.useState<
    string | null
  >(null);

  const [hasUserSelectedBoarding, setHasUserSelectedBoarding] =
    React.useState(false);

  const [hasUserSelectedDropping, setHasUserSelectedDropping] =
    React.useState(false);

  const [loadingPoints, setLoadingPoints] = React.useState(true);

  const [pointsError, setPointsError] = React.useState<string | null>(null);

  /*
|--------------------------------------------------------------------------
| Load Boarding / Dropping Points
|--------------------------------------------------------------------------
*/

  React.useEffect(() => {
    let isMounted = true;

    const loadPoints = async () => {
      if (!traceId || !srdvIndex || !resultIndex) {
        setPointsError('Missing boarding point identifiers');
        setLoadingPoints(false);
        return;
      }

      setLoadingPoints(true);

      setPointsError(null);

      const payload = {
        traceId: String(traceId),

        srdvIndex: String(srdvIndex),

        resultIndex: String(resultIndex),
      };

      console.log('[BusBooking][BoardingDroppingScreen] API Payload', payload);

      try {
        const response = await getBoardingDroppingPointsApi(payload);

        if (!isMounted) {
          return;
        }

        /*
          |--------------------------------------------------------------------------
          | Map Boarding Points
          |--------------------------------------------------------------------------
          */

        const mappedBoardingPoints = (response.boardingPoints || []).map(
          point => mapPointToUi(point, sourceCity),
        );

        /*
          |--------------------------------------------------------------------------
          | Map Dropping Points
          |--------------------------------------------------------------------------
          */

        const mappedDroppingPoints = (response.droppingPoints || []).map(
          point => mapPointToUi(point, destinationCity),
        );

        console.log('[BusBooking][BoardingDroppingScreen] Points Loaded', {
          boardingCount: mappedBoardingPoints.length,

          droppingCount: mappedDroppingPoints.length,

          boardingPoints: mappedBoardingPoints,

          droppingPoints: mappedDroppingPoints,
        });

        setBoardingPoints(mappedBoardingPoints);

        setDroppingPoints(mappedDroppingPoints);

        /*
          |--------------------------------------------------------------------------
          | Auto Select First Boarding Point
          |--------------------------------------------------------------------------
          */

        if (mappedBoardingPoints.length > 0) {
          setSelectedBoardingPointId(mappedBoardingPoints[0].id);
        }

        /*
          |--------------------------------------------------------------------------
          | Auto Select First Dropping Point
          |--------------------------------------------------------------------------
          */

        if (mappedDroppingPoints.length > 0) {
          setSelectedDroppingPointId(mappedDroppingPoints[0].id);
        }
      } catch (error: any) {
        if (!isMounted) {
          return;
        }

        console.log(
          '[BusBooking][BoardingDroppingScreen] API Error',
          error?.message || error,
        );

        setPointsError(
          error?.message || 'Unable to load boarding and dropping points',
        );
      } finally {
        if (isMounted) {
          setLoadingPoints(false);
        }
      }
    };

    loadPoints();

    return () => {
      isMounted = false;
    };
  }, [destinationCity, resultIndex, sourceCity, srdvIndex, traceId]);
  /*
|--------------------------------------------------------------------------
| Selected / Active Points
|--------------------------------------------------------------------------
*/

  const activePoints =
    activeTab === 'boarding' ? boardingPoints : droppingPoints;

  const selectedBoardingPoint =
    boardingPoints.find(item => item.id === selectedBoardingPointId) || null;

  const selectedDroppingPoint =
    droppingPoints.find(item => item.id === selectedDroppingPointId) || null;

  const selectedPoint =
    activeTab === 'boarding' ? selectedBoardingPoint : selectedDroppingPoint;

  const showSelectedPointCard =
    !!selectedPoint &&
    (activePoints.length === 1 ||
      (activeTab === 'boarding'
        ? hasUserSelectedBoarding
        : hasUserSelectedDropping));

  const canContinue = !!selectedBoardingPoint && !!selectedDroppingPoint;

 const handleContinue =
  React.useCallback(
    () => {

      if (
        !selectedBoardingPoint ||
        !selectedDroppingPoint
      ) {
        return;
      }


      console.log(
        "[BusBooking][BoardingDropping] Continue",
        {
          boardingPoint:
            selectedBoardingPoint.raw,

          droppingPoint:
            selectedDroppingPoint.raw,

          traceId,

          srdvIndex,

          resultIndex,
        }
      );


      navigation.navigate(
        "PassengerDetailsScreen",
        {
          bus,

          selectedSeats,

          /*
          |--------------------------------------------------------------------------
          | Complete provider points
          |--------------------------------------------------------------------------
          */

          boardingPoint:
            selectedBoardingPoint.raw,

          droppingPoint:
            selectedDroppingPoint.raw,


          /*
          |--------------------------------------------------------------------------
          | Provider booking identifiers
          |--------------------------------------------------------------------------
          */

          traceId:
            String(traceId),

          srdvIndex:
            String(srdvIndex),

          resultIndex:
            String(resultIndex),

          isWomenBooking:
            isWomenBooking,
        }
      );
    },

    [
      bus,
      navigation,
      selectedBoardingPoint,
      selectedDroppingPoint,
      selectedSeats,
      traceId,
      srdvIndex,
      resultIndex,
      isWomenBooking,
    ]
  );
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={30} color="#222222" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>
            Select boarding & dropping points
          </Text>
          <Text style={styles.headerSubtitle}>
            {bus.from.split(',')[0]} → {bus.to.split(',')[0]}
          </Text>
        </View>
      </View>

      <View style={styles.tabsWrap}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setActiveTab('boarding')}
          style={styles.tabButton}
        >
          <Text
            style={[
              styles.tabTitle,
              activeTab === 'boarding' ? styles.tabTitleActive : null,
            ]}
          >
            Boarding points
          </Text>
          <Text style={styles.tabSubtitle}>{sourceCity}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setActiveTab('dropping')}
          style={styles.tabButton}
        >
          <Text
            style={[
              styles.tabTitle,
              activeTab === 'dropping' ? styles.tabTitleActive : null,
            ]}
          >
            Dropping points
          </Text>
          <Text style={styles.tabSubtitle}>{destinationCity}</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.activeTabIndicator,
          activeTab === 'dropping' ? styles.activeTabIndicatorRight : null,
        ]}
      />

      {loadingPoints ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D93746" />

          <Text style={styles.loadingText}>
            Loading boarding and dropping points...
          </Text>
        </View>
      ) : pointsError ? (
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={36}
            color="#D93746"
          />

          <Text style={styles.errorText}>{pointsError}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
  {showSelectedPointCard && selectedPoint ? (
  <View style={styles.selectedCard}>
              <LinearGradient
                colors={['rgba(164,255,200,0.85)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.3, y: 0.2 }}
                style={styles.selectedGlow}
              />
              <Text style={styles.sectionHeader}>
                {activeTab === 'boarding'
                  ? 'Your selected boarding point'
                  : 'Your selected dropping point'}
              </Text>
              <View style={styles.selectedDivider} />
              <PointRow item={selectedPoint} isSelected onPress={() => {}} />
            </View>
          ) : null}

          <View style={styles.listCard}>
            <Text style={styles.sectionHeader}>
              {activeTab === 'boarding'
                ? `All boarding points in ${sourceCity}`
                : `All dropping points in ${destinationCity}`}
            </Text>

            <View style={styles.listDivider} />

            {activePoints.map((item, index) => {
              const isSelected =
                activeTab === 'boarding'
                  ? item.id === selectedBoardingPointId
                  : item.id === selectedDroppingPointId;

              return (
                <View key={item.id}>
                  <PointRow
                    item={item}
                    isSelected={isSelected}
                    onPress={() => {
                      if (activeTab === 'boarding') {
                        setHasUserSelectedBoarding(true);
                        setSelectedBoardingPointId(item.id);
                      } else {
                        setHasUserSelectedDropping(true);
                        setSelectedDroppingPointId(item.id);
                      }
                    }}
                  />
                  {index !== activePoints.length - 1 ? (
                    <View style={styles.listRowDivider} />
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={canContinue ? 0.92 : 1}
          disabled={!canContinue}
          onPress={handleContinue}
          style={{
            opacity: canContinue ? 1 : 0.5,
          }}
        >
          <LinearGradient
            colors={['#E53A45', '#D7323E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5FB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6EC',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#1E1E22',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginTop: 3,
    color: '#7D7B83',
    fontSize: 12,
    fontWeight: '500',
  },
  tabsWrap: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E9E8EF',
  },
  tabButton: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 14,
  },
  tabTitle: {
    color: '#26242B',
    fontSize: 16,
    fontWeight: '700',
  },
  tabTitleActive: {
    fontWeight: '800',
  },
  tabSubtitle: {
    marginTop: 4,
    color: '#717079',
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabIndicator: {
    width: '50%',
    height: 4,
    backgroundColor: '#D93746',
  },
  activeTabIndicatorRight: {
    marginLeft: '50%',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 22,
    gap: 14,
  },
  selectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  selectedGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 150,
    height: 84,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    color: '#202026',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedDivider: {
    height: 1,
    backgroundColor: '#E8E6EB',
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  listDivider: {
    height: 1,
    backgroundColor: '#E8E6EB',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pointTime: {
    width: 58,
    color: '#1E1D23',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 2,
  },
  pointTextWrap: {
    flex: 1,
    paddingRight: 14,
  },
  pointTitle: {
    color: '#222127',
    fontSize: 16,
    lineHeight: 38 / 1.6,
    fontWeight: '800',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: '#4A4850',
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#3A3840',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D83A46',
  },
  listRowDivider: {
    height: 1,
    backgroundColor: '#E8E6EB',
    marginLeft: 16,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEAF0',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  continueButton: {
    minHeight: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 14,

    color: '#65636B',

    fontSize: 14,

    fontWeight: '600',

    textAlign: 'center',
  },

  errorText: {
    marginTop: 12,

    color: '#D93746',

    fontSize: 14,

    lineHeight: 21,

    fontWeight: '600',

    textAlign: 'center',
  },
});
