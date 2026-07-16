import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface DailyData {
  date: number; // Day of the month
  completed: boolean;
}

interface MonthData {
  name: string;
  daysCompleted: number;
  daysMissed: number;
  dailyProgress: DailyData[];
}

// --- Mock Data (Replace with real API data) ---
const mockProgressData: MonthData[] = [
  {
    name: 'September',
    daysCompleted: 20,
    daysMissed: 10,
    dailyProgress: Array.from({ length: 30 }, (_, i) => ({
      date: i + 1,
      completed: i < 20,
    })),
  },
  {
    name: 'October',
    daysCompleted: 25,
    daysMissed: 6,
    dailyProgress: Array.from({ length: 31 }, (_, i) => ({
      date: i + 1,
      completed: i < 25,
    })),
  },
  {
    name: 'November',
    daysCompleted: 18, // From image
    daysMissed: 10,   // From image
    dailyProgress: [
      // Mock data matching the visible calendar in the image
      ...Array.from({ length: 11 }, (_, i) => ({ date: i + 1, completed: i >= 4 })), // Day 1-11
      ...Array.from({ length: 14 }, (_, i) => ({ date: i + 12, completed: true })), // Day 12-25
      ...Array.from({ length: 4 }, (_, i) => ({ date: i + 26, completed: false })), // Day 26-29
      { date: 30, completed: false },
    ].slice(0, 30), // November has 30 days
  },
  {
    name: 'December',
    daysCompleted: 5,
    daysMissed: 1,
    dailyProgress: Array.from({ length: 31 }, (_, i) => ({
      date: i + 1,
      completed: i < 5,
    })),
  },
];

const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// --- Sub-Components ---

