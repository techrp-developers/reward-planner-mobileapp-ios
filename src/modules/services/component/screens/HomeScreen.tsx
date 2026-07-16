import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';

import Banner from '../constant/Banner';
import ServicesHome from '../home/ServicesHome';
import BannerSliderManual from '../home/BannerSliderManual';
import MostBookedServices from '../home/MostBookedServices';
import QuickServices from '../home/QuickServices';
import BundleService from '../home/BundleService';
import ExclusiveOffers from '../home/ExclusiveOffers';

export default function HomeScreen() {
  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Banner />
        <ServicesHome />
        <BannerSliderManual />

        {/* MOST BOOKED (DYNAMIC) */}
        <MostBookedServices />

        {/* QUICK SERVICES (DYNAMIC GRID) */}
        <QuickServices />
        <ExclusiveOffers />

        <BundleService />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFC',
    paddingTop: 15,
  },
  scrollContent: {
    paddingBottom: 32,
  },
});



