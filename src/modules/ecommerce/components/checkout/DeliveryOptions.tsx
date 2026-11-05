import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { formatCurrency } from '../../utils/formatCurrency';
import type { DeliveryChoice, DeliveryPreference } from '../../api/CheckoutApi';

type Props = {
  choices: DeliveryChoice[];
  preference: DeliveryPreference;
  loading: boolean;
  supported: boolean;
  disabled?: boolean;
  onSelect: (value: DeliveryPreference) => void;
};
export default function DeliveryOptions({ choices, preference, loading, supported, disabled, onSelect }: Props) {
  const { t, i18n } = useTranslation('products');
  const { isDark, theme } = useAppTheme();
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <Text style={[styles.heading, { color: theme.text }]}>{t('deliveryOptions.title')}</Text>
    {loading ? <View style={styles.progress} accessibilityLiveRegion="polite">
      <ActivityIndicator color={theme.primary} />
      <Text style={{ color: theme.secondaryText }}>{t('deliveryOptions.updating')}</Text>
    </View> : <>
      {choices.map(choice => {
        const selected = preference === choice.preference;
        const locked = !supported || !!disabled;
        const date = choice.estimated_delivery_date ? new Date(choice.estimated_delivery_date) : null;
        const estimate = date && Number.isFinite(date.getTime())
          ? t('deliveryOptions.deliveryBy', { date: date.toLocaleDateString(i18n.language || 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) })
          : Number(choice.delivery_days) > 0
            ? t('deliveryOptions.days', { count: Number(choice.delivery_days) })
            : t('deliveryOptions.estimatePending');
        return <TouchableOpacity key={choice.preference} accessibilityRole="radio"
          accessibilityState={{ checked: selected, disabled: locked }} disabled={locked}
          onPress={() => onSelect(choice.preference)} style={[styles.option, {
            borderColor: selected ? '#8665FF' : theme.border,
            backgroundColor: selected ? (isDark ? '#241C38' : '#F5F0FF') : theme.card,
          }]}>
          <MaterialCommunityIcons name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={isDark ? '#B9A5FF' : '#7551E9'} />
          <View style={styles.description}>
            <Text style={[styles.label, { color: theme.text }]}>{t(choice.preference === 'fastest' ? 'deliveryOptions.quick' : 'deliveryOptions.standard')}</Text>
            <Text style={[styles.caption, { color: theme.secondaryText }]}>{estimate}</Text>
            {choice.partner_name ? <Text style={[styles.caption, { color: theme.secondaryText }]}>{choice.partner_name}</Text> : null}
            {choice.service_type ? <Text style={[styles.caption, { color: theme.secondaryText }]}>{choice.service_type}</Text> : null}
          </View>
          <Text style={[styles.label, { color: theme.text }]}>{choice.shipping_total === 0 ? t('deliveryOptions.free') : formatCurrency(choice.shipping_total)}</Text>
        </TouchableOpacity>;
      })}
      {(!supported || choices.length === 0) && <Text accessibilityLiveRegion="polite" style={[styles.caption, { color: theme.secondaryText }]}>
        {t(!supported ? 'deliveryOptions.unverified' : 'deliveryOptions.unavailable')}
      </Text>}
    </>}
  </View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 12 },
  heading: { fontSize: 14, fontWeight: '800' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: 12, marginTop: 10 },
  description: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
});
