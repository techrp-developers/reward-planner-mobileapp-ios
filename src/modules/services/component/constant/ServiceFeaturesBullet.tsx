import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
const FolderSafe = require('../../assete/service/FolderService.png');
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useServicesTheme } from '../../utils/useServicesTheme';

interface FeatureItem {
  title: string;
  useCheck?: boolean;
  Icon?: React.FC<any>;
}


interface StatItem {
  value: string;
  label: string;
}

interface Props {
  features: FeatureItem[];      // Block 1
  middleTitle: string;          // Block 2
  middlePoints: string[];       // Block 2
  stats?: StatItem[];           // NEW Block (Stats)
  showSafetyCard?: boolean;     // Block 3 toggle
  safetyTitle?: string;
  safetyText?: string;
}

const ServiceFeaturesBullet: React.FC<Props> = ({
  features,
  middleTitle,
  middlePoints,
  stats,
  showSafetyCard = true,
  safetyTitle = '100% Data Safety',
  safetyText = 'Your personal information is protected and used only for your service request.',
}) => {
  const servicesTheme = useServicesTheme();

  return (
    <View>

      {/* ====== BLOCK 1 : ICON FEATURE LIST ====== */}
      <View style={[styles.card, { backgroundColor: servicesTheme.colors.surface, shadowColor: servicesTheme.colors.shadow }]}>
        {features.map((item, index) => (
          <View
            key={index}
            style={[
              styles.featureRow,
              index === features.length - 1 && styles.featureRowLast,
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: servicesTheme.isDark ? '#18112A' : '#F3E8FF' }]}>
              {item.useCheck ? (
                <MaterialIcons name="check" size={16} color={servicesTheme.colors.primary} />
              ) : (
                item.Icon && <item.Icon width={18} height={18} />
              )}
            </View>


            <Text style={[styles.featureText, { color: servicesTheme.colors.text }]}>{item.title}</Text>
          </View>
        ))}
      </View>

      {/* ====== BLOCK 2 : GRADIENT TITLE + TIMELINE ====== */}
      <View style={[styles.card, styles.journeyCard, { backgroundColor: servicesTheme.colors.surface, shadowColor: servicesTheme.colors.shadow, borderLeftColor: servicesTheme.colors.primaryDark }]}>
        <MaskedView
          maskElement={
            <Text style={[styles.header, styles.transparentBg]}>
              {middleTitle}
            </Text>
          }
        >
          <LinearGradient colors={servicesTheme.gradients.primary}>
            <Text style={[styles.header, styles.hidden]}>
              {middleTitle}
            </Text>
          </LinearGradient>
        </MaskedView>

        <View style={styles.middlePointsWrap}>
          {middlePoints.map((item, index) => {
            const separatorIndex = item.indexOf(':');
            const hasDetail = separatorIndex > -1;
            const heading = hasDetail ? item.slice(0, separatorIndex).trim() : item;
            const detail = hasDetail ? item.slice(separatorIndex + 1).trim() : '';
            const isLast = index === middlePoints.length - 1;

            return (
              <View key={index} style={styles.timelineRow}>
                <View style={styles.timelineMarkerCol}>
                  <View style={styles.timelineDot} />
                  {!isLast && <View style={styles.timelineLine} />}
                </View>
                <View style={[styles.timelineContent, !isLast && styles.timelineContentSpacing]}>
                <Text style={[styles.timelineHeading, { color: servicesTheme.colors.textStrong }]}>{heading}</Text>
                  {!!detail && <Text style={[styles.timelineDetail, { color: servicesTheme.colors.muted }]}>{detail}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* ====== BLOCK 2.5 : STATS BLOCK (NEW) ====== */}
      {stats && (
        <View style={styles.statsCardWrap}>
        <LinearGradient
          colors={servicesTheme.isDark ? ['#18112A', '#111113'] : ['#F1EFFF', '#ECEBFF']}
          style={styles.statsCard}
        >
          {stats.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: servicesTheme.colors.primary }]}>{item.value}</Text>
                <Text style={[styles.statLabel, { color: servicesTheme.colors.muted }]}>{item.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </LinearGradient>
        </View>
      )}

      {/* ====== BLOCK 3 : DATA SAFETY (OPTIONAL) ====== */}
      {showSafetyCard && (
        <View style={styles.safetyCardWrap}>
        <LinearGradient
          colors={servicesTheme.isDark ? ['#111113', '#132016'] : ['#F3F3F3', '#E9FFE3']}
          style={styles.safetyCard}
        >
          <View style={styles.flexOne}>
            <Text style={styles.safetyTitle}>{safetyTitle}</Text>
            <Text style={[styles.safetyText, { color: servicesTheme.colors.muted }]}>
              {safetyText}
            </Text>
          </View>

          <View style={styles.iconWrap}>
            <Image
              source={FolderSafe}
              style={styles.safetyIcon}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
        </View>
      )}

      

    </View>
  );
};

export default ServiceFeaturesBullet;


const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureRowLast: {
    marginBottom: 0,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },


  featureText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },

  journeyCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#5B47A3',
  },

  timelineRow: {
    flexDirection: 'row',
  },

  timelineMarkerCol: {
    width: 22,
    alignItems: 'center',
  },

  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F3E8FF',
    borderWidth: 2,
    borderColor: '#B794F6',
  },

  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 2,
    backgroundColor: '#E5D9FF',
  },

  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },

  timelineContentSpacing: {
    paddingBottom: 18,
  },

  timelineHeading: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '700',
  },

  timelineDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },

  header: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },

  hidden: {
    opacity: 0,
  },
  transparentBg: {
    backgroundColor: 'transparent',
  },
  middlePointsWrap: {
    marginTop: 12,
  },
  flexOne: {
    flex: 1,
  },

  safetyCardWrap: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: '#E9FFE3',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
  },

  safetyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20', // solid green like screenshot
  },

  safetyText: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 6,
    lineHeight: 18,
  },

  iconWrap: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },

  safetyIcon: {
    width: 48,
    height: 48,
  },
  statsCardWrap: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: '#ECEBFF',
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 18,
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },

  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(109, 91, 255, 0.18)',
    marginHorizontal: 6,
  },

  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#6D5BFF',
  },

  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
  },

});
