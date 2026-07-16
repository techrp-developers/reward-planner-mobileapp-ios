import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type Plan = {
  id: string;
  title: string;
  description: string;
  price: string;
  oldPrice?: string;
};

interface Props {
  headerText: string;
  plans: Plan[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function PlanCard({
  headerText,
  plans,
  selectedId,
  onSelect,
}: Props) {
  return (
    <View>
      {/* TOP GRADIENT HEADER */}
      <LinearGradient
        colors={['#A654CD', '#FC8BAD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerText}>🛡 {headerText}</Text>
      </LinearGradient>

      {/* PLANS */}
      <View style={styles.row}>
        {plans.map(plan => {
          const isActive = plan.id === selectedId;

          return (
            <TouchableOpacity
              key={plan.id}
              activeOpacity={0.85}
              onPress={() => onSelect(plan.id)}
              style={[
                styles.card,
                isActive && styles.activeCard,
              ]}
            >
              {isActive && (
                <LinearGradient
                  colors={['#A654CD', '#FC8BAD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}

              <View style={styles.inner}>
                <Text
                  style={[
                    styles.planTitle,
                    isActive && styles.activeText,
                  ]}
                >
                  {plan.title}
                </Text>

                <Text
                  style={[
                    styles.desc,
                    isActive && styles.activeText,
                  ]}
                >
                  {plan.description}
                </Text>

                <Text
                  style={[
                    styles.price,
                    isActive && styles.activeText,
                  ]}
                >
                  {plan.price}{' '}
                  {plan.oldPrice && (
                    <Text style={styles.oldPrice}>
                      {plan.oldPrice}
                    </Text>
                  )}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  card: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  activeCard: {
    borderColor: 'transparent',
  },

  inner: {
    zIndex: 2,
  },

  planTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },

  desc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },

  price: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
  },

  oldPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },

  activeText: {
    color: '#FFFFFF',
  },
});
