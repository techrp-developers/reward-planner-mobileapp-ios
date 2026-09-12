import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  value: 'bundle' | 'individual';
  onChange: (v: 'bundle' | 'individual') => void;
}

const PriceTypeToggle: React.FC<Props> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      {value === 'bundle' ? (
        <LinearGradient
          colors={['#8665FF', '#5B47A3']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.activeBtn}
        >
          <Text style={styles.activeText}>Bundle Price</Text>
        </LinearGradient>
      ) : (
        <TouchableOpacity
          style={styles.inactiveBtn}
          onPress={() => onChange('bundle')}
        >
          <Text style={styles.inactiveText}>Bundle Price</Text>
        </TouchableOpacity>
      )}

      {value === 'individual' ? (
        <LinearGradient
          colors={['#8665FF', '#5B47A3']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.activeBtn}
        >
          <Text style={styles.activeText}>Individual Price</Text>
        </LinearGradient>
      ) : (
        <TouchableOpacity
          style={styles.inactiveBtn}
          onPress={() => onChange('individual')}
        >
          <Text style={styles.inactiveText}>Individual Price</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PriceTypeToggle;
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F2',
    borderRadius: 24,
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
  },

  activeBtn: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },

  inactiveBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },

  activeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },

  inactiveText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
});
