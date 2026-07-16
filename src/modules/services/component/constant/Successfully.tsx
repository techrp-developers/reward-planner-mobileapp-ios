import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface Props {
  statusText?: string;
  title: string;
  description: string;
  enquiryId: string;
}

const { width } = Dimensions.get('window');

const Successfully: React.FC<Props> = ({
  statusText,
  title,
  description,
  enquiryId,
}) => {
  return (
    <View style={styles.root}>
      {/* SOFT RADIANT BACKGROUND */}
      <View style={styles.burstBg} />

      {/* MODERN SEAL ICON */}
      <View style={styles.iconContainer}>
        {/* Decorative rays/dots around the icon */}
        <View style={styles.decoration} /> 
        
        <View style={styles.sealWrapper}>
           {/* Jagged Seal Look (Created by overlapping squares) */}
          <View style={[styles.sealRotate, { transform: [{ rotate: '45deg' }] }]} />
          <View style={[styles.sealRotate, { transform: [{ rotate: '22deg' }] }]} />
          <View style={[styles.sealRotate, { transform: [{ rotate: '67deg' }] }]} />
          <View style={styles.checkInner}>
            <MaterialIcons name="check" size={54} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* DYNAMIC CONTENT */}
      <View style={styles.content}>
        {statusText && (
          <View style={styles.badge}>
            <Text style={styles.confirmedText}>{statusText}</Text>
          </View>
        )}

        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.descText}>{description}</Text>

        <View style={styles.idContainer}>
          <Text style={styles.enquiryIdLabel}>
            Enquiry ID: <Text style={styles.enquiryBold}>{enquiryId}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Successfully;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  burstBg: {
    position: 'absolute',
    top: -width * 0.4,
    width: width * 1.8,
    height: width * 1.8,
    borderRadius: width * 0.9,
    backgroundColor: '#F0FFF4', // Very light mint
    opacity: 0.7,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  sealWrapper: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sealRotate: {
    position: 'absolute',
    width: 95,
    height: 95,
    backgroundColor: '#22C55E',
    borderRadius: 18, // Rounded corners on squares create the "jagged" effect
  },
  checkInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    // Premium shadow
    elevation: 12,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  confirmedText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366F1', 
    textAlign: 'center',
    marginBottom: 10,
  },
  descText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  idContainer: {
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  enquiryIdLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  enquiryBold: {
    fontWeight: '700',
    color: '#111827',
  },
  decoration: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#22C55E',
    borderStyle: 'dotted',
    opacity: 0.2,
  },
});