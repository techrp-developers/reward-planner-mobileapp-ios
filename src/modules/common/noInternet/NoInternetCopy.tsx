import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';
import NoInternetBackground from '../../../assets/homepage/NoInternetBG.svg';
import NoInternetStatus from '../../../assets/homepage/NoInternetStatus.svg';

const { width, height } = Dimensions.get('window');

interface Props {
  onRetry?: () => void;
}

const TREES = [
  { left: '5%', bottom: 4, size: 42, opacity: 0.62 },
  { left: '16%', bottom: -2, size: 30, opacity: 0.4 },
  { left: '27%', bottom: 15, size: 46, opacity: 0.65 },
  { left: '38%', bottom: 5, size: 31, opacity: 0.42 },
  { left: '53%', bottom: 10, size: 52, opacity: 0.6 },
  { left: '67%', bottom: 8, size: 38, opacity: 0.42 },
  { left: '83%', bottom: 13, size: 54, opacity: 0.62 },
  { left: '94%', bottom: 1, size: 30, opacity: 0.4 },
];

export default function NoInternetScreen({ onRetry }: Props) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await NetInfo.refresh();
      onRetry?.();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#8799CD" />

      <View style={styles.header} pointerEvents="none">
        <LinearGradient
          colors={['#8799CD', '#AEBCE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <NoInternetBackground width={width + 32} height={250} style={styles.headerWaves} />
      </View>

      <View style={styles.content}>
        <View style={styles.illustrationWrap}>
          <View style={styles.sparkleLeft}>
            <MaterialCommunityIcons name="star-four-points" size={25} color="#FFC341" />
          </View>
          <NoInternetStatus width={174} height={171} />
          <View style={styles.sparkleRight}>
            <MaterialCommunityIcons name="star-four-points" size={28} color="#FFC341" />
          </View>
        </View>

        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.message}>
          Wi-Fi is on a space adventure 🚀{`\n`}
          Rewards are safe at mission control ✨{`\n`}
          We’ll catch up when you’re online!
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Try reconnecting"
          activeOpacity={0.86}
          disabled={retrying}
          onPress={handleRetry}
          style={styles.buttonWrap}
        >
          <LinearGradient
            colors={retrying ? ['#B6A4FF', '#8B78CF'] : ['#8965FF', '#5B46A7']}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 0.8 }}
            style={styles.button}
          >
            {retrying ? <ActivityIndicator color="#FFFFFF" /> : null}
            <Text style={styles.buttonText}>{retrying ? 'Checking connection…' : 'Try Again'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.landscape} pointerEvents="none">
        <View style={[styles.hill, styles.hillBack]} />
        <View style={[styles.hill, styles.hillFront]} />
        {TREES.map((tree, index) => (
          <MaterialCommunityIcons
            key={index}
            name="pine-tree"
            size={tree.size}
            color="#246782"
            style={[styles.tree, tree]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 254,
    overflow: 'hidden',
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
  },
  headerWaves: {
    position: 'absolute',
    top: 0,
    left: -16,
    opacity: 0.92,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: Math.min(height * 0.05, 46),
    paddingBottom: 100,
  },
  illustrationWrap: {
    width: 210,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 27,
  },
  sparkleLeft: {
    position: 'absolute',
    left: 8,
    top: 40,
  },
  sparkleRight: {
    position: 'absolute',
    right: 2,
    top: 83,
  },
  title: {
    color: '#3F414A',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
    textAlign: 'center',
    marginBottom: 28,
  },
  message: {
    color: '#555761',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 27,
    textAlign: 'center',
    marginBottom: 47,
  },
  buttonWrap: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#6448C2',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.22,
    shadowRadius: 15,
    elevation: 7,
  },
  button: {
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  landscape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 118,
    overflow: 'hidden',
    backgroundColor: '#5B9DB0',
  },
  hill: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#67ADBD',
  },
  hillBack: {
    width: width * 0.95,
    height: 132,
    left: width * 0.12,
    bottom: 26,
  },
  hillFront: {
    width: width * 1.06,
    height: 108,
    left: -width * 0.46,
    bottom: -42,
    backgroundColor: '#4E94A8',
  },
  tree: {
    position: 'absolute',
  },
});