const MonthTabs: React.FC<{
  data: MonthData[];
  selectedMonth: string;
  onSelect: (month: string) => void;
}> = ({ data, selectedMonth, onSelect }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.monthTabsContainer}>
    {data.map((month) => (
      <TouchableOpacity
        key={month.name}
        style={[
          styles.monthTab,
          selectedMonth === month.name && styles.selectedMonthTab,
        ]}
        onPress={() => onSelect(month.name)}>
        <Text
          style={[
            styles.monthTabText,
            selectedMonth === month.name && styles.selectedMonthTabText,
          ]}>
          {month.name}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const CalendarGrid: React.FC<{ progress: DailyData[]; selectedDay: number }> = ({
  progress,
  selectedDay,
}) => {


  const paddingDays = [29, 30, 31]; // Days from the previous month (October)
  const fullGrid = [
    ...paddingDays.map((d) => ({ date: d, completed: true, isPadding: true })),
    ...progress.map((item) => ({ ...item, isPadding: false })),
  ];
  
  // Cut off after 42 cells (6 rows * 7 days)
  const displayGrid = fullGrid.slice(0, 42);

  return (
    <View style={styles.calendarContainer}>
      {/* Days of the Week Header */}
      <View style={styles.daysOfWeekContainer}>
        {daysOfWeek.map((day) => (
          <Text key={day} style={styles.dayOfWeekText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Days */}
      <View style={styles.calendarGrid}>
        {displayGrid.map((item, index) => {
          const isSelected = item.date === selectedDay && !item.isPadding;
          const isCurrentMonthDay = !item.isPadding;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                item.completed && isCurrentMonthDay && styles.completedDay,
                isSelected && styles.selectedDay,
                !isCurrentMonthDay && styles.paddingDay,
              ]}
              // In a real app, you would select this day to show its stats
              onPress={() => { /* setSelectedDay(item.date) */ }}>
              {isCurrentMonthDay ? (
                // Current Month Day
                <>
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.selectedDayText,
                      !item.completed && styles.uncompletedDayText,
                    ]}>
                    {item.date}
                  </Text>
                  {item.completed && (
                    <Icon name="check" size={16} color="#FFFFFF" style={styles.checkIcon} />
                  )}
                </>
              ) : (
                // Padding Day (Previous/Next Month)
                <Text style={styles.paddingDayText}>
                  {item.date}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// --- Main Component ---

const ProgressScreen: React.FC = () => {
  const [selectedMonthName, setSelectedMonthName] = useState('November');
  const selectedMonthData = mockProgressData.find(
    (m) => m.name === selectedMonthName,
  ) || mockProgressData[0]; // Fallback
  
  const [selectedDay] = useState(29); 
  
  // Mock daily stats for the selected day (Nov 29)
  const dailyStats = {
      steps: 4978,
      kcal: 200,
      km: 0.7,
      moveMin: 10,
      
  };
  
  const highestStepDay = {
      steps: 10839,
      date: '16 November',
  };

  return (
    <SafeAreaView style={styles.fullScreen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => console.log('Go back')}>
            <Icon name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Your Progress</Text>
        </View>

        {/* 1. Month Tabs */}
        <MonthTabs
          data={mockProgressData}
          selectedMonth={selectedMonthName}
          onSelect={setSelectedMonthName}
        />

        {/* Separator */}
        <View style={styles.separator} />

        {/* 2. Progress Header */}
        <View style={styles.progressHeader}>
          <Text style={styles.dateInfo}>
            <Text style={styles.boldText}>29 {selectedMonthName}:</Text> {selectedMonthData.daysCompleted} days Completed • {selectedMonthData.daysMissed} days Missed
          </Text>
        </View>

        {/* 3. Calendar Grid */}
        <CalendarGrid
          progress={selectedMonthData.dailyProgress}
          selectedDay={selectedDay}
        />

        {/* 4. Daily Stats Summary */}
        <View style={styles.statsSummaryContainer}>
          <StatItem value={dailyStats.steps} unit="Steps" icon="run" color="#3b5998" />
          <StatItem value={dailyStats.kcal} unit="Kcal" icon="fire" color="#ff4500" />
          <StatItem value={dailyStats.km} unit="Km" icon="map-marker-distance" color="#ff1493" />
          <StatItem value={dailyStats.moveMin} unit="Move Min" icon="timer-sand" color="#1e90ff" />
        </View>
        
        {/* Separator */}
        <View style={styles.separator} />


        {/* 5. Highest Step Day Card */}
        <View style={styles.highestStepCard}>
            <Icon name="trophy" size={24} color="#FFD700" style={styles.trophyIcon} />
            <View>
                <Text style={styles.cardTitle}>Your Highest Step Day</Text>
            </View>
            <View style={styles.highestStepDetails}>
                <Text style={styles.highestStepCount}>{highestStepDay.steps.toLocaleString()}{' '}Steps</Text>
                <Text style={styles.highestStepDate}>{highestStepDay.date}</Text>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Simple Stat Item component
const StatItem: React.FC<{ value: number; unit: string; icon: string; color: string }> = ({ value, unit, icon, color }) => (
    <View style={styles.statItem}>
      <Icon name={icon} size={20} color={color} style={styles.statIcon} />
      <Text style={[styles.statValue, {color}]}>{value.toLocaleString()}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
);

// --- Stylesheet ---

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#000',
  },
  separator: {
      height: 1,
      backgroundColor: '#f0f0f0',
      marginVertical: 15,
  },

  // 1. Month Tabs Styles
  monthTabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  monthTab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    borderRadius: 20,
  },
  selectedMonthTab: {
    backgroundColor: '#FFEBEE', // Light pink background
  },
  monthTabText: {
    fontSize: 16,
    color: '#808080',
    fontWeight: '500',
  },
  selectedMonthTabText: {
    color: '#FF1493', // Pink text
    fontWeight: '600',
  },

  // 2. Progress Header Styles
  progressHeader: {
    marginBottom: 15,
  },
  dateInfo: {
    fontSize: 14,
    color: '#555',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000',
  },

  // 3. Calendar Grid Styles
  calendarContainer: {
    marginBottom: 20,
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayOfWeekText: {
    width: '14%', // Approx 100% / 7 days
    textAlign: 'center',
    fontWeight: '600',
    color: '#888',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%', // 1/7th of the row
    aspectRatio: 1, // Makes it a square
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    zIndex: 2,
  },
  uncompletedDayText: {
      color: '#000',
  },
  completedDay: {
    backgroundColor: '#90EE90', // Light green background for completed days
  },
  selectedDay: {
    borderWidth: 2,
    borderColor: '#FF1493', // Pink border for the selected day
    backgroundColor: 'transparent', // Override background
  },
  selectedDayText: {
      color: '#FF1493', // Pink text for selected day
  },
  checkIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3CB371', // Darker green checkmark background
    borderRadius: 8,
    lineHeight: 16,
    padding: 0,
  },
  paddingDay: {
    backgroundColor: '#f9f9f9', // Very light background for days outside the month
  },
  paddingDayText: {
      color: '#ccc',
  },

  // 4. Daily Stats Summary Styles
  statsSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
    width: '24%', // To fit 4 items nicely
  },
  statIcon: {
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statUnit: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },

  // 5. Highest Step Day Card Styles
  highestStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7FF', // Light purple/white background
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  trophyIcon: {
      marginRight: 10,
  },
  cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#555',
  },
  highestStepDetails: {
      flex: 1,
      alignItems: 'flex-end',
  },
  highestStepCount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#5D3FD3', // A shade of purple
  },
  highestStepDate: {
      fontSize: 12,
      color: '#888',
  },
});

export default ProgressScreen;