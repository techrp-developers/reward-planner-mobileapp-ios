import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LocationIcon from '../../assets/StepCount/location.svg';
import ClockIcon from '../../assets/StepCount/clock_icon.svg';
import LightningIcon from '../../assets/StepCount/lightning.svg';
import Rewards from '../../../../assets/product/rewards.svg'


const { width } = Dimensions.get('window');

const mockWeeklyData = [
  { day: 'Mon', date: 23, progress: 0.2, done: false },
  { day: 'Tue', date: 24, progress: 0.8, done: true },
  { day: 'Wed', date: 25, progress: 0.9, done: true },
  { day: 'Thu', date: 26, progress: 0.7, done: true },
  { day: 'Fri', date: 27, progress: 0.3, done: false },
  { day: 'Sat', date: 28, progress: 0.5, done: false },
  { day: 'Sun', date: 29, progress: 1.0, done: true }, // Today
];

// --- Helper Component: Single Day Item in the Weekly Card ---
const DayItem = ({ day, date, progress, isToday }) => {
  // Determine color based on progress (Green for complete/high, Orange/Red for low)
  let barColor = progress >= 0.7 ? '#66BB6A' : '#EF5350';
  if (progress >= 0.7) {
    barColor = '#66BB6A'; // Green
  } else if (progress > 0.4) {
    barColor = '#FFA726'; // Orange
  } else {
    barColor = '#EF5350'; // Red
  }

  return (
    <View style={[styles.dayItem, isToday && styles.todayItemContainer]}>
      <Text style={[styles.dayLabel, isToday && styles.todayItemText]}>{day}</Text>
      <Text style={[styles.dateText, isToday && styles.todayItemText]}>{date}</Text>
      
      {/* Curved Progress Bar Simulation */}
      <View style={styles.dayProgressTrack}>
        <View 
          style={[
            styles.dayProgressFill, 
            { 
              height: `${Math.max(5, progress * 100)}%`, // Ensures a minimum visible height
              backgroundColor: barColor,
            }
          ]} 
        />
      </View>
    </View>
  );
};

const WeeklyHistoryCard = () => {
    const todayDate = mockWeeklyData[mockWeeklyData.length - 1].date; 

    return (
        <View style={styles.weeklyCard}>
            <View style={styles.weeklyRow}>
                {mockWeeklyData.map((data, index) => (
                    <DayItem 
                        key={index} 
                        day={data.day} 
                        date={data.date} 
                        progress={data.progress} 
                        isToday={data.date === todayDate} // Check against mock 'today'
                    />
                ))}
            </View>
        </View>
    );
};


// --- Main Component ---
const PlanProgressCard = () => {
  const today = new Date();
  const day = today.getDate();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthName = monthNames[today.getMonth()];

  // Data from user's original component, simplified
  const currentSteps = 4978;
  const goalSteps = 7000;
  const progress = currentSteps / goalSteps;

  const streakDaysCompleted = [true, true, true, false];
  const dayLabels = ['M', 'T', 'W', 'T'];
  const rewardCoins = 20;

  // The main component content is wrapped in a padding View 
  return (
    <View style={styles.screenPaddingContainer}>
      {/* GREETING SECTION */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.greetingTitle}>Hello Samiksha 👋🏼</Text>
        <Text style={styles.subText}>
          Today, {monthName} {day}
        </Text>
      </View>

      {/* 1. WEEKLY HISTORY CARD (NEW) */}
      <WeeklyHistoryCard />

      {/* 2. DAILY PROGRESS CARD */}
      <View style={styles.dailyProgressCard}>
        
        {/* Top Row: Steps and View More */}
        <View style={styles.topRow}>
          <Text style={styles.stepsTextLarge}>
            <Text style={styles.currentSteps}>{currentSteps}</Text>
            {' / '}
            {goalSteps} Steps
          </Text>

          <TouchableOpacity style={styles.viewMoreRow}>
            <Text style={styles.viewMoreText}>View More</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* PROGRESS BAR */}
        <View style={styles.progressBackground}>
          <LinearGradient
            colors={['#F779B3', '#9B5CFF']} // Adjusted gradient to match 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.min(1, progress) * 100}%` }]}
          />
        </View>

        {/* BOTTOM STATS */}
       <View style={styles.statsRow}>
  {/* KM */}
  <View style={styles.statBox}>
    <LocationIcon width={28} height={28} />
    <Text style={styles.statValue}>0.7 Km</Text>
  </View>

  {/* MOVE MIN */}
  <View style={styles.statBox}>
    <ClockIcon width={28} height={28} />
    <Text style={styles.statValue}>10 Move Min</Text>
  </View>

  {/* STREAK */}
  <View style={styles.statBox}>
    <LightningIcon width={28} height={28} />
    <Text style={styles.statValue}>7 Day Streak</Text>
  </View>
</View>

      </View>

      {/* 3. STREAK CARD */}
      <View style={styles.cardContainer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Your Active Streak Plan</Text>

          <View style={styles.row}>
            <Text style={styles.streakDetailsText}>
              4,000 steps • 4 days
            </Text>
            <Rewards
              style={styles.coinIcon}
            />
            <Text style={styles.coinValue}>{rewardCoins}</Text>
          </View>

          {/* Dynamic streak dots */}
          <View style={styles.streakRow}>
            {streakDaysCompleted.map((done, index) => {
                // Determine if this is the current day (index 3 in mock data)
                const isCurrent = index === 3; 

                return done ? (
                    <LinearGradient
                        key={index}
                        colors={['#A855F7', '#EC4899']} // Pink/Purple gradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.checkCircle}
                    >
                        {/* Using text checkmark as asset path is unknown */}
                        <Text style={styles.checkIconText}>✓</Text> 
                    </LinearGradient>
                ) : (
                    <View 
                        key={index} 
                        style={[
                            styles.emptyCircle, 
                            isCurrent && styles.currentCircleBorder // Add thicker border for current day
                        ]} 
                    />
                )
            })}
          </View>

          {/* Day Labels */}
          <View style={styles.labelRow}>
            {dayLabels.map((label, i) => (
              <Text key={i} style={[styles.label, i === 3 && styles.currentLabel]}>
                {label}
              </Text>
            ))}
          </View>
        </View>

        {/* Lightning icon */}
{/* Lightning SVG on right */}
<LightningIcon
  width={80}
  height={100}
  style={styles.lightIcon}
/>

      </View>
    </View>
  );
};

