import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useServicesTheme } from '../../utils/useServicesTheme';

export type ServiceTimelineStep = {
  status: string;
  completed: boolean;
};

type Props = {
  steps: ServiceTimelineStep[];
};

export default function ServiceTimelineCard({ steps }: Props) {
  const servicesTheme = useServicesTheme();

  if (steps.length === 0) return null;

  return (
    <View style={styles.container}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <View key={i} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.divider },
                  step.completed && styles.dotDone,
                  step.completed && { backgroundColor: servicesTheme.colors.primary, borderColor: servicesTheme.colors.primary },
                ]}
              >
                {step.completed && (
                  <MaterialCommunityIcons name="check" size={9} color="#FFF" />
                )}
              </View>
              {!isLast && (
                <View style={[styles.connector, { backgroundColor: servicesTheme.colors.divider }, step.completed && styles.connectorDone, step.completed && { backgroundColor: servicesTheme.colors.primary }]} />
              )}
            </View>
            <Text style={[styles.label, { color: servicesTheme.colors.subtle }, step.completed && styles.labelDone, step.completed && { color: servicesTheme.colors.text }]}>
              {step.status}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingLeft: 2 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 34,
  },

  rail: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
  },

  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotDone: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },

  connector: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: 2 },
  connectorDone: { backgroundColor: '#7C3AED' },

  label: { fontSize: 13, color: '#9CA3AF', paddingTop: 2, flex: 1 },
  labelDone: { color: '#111827', fontWeight: '600' },
});
