import React from 'react';
import { Share, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient'; // Ensure this package is installed
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useBbpsTheme } from '../../utils/useBbpsTheme';

type RechargeSuccessCardProps = {
  onPayAnother?: () => void;
};

const RechargeSuccessCard = ({ onPayAnother }: RechargeSuccessCardProps) => {
  const bbpsTheme = useBbpsTheme();

  const handleShare = () => {
    Share.share({
      title: 'Recharge successful',
      message: 'DTH recharge of customer 736263728 was successful.',
    }).catch(() => {});
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: bbpsTheme.colors.background }]}>
      {/* Main Card with specified top-to-bottom gradient */}
      <LinearGradient
        colors={bbpsTheme.isDark ? ['#111113', '#132016'] : ['#FBFFFC', '#E2FFE9']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.cardContainer}
      >
        <View style={styles.cardContent}>
          {/* Header Section */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.successTitle, { color: bbpsTheme.colors.textStrong }]}>DTH Recharge Successful</Text>
              <Text style={[styles.dateTimeText, { color: bbpsTheme.colors.muted }]}>19-01-2026, 9:01 AM</Text>
            </View>
            
            {/* Green Success Checkmark Badge */}
            <View style={styles.checkBadgeContainer}>
              <View style={styles.outerGlow} />
              <LinearGradient
                colors={['#6DC41A', '#04A275']}
                style={styles.checkCircle}
              >
                <MaterialIcons name="check" size={28} color="#FFF" />
              </LinearGradient>
            </View>
          </View>

          {/* Biller Info Section */}
          <View style={styles.billerInfoRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>d2h</Text>
            </View>
            <View>
              <Text style={[styles.billerName, { color: bbpsTheme.colors.textStrong }]}>D2H</Text>
              <Text style={[styles.customerID, { color: bbpsTheme.colors.muted }]}>736263728</Text>
              <Text style={styles.paidStatus}>Paid</Text>
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: bbpsTheme.colors.divider }]} />

          {/* Buttons Row */}
          <View style={styles.buttonRow}>
            {/* "Pay Another Bill" with specified gradient */}
            <TouchableOpacity activeOpacity={0.8} onPress={onPayAnother}>
              <LinearGradient
                start={{ x: 1, y: 0.5 }}
                end={{ x: 0, y: 0.5 }}
                colors={bbpsTheme.gradients.primary}
                style={styles.payAnotherButton}
              >
                <Text style={styles.payAnotherText}>Pay Another Bill</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={[
                styles.shareButton,
                {
                  backgroundColor: bbpsTheme.colors.surface,
                  borderColor: bbpsTheme.colors.primary,
                },
              ]}
              onPress={handleShare}
            >
              <Text style={[styles.shareText, { color: bbpsTheme.colors.primary }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom edge gradient */}
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={['#6DC41A', '#04A275']}
          style={styles.bottomEdgeGradient}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8F9FE',
    justifyContent: 'center',
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C1E9D0',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardContent: {
    padding: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  checkBadgeContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D1FAE5',
    opacity: 0.6,
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  billerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4C1D95',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  billerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  customerID: {
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 2,
  },
  paidStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payAnotherButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  payAnotherText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8665FF',
    backgroundColor: '#FFF',
  },
  shareText: {
    color: '#8665FF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomEdgeGradient: {
    height: 6,
    width: '100%',
  },
});

export default RechargeSuccessCard;
