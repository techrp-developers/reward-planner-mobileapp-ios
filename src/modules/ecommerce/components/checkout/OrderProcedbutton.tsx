import { formatCurrency } from '../../utils/formatCurrency'
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import StickyBottomCTA from '../../../../bottombar/StickyBottomCTA'
import { useStickyBottomCTA } from '../../../../bottombar/hooks/useStickyBottomCTA'
import { useAppTheme } from '../../../../theme/ThemeContext'
import { useTranslation } from "react-i18next";

type Props = {
  total: number;
  count: number;
  loading?: boolean;
  disabled?: boolean;
  onPlaceOrder?: () => void | Promise<void>;
  wrapperPaddingBottom?: number;
  bottomOffset?: number;
  onLayout?: ReturnType<typeof useStickyBottomCTA>['onCtaLayout'];
};

export default function OrderProcedbutton({
  total,
  count,
  loading = false,
  disabled = false,
  onPlaceOrder,
  wrapperPaddingBottom = 16,
  bottomOffset,
  onLayout,
}: Props) {
  const { t: tx } = useTranslation();
  const { isDark, theme } = useAppTheme()
  const safeTotal = Number.isFinite(Number(total)) ? Number(total) : 0;
  const autoSticky = useStickyBottomCTA({ tabBarAware: false });
  const resolvedBottomOffset = bottomOffset ?? autoSticky.bottomOffset;
  const resolvedOnLayout = onLayout ?? autoSticky.onCtaLayout;

  return (
    <StickyBottomCTA bottomOffset={resolvedBottomOffset} onLayout={resolvedOnLayout}>
      <View style={[
        styles.wrapper,
        {
          paddingBottom: wrapperPaddingBottom,
          backgroundColor: isDark ? '#111827' : '#F4F5FF',
          shadowColor: isDark ? '#000000' : '#111827',
        },
      ]}>
        <View style={styles.bottomBar}>
          <View>
            <Text style={[styles.price, { color: theme.text }]}>{formatCurrency(safeTotal)}</Text>
            <Text style={[styles.items, { color: theme.secondaryText }]}>{count} items selected</Text>
          </View>

          <TouchableOpacity activeOpacity={0.85} onPress={onPlaceOrder} disabled={loading || disabled}
            accessibilityRole="button" accessibilityState={{ disabled: loading || disabled, busy: loading }}>
            <LinearGradient colors={['#8665FF', '#5B47A3']} style={[styles.button, disabled && !loading ? styles.disabledButton : null]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{tx("products:orderProcedbutton.placeOrder")}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </StickyBottomCTA>
  );
}



const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#F4F5FF',
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 12,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTitle: {
    fontWeight: '600',
    fontSize: 13,
  },
  addressSub: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  changeText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 13,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  items: {
    fontSize: 12,
    color: '#777',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 12,
  },
  // Must read as not tappable; 0.8 looked identical to the enabled state.
  disabledButton: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
})