export default PlanProgressCard;

const styles = StyleSheet.create({
    screenPaddingContainer: {
        flex: 1,
        backgroundColor: '#F7F7FA', // Light blue/white background from 
        paddingHorizontal: 20,
        paddingTop: 60, // Space for status bar/top edge
    },

    /* Greeting Section */
    greetingTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    subText: {
        fontSize: 16,
        marginTop: 5,
        color: '#6A6A6A',
    },

    // ====================================================
    // 1. WEEKLY HISTORY CARD STYLES
    // ====================================================
    weeklyCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        paddingVertical: 15,
        paddingHorizontal: 10,
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    weeklyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    dayItem: {
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    todayItemContainer: {
        backgroundColor: '#FEE5FF', // Light pink background for today
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    todayItemText: {
        color: '#A855F7', // Purple text for today
        fontWeight: '700',
    },
    dayLabel: {
        fontSize: 14,
        color: '#6A6A6A',
        fontWeight: '600',
    },
    dateText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginVertical: 4,
    },
    dayProgressContainer: {
        height: 40,
        width: 10,
        overflow: 'hidden',
        alignItems: 'center',
    },
    dayProgressTrack: {
        width: 6,
        height: 40,
        backgroundColor: '#E5E5E5',
        borderRadius: 3,
        overflow: 'hidden',
        justifyContent: 'flex-end', // Progress starts from the bottom
    },
    dayProgressFill: {
        width: '100%',
        backgroundColor: '#66BB6A',
        borderRadius: 3,
    },

    // ====================================================
    // 2. DAILY PROGRESS CARD STYLES
    // ====================================================
    dailyProgressCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 20,
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    stepsTextLarge: {
        fontSize: 18,
        color: "#555",
    },
    currentSteps: {
        fontSize: 24,
        fontWeight: "700",
        color: "#000",
    },
    viewMoreRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    viewMoreText: {
        color: "#4A4AFC",
        fontSize: 15,
        fontWeight: "600",
        marginRight: 6,
    },
    arrow: {
        fontSize: 18,
        color: "#4A4AFC",
        fontWeight: '300',
    },

    // Progress Bar
    progressBackground: {
        width: "100%",
        height: 14,
        backgroundColor: "#E0E0E0",
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 20,
    },
    progressFill: {
        height: "100%",
        borderRadius: 20,
    },

    // Bottom Stats
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around", // Spread stats evenly
        alignItems: "center",
    },
    statBox: {
        alignItems: "center",
        flex: 1, // Ensures even spacing
    },
    statIcon: {
        width: 28,
        height: 28,
        marginBottom: 4,
        resizeMode: "contain",
    },
    statValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },


    // ====================================================
    // 3. STREAK CARD STYLES
    // ====================================================
    cardContainer: {
        width: '100%', // Use full container width
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    streakDetailsText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#444',
        marginRight: 10,
    },
    coinIcon: {
        width: 20,
        height: 20,
    },
    coinValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#29A300',
        marginLeft: 4,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        justifyContent: 'space-between',
        width: '70%', // Control width for dot spacing
    },
    checkCircle: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkIconText: {
        fontSize: 20,
        color: 'white',
        fontWeight: '700',
        lineHeight: 35, // Helps center the checkmark text
        textAlign: 'center',
    },
    emptyCircle: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        borderWidth: 2,
        borderColor: '#EC4899', // Pink border color
        backgroundColor: '#F5F5F5',
    },
    currentCircleBorder: {
        borderWidth: 3, // Thicker border for current day
    },
    labelRow: {
        flexDirection: 'row',
        marginTop: 4,
        justifyContent: 'space-between',
        width: '70%',
    },
    label: {
        width: 35, // Matches circle width for alignment
        textAlign: 'center',
        color: '#666',
        fontWeight: '600',
        fontSize: 13,
    },
    currentLabel: {
        fontWeight: '700',
        color: '#A855F7',
    },
    lightIcon: {
        width: 80,
        height: 100,
        resizeMode: 'contain',
        position: 'absolute',
        right: 0,
        top: 0,
    },
});