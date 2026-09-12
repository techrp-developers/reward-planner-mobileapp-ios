import { fetchUserInfo } from '../../common/auth/api/AuthAPI';
import React, { useState, useEffect } from 'react';
import { useAlert } from '../../ecommerce/components/alerts';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import RPAIAssistantHeader from '../header/Rpaiassistantheader';

// ---------- Icon Components ----------

const GiftIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={10} width={18} height={12} rx={2} stroke="#6c63d4" strokeWidth={1.8} />
    <Path d="M3 10H21V14H3V10Z" stroke="#6c63d4" strokeWidth={1.8} />
    <Path d="M12 10V22" stroke="#6c63d4" strokeWidth={1.8} />
    <Path d="M12 10C12 10 9 7 9 5C9 3.9 9.9 3 11 3C11.6 3 12 3.4 12 4" stroke="#6c63d4" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M12 10C12 10 15 7 15 5C15 3.9 14.1 3 13 3C12.4 3 12 3.4 12 4" stroke="#6c63d4" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const TrackIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#2196F3" strokeWidth={1.8} />
    <Circle cx={12} cy={12} r={4} stroke="#2196F3" strokeWidth={1.8} />
    <Circle cx={12} cy={12} r={1.5} fill="#2196F3" />
  </Svg>
);

const TrendIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M3 17L9 11L13 15L21 7" stroke="#4CAF50" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 7H21V11" stroke="#4CAF50" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="#E91E63">
    <Path d="M12 21C12 21 3 14 3 8C3 5.2 5.2 3 8 3C9.7 3 11.2 3.9 12 5.2C12.8 3.9 14.3 3 16 3C18.8 3 21 5.2 21 8C21 14 12 21 12 21Z" fill="#E91E63" />
  </Svg>
);

const GridIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={3} width={7} height={7} rx={1} fill="#FF5722" />
    <Rect x={14} y={3} width={7} height={7} rx={1} fill="#FF9800" />
    <Rect x={3} y={14} width={7} height={7} rx={1} fill="#4CAF50" />
    <Rect x={14} y={14} width={7} height={7} rx={1} fill="#2196F3" />
  </Svg>
);

const DineIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2V8M12 8C10 8 8 9 8 12C8 15 10 16 12 16C14 16 16 15 16 12C16 9 14 8 12 8ZM8 16V22M16 16V22" stroke="#555" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const MicIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x={9} y={2} width={6} height={12} rx={3} stroke="#888" strokeWidth={1.8} />
    <Path d="M5 11C5 15.4 8.1 19 12 19C15.9 19 19 15.4 19 11" stroke="#888" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M12 19V22M9 22H15" stroke="#888" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const SendIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ---------- Quick Action Chip ----------

interface ChipProps {
  icon?: React.ReactNode;
  label: string;
  onPress?: () => void;
}

const Chip: React.FC<ChipProps> = ({ icon, label, onPress }) => (
  <TouchableOpacity activeOpacity={0.75} style={styles.chip} onPress={onPress}>
    {icon && <View style={styles.chipIcon}>{icon}</View>}
    <Text style={styles.chipText}>{label}</Text>
  </TouchableOpacity>
);

// ---------- Main Screen ----------

const AIAssistantScreen: React.FC = () => {
  const alert = useAlert();
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>('');

  const handleUnavailable = () => {
    alert.info('RP AI Assistant', 'RP AI Assistant is not available at this moment.');
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const result = await fetchUserInfo();
        const name = result?.name || result?.user?.first_name || null;
        setUserName(name);
      } catch {
        setUserName(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const displayName = userName
    ? userName.trim().split(/\s+/)[0] // first name only
    : null;

  const quickActions: ChipProps[] = [
    { icon: <GiftIcon />, label: 'Show my rewards', onPress: handleUnavailable },
    { icon: <TrackIcon />, label: 'Track my expenses', onPress: handleUnavailable },
    { icon: <TrendIcon />, label: 'How can I save more this month?', onPress: handleUnavailable },
    { label: 'RP Points', onPress: handleUnavailable },
    { label: 'Step Count', onPress: handleUnavailable },
    { icon: <HeartIcon />, label: 'Suggest health goals for today', onPress: handleUnavailable },
    { icon: <GridIcon />, label: 'Which modules should I use today?', onPress: handleUnavailable },
    { label: 'Offers', onPress: handleUnavailable },
    { icon: <DineIcon />, label: 'Show dine out offers near me', onPress: handleUnavailable },
  ];

  return (
    <SafeAreaView style={styles.safe}>

       <RPAIAssistantHeader/>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={16}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Greeting */}
          <View style={styles.greetingBlock}>
            {loading ? (
              <ActivityIndicator color="#6c63d4" style={{ marginBottom: 8 }} />
            ) : (
              <Text style={styles.greetingTitle}>
                Hi {displayName ?? 'there'}! 👋
              </Text>
            )}
            <Text style={styles.greetingSubtitle}>
              I'm your RP AI Assistant. I can help you maximize rewards, track
              expenses, stay healthy, and discover the best offers just for you.
            </Text>
          </View>

          {/* Quick Action Chips — wrap layout */}
          <View style={styles.chipsContainer}>
            {quickActions.map((item, idx) => (
              <Chip key={idx} icon={item.icon} label={item.label} />
            ))}
          </View>
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask anything, get your answer..."
              placeholderTextColor="#aaa"
              value={inputText}
              onChangeText={setInputText}
              multiline={false}
              returnKeyType="send"
            />
            <TouchableOpacity activeOpacity={0.7} style={styles.micButton} onPress={handleUnavailable}>
              <MicIcon />
            </TouchableOpacity>
          </View>
          <TouchableOpacity activeOpacity={0.85} style={styles.sendButton} onPress={handleUnavailable}>
            <SendIcon />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ---------- Styles ----------

const PURPLE = '#6c63d4';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5fb',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 16,
  },

  // Greeting
  greetingBlock: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#e0ddf5',
    paddingVertical: 9,
    paddingHorizontal: 14,
    gap: 6,
  },
  chipIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13.5,
    color: '#1a1a2e',
    fontWeight: '400',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#f5f5fb',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e0ddf5',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a2e',
    paddingRight: 8,
  },
  micButton: {
    padding: 2,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AIAssistantScreen;
