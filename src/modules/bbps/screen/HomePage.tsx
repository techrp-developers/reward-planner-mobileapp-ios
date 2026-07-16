import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import RechargeBill from '../component/home/ReachargeBill';
import { useBbpsTheme } from '../utils/useBbpsTheme';

function HomePageComponent() {
  const { colors } = useBbpsTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <RechargeBill />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
});

export default React.memo(HomePageComponent);
