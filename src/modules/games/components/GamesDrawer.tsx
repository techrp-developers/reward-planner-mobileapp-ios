import React, { useMemo, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Modal from 'react-native-modal';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../../navigation/RootNavigator';

export type DrawerGame = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  onPlay?: () => void;
};

// Add onPlay only after a playable screen is connected.
const DEFAULT_GAMES: DrawerGame[] = [
  { id: 'sudoku', title: 'Sudoku', description: 'A little focus. A fresh challenge. Fill the grid and sharpen your mind.', category: 'Puzzle', icon: 'grid', color: '#B9A0FF' },
];

type Props = { games?: DrawerGame[] };

export default function GamesDrawer({ games: customGames }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const games = customGames ?? [
    { id: 'quiz', title: 'Quiz', description: 'Five questions. A new challenge. Test your knowledge with Quivio.', category: 'Trivia', icon: 'head-question-outline', color: '#72DEEF', onPlay: () => navigation.navigate('Quiz') },
    ...DEFAULT_GAMES,
  ];
  const [visible, setVisible] = useState(false);
  const [pendingGame, setPendingGame] = useState<DrawerGame | null>(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const close = () => setVisible(false);
  // Keep dismissal gestures off the list: the modal's pan responder captures
  // touches before the native ScrollView can start a vertical drag.
  const headerSwipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      gesture.dx > 12 && gesture.dx > Math.abs(gesture.dy) * 1.5,
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > 64 || (gesture.dx > 24 && gesture.vx > 0.5)) setVisible(false);
    },
  }), []);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open games"
        accessibilityHint="Opens the games side panel"
        onPress={() => setVisible(true)}
        style={[styles.handle, { right: insets.right, top: Math.max(insets.top + 80, height * 0.43) }]}
      >
        <View style={styles.handleLine} />
        <MaterialCommunityIcons name="controller-classic-outline" size={23} color="#BDF7D4" />
      </Pressable>
      <Modal
        isVisible={visible}
        animationIn="slideInRight"
        animationOut="slideOutRight"
        animationInTiming={280}
        animationOutTiming={240}
        backdropOpacity={0.45}
        onBackdropPress={close}
        onBackButtonPress={close}
        onModalHide={() => {
          const selected = pendingGame;
          setPendingGame(null);
          selected?.onPlay?.();
        }}
        style={styles.modal}
      >
        <View
          accessibilityViewIsModal
          style={[styles.panel, { width: Math.min(width * 0.88, 420), paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20), paddingRight: 20 + insets.right }]}
        >
          <View style={styles.header} {...headerSwipe.panHandlers}>
            <View style={styles.brandIcon}>
              <MaterialCommunityIcons name="controller-classic" size={27} color="#BDF7D4" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>YOUR PLAY SPACE</Text>
              <Text accessibilityRole="header" style={styles.title}>Games</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close games" onPress={close} style={styles.close}>
              <MaterialCommunityIcons name="close" size={26} color="#F5F5F5" />
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            directionalLockEnabled
            nestedScrollEnabled
          >
            <View style={styles.intro}>
              <MaterialCommunityIcons name="creation" size={30} color="#BDF7D4" />
              <Text style={styles.introTitle}>Take a play break</Text>
              <Text style={styles.secondary}>Your next challenge is right here.</Text>
            </View>
            <View style={styles.sectionHeader}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>All games</Text>
            </View>
            {games.length === 0 && <Text style={styles.secondary}>New games will appear here when they are added.</Text>}
            {games.map(game => (
              <View key={game.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.gameIcon, { backgroundColor: game.color }]}>
                    <MaterialCommunityIcons name={game.icon} size={38} color="#171719" />
                  </View>
                  <Text style={styles.category}>{game.category}</Text>
                </View>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.secondary}>{game.description}</Text>
                {game.onPlay ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Play ${game.title}`}
                    onPress={() => { setPendingGame(game); close(); }}
                    style={styles.playButton}
                  >
                    <Text style={styles.playText}>Play now</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#102419" />
                  </Pressable>
                ) : (
                  <View style={styles.soonBadge}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#C8C8CD" />
                    <Text style={styles.soonText}>Coming soon</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  handle: { position: 'absolute', zIndex: 20, width: 44, minHeight: 92, borderTopLeftRadius: 24, borderBottomLeftRadius: 24, backgroundColor: '#171719', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 6 },
  handleLine: { width: 4, height: 24, borderRadius: 2, backgroundColor: '#929296' },
  modal: { margin: 0, alignItems: 'flex-end' },
  panel: { height: '100%', backgroundColor: '#121214', borderTopLeftRadius: 30, borderBottomLeftRadius: 30, paddingLeft: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 24 },
  brandIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#25392E', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  eyebrow: { color: '#A5A5AD', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#FAFAFA', fontSize: 27, fontWeight: '700', marginTop: 3 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#242426', alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 16, gap: 16 },
  scroll: { flex: 1 },
  intro: { backgroundColor: '#20332A', borderRadius: 24, padding: 22, gap: 10 },
  introTitle: { color: '#E5FFEE', fontSize: 25, fontWeight: '600' },
  secondary: { color: '#BDBDC5', fontSize: 14, lineHeight: 21 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  sectionTitle: { color: '#F5F5F5', fontSize: 22, fontWeight: '600' },
  card: { backgroundColor: '#212123', borderRadius: 24, padding: 20, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  gameIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  category: { color: '#C8C8CD', fontSize: 12, flexShrink: 1 },
  gameTitle: { color: '#FAFAFA', fontSize: 23, fontWeight: '600' },
  soonBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, borderRadius: 16, backgroundColor: '#323235', paddingHorizontal: 12, paddingVertical: 8, marginTop: 4 },
  soonText: { color: '#C8C8CD', fontSize: 12, fontWeight: '600' },
  playButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 14, backgroundColor: '#BDF7D4', marginTop: 4 },
  playText: { color: '#102419', fontSize: 14, fontWeight: '700' },
});
