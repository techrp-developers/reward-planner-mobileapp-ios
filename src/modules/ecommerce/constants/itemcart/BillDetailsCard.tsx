import React, { useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, Switch } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { useAppTheme } from '../../../../theme/ThemeContext'

type Props = {
  cartTotal?: number
  finalPayable?: number
  totalRewardEarn?: number
  totalRedeemed?: number
  useRewards?: boolean
  onUseRewardsChange?: (value: boolean) => void
  subtotal?: number
  totalDiscount?: number
  finalTotal?: number
  bagDiscount?: number
  shippingCharges?: number
  shippingLabel?: string
  showShippingCharges?: boolean
  handlingFees?: number
  showHandlingFees?: boolean
  rewardCoinsAvailable?: number
  showRedeemableCoins?: boolean
  onPayableChange?: (amount: number) => void
}

const formatAmount = (amount: number) => `₹${Math.max(0, Number(amount || 0))}`

export default function BillDetailsCard({
  cartTotal,
  finalPayable,
  totalRewardEarn,
  totalRedeemed,
  useRewards = true,
  onUseRewardsChange,
  subtotal,
  finalTotal,
  bagDiscount = 0,
  shippingCharges = 0,
  shippingLabel = 'Shipping Charges',
  showShippingCharges = true,
  handlingFees = 0,
  showHandlingFees = false,
  rewardCoinsAvailable,
  showRedeemableCoins = false,
  onPayableChange,
}: Props) {
  const { isDark, theme } = useAppTheme()
  const safeCartTotal = useMemo(() => Math.max(0, Number(cartTotal ?? subtotal ?? 0)), [cartTotal, subtotal])
  const safeFinalPayable = useMemo(() => Math.max(0, Number(finalPayable ?? finalTotal ?? 0)), [finalPayable, finalTotal])
  const safeRewardEarn = useMemo(() => Math.max(0, Number(totalRewardEarn || 0)), [totalRewardEarn])
  const safeRedeemed = useMemo(() => Math.max(0, Number(totalRedeemed || 0)), [totalRedeemed])
  const safeBagDiscount = useMemo(() => Math.max(0, Number(bagDiscount || 0)), [bagDiscount])
  const safeShipping = useMemo(() => Math.max(0, Number(shippingCharges || 0)), [shippingCharges])
  const safeHandlingFees = useMemo(() => Math.max(0, Number(handlingFees || 0)), [handlingFees])
  const safeAvailableRewards = useMemo(
    () => Math.max(0, Number(rewardCoinsAvailable ?? safeRedeemed)),
    [rewardCoinsAvailable, safeRedeemed]
  )

  const rewardDiscount = useRewards ? safeRedeemed : 0
  const payableAmount = safeFinalPayable
  const canUseRewards = safeAvailableRewards > 0

  useEffect(() => {
    onPayableChange?.(payableAmount)
  }, [onPayableChange, payableAmount])

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>Bill Details</Text>

      <View style={styles.rewardToggleRow}>
        <View>
          <Text style={[styles.label, { color: theme.secondaryText }]}>Use Reward Coins</Text>
          <Text style={[styles.helperText, { color: theme.secondaryText }]}>Available savings on this order</Text>
          {showRedeemableCoins && (
            <Text style={[styles.redeemableText, { color: theme.primary }]}>
              {safeAvailableRewards.toLocaleString('en-IN')} coins redeemable
            </Text>
          )}
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.coinValue, { color: theme.text }]}>
            {formatAmount(useRewards ? safeRedeemed : safeAvailableRewards)}
          </Text>
          <Switch
            value={canUseRewards && useRewards}
            onValueChange={onUseRewardsChange ?? (() => {})}
            disabled={!canUseRewards}
            trackColor={{ false: isDark ? '#374151' : '#E5E7EB', true: '#22C55E' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <MemoRow label="Item Total" value={formatAmount(safeCartTotal)} />
      <MemoRow
        label="Bag Discount"
        value={formatAmount(safeBagDiscount)}
        valueStyle={safeBagDiscount > 0 ? styles.negative : undefined}
      />

      {rewardDiscount > 0 && (
        <MemoRow
          label="Reward Discount"
          value={`-${formatAmount(rewardDiscount)}`}
          valueStyle={styles.negative}
        />
      )}

      {showShippingCharges && (
        <MemoRow label={shippingLabel} value={formatAmount(safeShipping)} />
      )}

      {showHandlingFees && (
        <MemoRow label="Handling Fees" value={formatAmount(safeHandlingFees)} />
      )}

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: theme.text }]}>Order Total</Text>
        <Text style={[styles.totalValue, { color: theme.text }]}>{formatAmount(payableAmount)}</Text>
      </View>

      {rewardDiscount > 0 && (
        <Text style={styles.savedText}>
          You saved <Text style={styles.savedBold}>{formatAmount(rewardDiscount)}</Text> using rewards
        </Text>
      )}

      {safeRewardEarn > 0 && (
        <View style={[styles.rewardBanner, { backgroundColor: isDark ? '#2D2148' : '#F5F3FF' }]}>
          <MaterialIcons name="auto-awesome" size={18} color={theme.primary} />
          <Text style={[styles.rewardText, { color: theme.primary }]}>
            You will earn <Text style={styles.rewardBold}>{formatAmount(safeRewardEarn)}</Text> coins
          </Text>
        </View>
      )}
    </View>
  )
}

function Row({ label, value, valueStyle }: any) {
  const { theme } = useAppTheme()

  return (
    <View style={styles.rowBetween}>
      <Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.text }, valueStyle]}>{value}</Text>
    </View>
  )
}

const MemoRow = React.memo(Row)

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginVertical: 10,
    marginHorizontal: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  rewardToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  label: {
    fontSize: 13,
    color: '#374151',
  },
  helperText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  redeemableText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  negative: {
    color: '#16A34A',
    fontWeight: '700',
  },
  savedText: {
    marginTop: 8,
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
  savedBold: {
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  rewardBanner: {
    marginTop: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rewardText: {
    flexShrink: 1,
    fontSize: 13,
    color: '#6D28D9',
    textAlign: 'center',
  },
  rewardBold: {
    fontWeight: '800',
  },
})
