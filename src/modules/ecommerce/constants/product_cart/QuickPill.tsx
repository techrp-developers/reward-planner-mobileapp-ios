import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface QuickPillProps {
  label: string;
}

export default function QuickPill({ label }: QuickPillProps) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
