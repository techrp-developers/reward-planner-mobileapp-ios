import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
const StartConversationAvatars = require('../../assete/service/Gov_Conversation.png');

export default function NeedHelpBanner() {
  return (
    <LinearGradient
      colors={['#DFE4FF', '#4F6BFF']}
      style={styles.container}
    >
      {/* TEXT + AVATAR ROW */}
      <View style={styles.topRow}>
        <View style={styles.textCol}>
          <Text style={styles.title}>Need help with Government Documents?</Text>
          <Text style={styles.description}>
            Not sure which document you need? Our team will guide you step by step.
          </Text>
        </View>

        <Image
          source={StartConversationAvatars}
          style={styles.avatarImage}
          resizeMode="contain"
        />
      </View>

      {/* SPLIT ACTION BUTTON */}
      <View style={styles.actionButton}>
        <View style={styles.numberSection}>
          <Text style={styles.phoneNumber}>+91 8660 583751</Text>
        </View>

        <TouchableOpacity style={styles.talkSection} activeOpacity={0.8} onPress={() => Linking.openURL('tel:+918660583751')}>
          <Text style={styles.talkText}>Talk To Us</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    // padding: 16,
    borderRadius: 20,
    marginHorizontal: 12,

  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  textCol: {
    flex: 1,
    padding: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  avatarImage: {
    width: 72,
    height: 48,
    paddingRight: 8,
  },
  actionButton: {
    flexDirection: 'row',
    height: 42,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    overflow: 'hidden',
    margin: 8,
    // Shadow
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  numberSection: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#FDE68A',
  },
  phoneNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  talkSection: {
    flex: 1,
    backgroundColor: '#FCD34D', // Mustard yellow for action side
    justifyContent: 'center',
    alignItems: 'center',
  },
  talkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
  },
});