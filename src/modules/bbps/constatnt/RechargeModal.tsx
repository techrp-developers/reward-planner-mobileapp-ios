import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';

import Eko from '../assets/BBPS_Service/serviceorg-medium.png';
import { useBbpsTheme } from '../utils/useBbpsTheme';

interface RechargeModalProps {
  visible: boolean;
  onClose: () => void;
  onRecharge?: () => void;
}

const RechargeModal: React.FC<RechargeModalProps> = ({
  visible,
  onClose,
}) => {
  const bbpsTheme = useBbpsTheme();
  const scaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleValue.setValue(0);
    }
  }, [visible, scaleValue]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.contentGroup}>
          <Animated.View
            style={[
              styles.modalWrapper,
              { transform: [{ scale: scaleValue }] },
            ]}
          >
            <View style={[styles.modalContainer, { backgroundColor: bbpsTheme.colors.surface }]}>
              <View style={[styles.logoCircle, { backgroundColor: bbpsTheme.isDark ? '#18112A' : '#F3E9FB' }]}>
                <Image source={Eko} style={styles.logoImage} resizeMode="contain" />
              </View>

              <Text style={[styles.companyName, { color: bbpsTheme.colors.textStrong }]}>
                Eko India Financial Services Pvt. Ltd.
              </Text>

              <View style={styles.divider} />

              <Text style={styles.title}>Service Temporarily Unavailable</Text>

              <Text style={[styles.detailsText, { color: bbpsTheme.colors.muted }]}>
                BBPS (Eko) services are currently unavailable.{'\n'}
                Please avoid initiating any transactions{'\n'}
                until the service is restored.
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.okBtn, { backgroundColor: bbpsTheme.colors.primary }]}
                onPress={onClose}
              >
                <Text style={styles.okBtnText}>Okay, Got It</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <TouchableOpacity
            style={styles.closeCircle}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentGroup: {
    alignItems: 'center',
    width: '100%',
  },
  modalWrapper: {
    width: '100%',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  modalContainer: {
    width: '100%',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F3E9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F1B24',
    textAlign: 'center',
  },
  divider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E31E24',
    marginTop: 14,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E31E24',
    textAlign: 'center',
    marginBottom: 12,
  },
  detailsText: {
    color: '#4A4550',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  okBtn: {
    backgroundColor: '#9D62D9',
    paddingVertical: 14,
    width: '85%',
    borderRadius: 15,
    marginTop: 26,
    alignItems: 'center',
  },
  okBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  closeCircle: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  closeIcon: {
    fontSize: 22,
    color: '#333333',
    fontWeight: 'bold',
  },
});

export default RechargeModal;
