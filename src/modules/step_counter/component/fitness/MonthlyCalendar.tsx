import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface MonthlyCalendarProps {
  currentDate: Date;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ currentDate }) => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Generate calendar days for current week (simplified)
  const getCurrentWeekDates = () => {
    const today = currentDate.getDate();
    const currentDay = currentDate.getDay();
    const startOfWeek = today - currentDay + 1; // Monday as start
    
    return Array.from({ length: 7 }, (_, i) => startOfWeek + i);
  };

  const calendarDays = getCurrentWeekDates();

  return (
    <View style={styles.calendarContainer}>
      <Text style={styles.calendarTitle}>
        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
      </Text>
      
      <View style={styles.weekDaysRow}>
        {weekDays.map((day, index) => (
          <Text key={index} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>
      
      <View style={styles.calendarDaysRow}>
        {calendarDays.map((date, index) => (
          <View key={index} style={styles.dateContainer}>
            <Text style={[
              styles.dateText,
              date === currentDate.getDate() && styles.currentDate
            ]}>
              {date}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
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
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 15,
    textAlign: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: (width - 80) / 7,
    textAlign: 'center',
  },
  calendarDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateContainer: {
    width: (width - 80) / 7,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    padding: 8,
  },
  currentDate: {
    backgroundColor: '#7F56D9',
    color: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
});

export default MonthlyCalendar;