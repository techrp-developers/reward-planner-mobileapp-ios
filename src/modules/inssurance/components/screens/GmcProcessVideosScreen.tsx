import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  Linking,
  Share,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { rs, fs as rfs } from '../../../../utils/responsive';

interface VideoItem {
  id: string;
  videoId: string;
  title: string;
  subtitle: string;
  category: 'Guide' | 'FAQ' | 'Premium' | 'Analysis';
  categoryLabel: string;
  categoryColor: string;
  duration: string;
  author: string;
  url: string;
  description: string;
  highlights: string[];
}

const GMC_VIDEOS: VideoItem[] = [
  {
    id: '1',
    videoId: 'flDoG_dW1-0',
    title: 'Group Medical Insurance Presentation',
    subtitle: 'Complete Guide for Employers & Employees',
    category: 'Guide',
    categoryLabel: 'Complete Guide',
    categoryColor: '#005b7f',
    duration: 'Full Guide',
    author: 'Policy Planner',
    url: 'https://www.youtube.com/watch?v=flDoG_dW1-0',
    description:
      'Complete walkthrough of Group Medical Insurance coverage, corporate cashless benefits, hospital admission, and how GMC safeguards employees.',
    highlights: ['Cashless Hospitalization', 'Maternity & Newborn Cover', 'Pre-existing Covered'],
  },
  {
    id: '2',
    videoId: 'Er0pvyRmo28',
    title: 'GMC FAQ: Is Pre-Existing Disease Covered?',
    subtitle: 'Pre-existing Disease (PED) Rules Explained in Hindi',
    category: 'FAQ',
    categoryLabel: 'FAQ & Coverage',
    categoryColor: '#10B981',
    duration: '3:15 min',
    author: 'Policy Planner',
    url: 'https://www.youtube.com/watch?v=Er0pvyRmo28',
    description:
      'Understand how corporate GMC plans cover pre-existing conditions (diabetes, hypertension, etc.) from day one without long waiting periods.',
    highlights: ['Zero Waiting Period', 'Day-1 Cover', 'Claim Eligibility'],
  },
  {
    id: '3',
    videoId: 'wlwhGE7zgNc',
    title: 'Group Medical Insurance Premium Explained',
    subtitle: 'Cost Calculation & Premium Slabs by Vivek Pawar',
    category: 'Premium',
    categoryLabel: 'Premium Guide',
    categoryColor: '#7C3AED',
    duration: '4:40 min',
    author: 'Policy Planner',
    url: 'https://www.youtube.com/watch?v=wlwhGE7zgNc',
    description:
      'Detailed insights into how GMC premiums are computed, family coverage slabs, and how employer group insurance saves you significant healthcare costs.',
    highlights: ['Sum Insured Slabs', 'Family Floater Rules', 'Cost Benefits'],
  },
  {
    id: '4',
    videoId: 'qqA95ZKzS7c',
    title: 'Group Medical Insurance: Pros & Cons',
    subtitle: 'In-Depth Analysis & Comparison by Vivek Pawar',
    category: 'Analysis',
    categoryLabel: 'Pros & Cons',
    categoryColor: '#EA580C',
    duration: '5:20 min',
    author: 'Policy Planner',
    url: 'https://www.youtube.com/watch?v=qqA95ZKzS7c',
    description:
      'A balanced breakdown of corporate health cover benefits versus individual policies, portability after leaving a job, and smart claim utilization tips.',
    highlights: ['GMC vs Retail Cover', 'Portability Insights', 'Claim Tips'],
  }, 
];

const GmcProcessVideosScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useAppTheme();
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Guide' | 'FAQ' | 'Premium' | 'Analysis'>('All');

  const filteredVideos =
    selectedFilter === 'All'
      ? GMC_VIDEOS
      : GMC_VIDEOS.filter((v) => v.category === selectedFilter);

  const handleOpenVideo = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('Cannot Open Video', 'Could not open the YouTube video: ' + err.message);
    }
  };

  const handleShareVideo = async (video: VideoItem) => {
    try {
      await Share.share({
        title: video.title,
        message: `Watch "${video.title}" by ${video.author} on YouTube:\n${video.url}`,
      });
    } catch (error) {
      // user cancelled
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View style={[styles.topHeader, { borderBottomColor: isDark ? '#27272A' : '#E2E8F0' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A', marginLeft: rs(10) }]}>
            GMC Process Videos
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {[
            { key: 'All', label: 'All Videos' },
            { key: 'Guide', label: 'Process Guide' },
            { key: 'FAQ', label: 'FAQs & PED' },
            { key: 'Premium', label: 'Premium' },
            { key: 'Analysis', label: 'Pros & Cons' },
          ].map((item) => {
            const isSelected = selectedFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.filterChip,
                  isSelected
                    ? { backgroundColor: '#005b7f', borderColor: '#005b7f' }
                    : {
                        backgroundColor: isDark ? '#1E1E24' : '#FFFFFF',
                        borderColor: isDark ? '#27272A' : '#E2E8F0',
                      },
                ]}
                onPress={() => setSelectedFilter(item.key as any)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : isDark ? '#A1A1AA' : '#64748B' },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Video Cards List */}
        <View style={styles.videosList}>
          {filteredVideos.map((video) => {
            const thumbnailUrl = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

            return (
              <View
                key={video.id}
                style={[
                  styles.videoCard,
                  {
                    backgroundColor: isDark ? '#1E1E24' : '#FFFFFF',
                    borderColor: isDark ? '#27272A' : 'rgba(15,23,42,0.08)',
                  },
                ]}
              >
                {/* Thumbnail with Play Overlay */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleOpenVideo(video.url)}
                  style={styles.thumbnailContainer}
                >
                  <Image
                    source={{ uri: thumbnailUrl }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                  {/* Dark overlay */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.thumbnailOverlay}
                  />

                  {/* Center Play Button */}
                  <View style={styles.playButtonCircle}>
                    <MaterialCommunityIcons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 2 }} />
                  </View>

                  {/* Duration / Type Pill at bottom right */}
                  <View style={styles.durationPill}>
                    <MaterialCommunityIcons name="youtube" size={12} color="#FF0000" style={{ marginRight: 3 }} />
                    <Text style={styles.durationText}>{video.duration}</Text>
                  </View>

                  {/* Category Pill at top left */}
                  <View style={[styles.categoryPill, { backgroundColor: video.categoryColor }]}>
                    <Text style={styles.categoryPillText}>{video.categoryLabel}</Text>
                  </View>
                </TouchableOpacity>

                {/* Content Section */}
                <View style={styles.cardBody}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.videoTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        {video.title}
                      </Text>
                      <Text style={[styles.videoSubtitle, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                        {video.subtitle}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleShareVideo(video)}
                      style={styles.shareBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="share-variant-outline" size={18} color={isDark ? '#A1A1AA' : '#64748B'} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.videoDesc, { color: isDark ? '#94A3B8' : '#475569' }]} numberOfLines={2}>
                    {video.description}
                  </Text>

                  {/* Highlights Pills */}
                  <View style={styles.highlightsRow}>
                    {video.highlights.map((tag, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.highlightBadge,
                          { backgroundColor: isDark ? '#27272A' : '#F1F5F9' },
                        ]}
                      >
                        <MaterialCommunityIcons name="check-circle-outline" size={11} color="#005b7f" style={{ marginRight: 3 }} />
                        <Text style={[styles.highlightText, { color: isDark ? '#CBD5E1' : '#334155' }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Row */}
                  <View style={[styles.cardFooter, { borderTopColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                    <View style={styles.authorRow}>
                      <MaterialCommunityIcons name="account-tie-outline" size={14} color="#005b7f" style={{ marginRight: 4 }} />
                      <Text style={[styles.authorText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                        By {video.author}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.watchNowBtn}
                      onPress={() => handleOpenVideo(video.url)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="youtube" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.watchNowText}>Watch on YouTube</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bottom Help Banner */}
        <View style={[styles.helpBanner, { backgroundColor: isDark ? '#1E1E24' : '#E5F6FD' }]}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color="#005b7f" style={{ marginRight: rs(10) }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.helpBannerTitle, { color: isDark ? '#FFFFFF' : '#003950' }]}>
              Still have questions about your GMC?
            </Text>
            <Text style={[styles.helpBannerSub, { color: isDark ? '#A1A1AA' : '#005b7f' }]}>
              You can raise a claim enquiry or check your covered family members anytime from the home screen.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    marginTop: Platform.OS === 'android' ? rs(26) : rs(10),
    borderBottomWidth: 0.5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: rfs(15),
    fontWeight: '700',
  },
  headerSub: {
    fontSize: rfs(10),
    fontWeight: '500',
    marginTop: rs(1),
  },
  scrollContainer: {
    paddingHorizontal: rs(16),
    paddingTop: rs(6),
    paddingBottom: rs(32),
  },
  filtersContainer: {
    paddingVertical: rs(12),
    gap: rs(8),
  },
  filterChip: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(20),
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: rfs(11),
    fontWeight: '600',
  },
  videosList: {
    gap: rs(16),
  },
  videoCard: {
    borderRadius: rs(16),
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnailContainer: {
    width: '100%',
    height: rs(180),
    position: 'relative',
    backgroundColor: '#000000',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  playButtonCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: rs(50),
    height: rs(50),
    borderRadius: rs(25),
    backgroundColor: 'rgba(220, 38, 38, 0.92)',
    marginTop: -rs(25),
    marginLeft: -rs(25),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryPill: {
    position: 'absolute',
    top: rs(10),
    left: rs(10),
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(6),
  },
  categoryPillText: {
    fontSize: rfs(10),
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  durationPill: {
    position: 'absolute',
    bottom: rs(10),
    right: rs(10),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: rs(7),
    paddingVertical: rs(3),
    borderRadius: rs(4),
  },
  durationText: {
    fontSize: rfs(9),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: rs(14),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  videoTitle: {
    fontSize: rfs(14),
    fontWeight: '700',
    lineHeight: rfs(18),
  },
  videoSubtitle: {
    fontSize: rfs(11),
    fontWeight: '600',
    marginTop: rs(2),
  },
  shareBtn: {
    padding: rs(4),
    marginLeft: rs(8),
  },
  videoDesc: {
    fontSize: rfs(11),
    lineHeight: rfs(15.5),
    marginTop: rs(6),
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(6),
    marginTop: rs(10),
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(6),
  },
  highlightText: {
    fontSize: rfs(11),
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    marginTop: rs(12),
    paddingTop: rs(10),
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    fontSize: rfs(11),
    fontWeight: '600',
  },
  watchNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(8),
  },
  watchNowText: {
    fontSize: rfs(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rs(12),
    padding: rs(14),
    marginTop: rs(18),
  },
  helpBannerTitle: {
    fontSize: rfs(12),
    fontWeight: '700',
  },
  helpBannerSub: {
    fontSize: rfs(10),
    fontWeight: '500',
    marginTop: rs(2),
    lineHeight: rfs(13.5),
  },
});

export default GmcProcessVideosScreen;
