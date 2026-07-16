import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '../../navigation/type';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Successfully from '../constant/Successfully';

type SubmittedSuccessfulRoute = RouteProp<HomeStackParamList, 'SubmittedSuccessful'>;

const DEFAULT_REDIRECT_DELAY_MS = 3000;

function SubmittedSuccessful({ navigation }: any) {
  const route = useRoute<SubmittedSuccessfulRoute>();

  const statusText = route.params?.statusText ?? 'Enquiry Confirmed';
  const title = route.params?.title ?? 'Enquiry Submitted Successfully';
  const description =
    route.params?.description ?? 'Our team will review the details and get back to you shortly.';
  const enquiryId = route.params?.enquiryId ?? '#RP-ENQ-19472';
  const redirectToHome = route.params?.redirectToHome ?? false;
  const redirectDelayMs = route.params?.redirectDelayMs ?? DEFAULT_REDIRECT_DELAY_MS;

  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(redirectDelayMs / 1000));

  useEffect(() => {
    if (!redirectToHome) return;

    const tick = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    const redirect = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }, redirectDelayMs);

    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [redirectToHome, redirectDelayMs, navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* BACK BUTTON */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation?.goBack()}
      >
        <MaterialIcons name="chevron-left" size={32} color="#374151" />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Successfully
          statusText={statusText}
          title={title}
          description={description}
          enquiryId={enquiryId}
        />

        {redirectToHome && (
          <Text style={styles.redirectText}>
            Redirecting to home in {secondsLeft}s…
          </Text>
        )}

        {/* APP RATING CARD */}
        <View style={styles.wrapper}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="star" size={28} color="#FACC15" />
          </View>

          <View style={styles.textWrap}>
            <Text style={styles.title}>
              Are you loving your experience with our app so far?
            </Text>
            <Text style={styles.link}>Give us a rating</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  redirectText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: -8,
    marginBottom: 8,
  },
  backButton: {
    position: 'absolute',
    top: 20, 
    left: 16,
    zIndex: 10, 
    padding: 8,
  },
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 40, 
    backgroundColor: '#FFFADF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE88A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    lineHeight: 18,
  },
  link: {
    marginTop: 4,
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
});

export default SubmittedSuccessful;