import React from 'react';
import { Text, View, Image, StyleSheet } from 'react-native';

export default function BudgetHome() {
  return (
    <View style={styles.container}>
      {/* Horizontal Cards Container */}
      <View style={styles.horizontalContainer}>
        {/* Steps Card - 85% Complete */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.progressContainer}>
              <View style={styles.circularProgressWrapper}>
                <View style={styles.outerCircle}>
                  {/* Background */}
                  <View style={styles.progressBackground} />

                  {/* Top Half - Always filled for 85% */}
                  <View
                    style={[
                      styles.halfCircle,
                      styles.topHalf,
                      styles.greenProgress,
                    ]}
                  />

                  {/* Bottom Right Quarter - 35% of bottom half (85% total) */}
                  <View
                    style={[
                      styles.quarterCircle,
                      styles.bottomRightQuarter,
                      styles.greenProgress,
                      { height: '70%' },
                    ]}
                  />

                  <View style={styles.innerCircle}>
                    <Image
                      source={require('../assets/homepage/sparts.png')}
                      style={styles.progressImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
                <Text style={styles.percentageText}>85%</Text>
                <View style={styles.textContainer}>
                  <Text style={styles.mainLabelfirst}>6,420 steps today</Text>
                  <Text style={styles.progressText}>85% to your step goal</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Spending Card - 80% Complete */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.progressContainer}>
              <View style={styles.circularProgressWrapper}>
                <View style={styles.outerCircle}>
                  {/* Background */}
                  <View style={styles.progressBackground} />

                  {/* Top Half - Always filled for 80% */}
                  <View
                    style={[
                      styles.halfCircle,
                      styles.topHalf,
                      styles.redProgress,
                    ]}
                  />

                  {/* Bottom Right Quarter - 30% of bottom half (80% total) */}
                  <View
                    style={[
                      styles.quarterCircle,
                      styles.bottomRightQuarter,
                      styles.redProgress,
                      { height: '60%' },
                    ]}
                  />

                  <View style={styles.innerCircle}>
                    <Image
                      source={require('../assets/homepage/Group.png')}
                      style={styles.progressImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
                <Text style={styles.percentageText}>80%</Text>
                <View style={styles.textContainer}>
                  <Text style={styles.mainLabelsecond}>spent ₹2,350 today</Text>
                  <Text style={styles.progressText}>80% of budget used</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#ffffffff',
  },
  horizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#f5f3f3ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flex: 1,
    marginHorizontal: 4,
    minWidth: '48%', 
  },
  cardContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  mainValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mainLabelfirst: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 4,
    fontWeight: '800',
    textAlign: 'center',
  },
  mainLabelsecond: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 4,
    fontWeight: '800',
    textAlign: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  circularProgressWrapper: {
    alignItems: 'center',
  },
  outerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
  },
  halfCircle: {
    position: 'absolute',
    width: '100%',
    height: '50%',
  },
  topHalf: {
    top: 0,
    backgroundColor: '#4CAF50',
  },
  quarterCircle: {
    position: 'absolute',
    width: '50%',
    bottom: 0,
    right: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 50,
  },
  bottomRightQuarter: {
    backgroundColor: '#4CAF50',
  },
  greenProgress: {
    backgroundColor: '#4CAF50',
  },
  redProgress: {
    backgroundColor: '#F44336',
  },
  innerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressImage: {
    width: 35,
    height: 35,
  },
  percentageText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
