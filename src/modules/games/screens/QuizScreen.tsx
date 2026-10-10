import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { answerQuiz, getQuiz, getQuizLeaderboard, nextQuizQuestion, startQuiz, type QuizLeader, type QuizRules, type QuizSession } from '../api/quizApi';

type Page = 'leaderboard' | 'question' | 'result';
const defaultRules: QuizRules = { questionCount: 5, secondsPerQuestion: 15, correctPoints: 2, wrongPenalty: 1, timeoutPenalty: 1 };
const errorMessage = (error: any) => error?.response?.data?.message || 'Could not connect. Check your connection and try again.';
const quizInfoCards = [
  { source: require('../assets/quiz-questions.png'), aspectRatio: 424 / 268, label: '5 Questions. Each quiz has 5 exciting questions.' },
  { source: require('../assets/quiz-timer.png'), aspectRatio: 420 / 264, label: 'Time Limit. You have 15 seconds to answer each question.' },
  { source: require('../assets/quiz-rewards.png'), aspectRatio: 420 / 264, label: '2 Rewards Each. Earn 2 rewards for every question you answer.' },
];

export default function QuizScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(160, (Math.min(width, 540) - 40) * 0.5);
  const heroHeight = quizInfoCards.reduce((height, card) => height + cardWidth / card.aspectRatio, 24);
  const [page, setPage] = useState<Page>('leaderboard');
  const [session, setSession] = useState<QuizSession | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [leaders, setLeaders] = useState<QuizLeader[]>([]);
  const [rules, setRules] = useState(defaultRules);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(15);
  const deadline = useRef(0);
  const requestActive = useRef(false);
  const mounted = useRef(true);
  const questionIndex = session?.index ?? 0;
  const question = session?.question;
  const correct = session?.feedback === 'correct';
  const timedOut = session?.feedback === 'timeout';
  const wrong = selected !== null && !correct && !timedOut;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const loadLeaders = useCallback(async () => {
    setLoadingLeaders(true);
    setError('');
    try {
      const data = await getQuizLeaderboard();
      if (mounted.current) { setLeaders(data.players); setRules(data.rules); }
    } catch (e) { if (mounted.current) setError(errorMessage(e)); }
    finally { if (mounted.current) setLoadingLeaders(false); }
  }, []);

  useEffect(() => { if (page === 'leaderboard') loadLeaders(); }, [page, loadLeaders]);

  const request = useCallback(async (operation: () => Promise<QuizSession>) => {
    if (requestActive.current) return;
    requestActive.current = true;
    setBusy(true);
    setError('');
    const sentAt = Date.now();
    try {
      const data = await operation();
      if (!mounted.current) return;
      // Estimate the clock offset at the request midpoint; response latency
      // must not grant another full 15 seconds on the device.
      deadline.current = (sentAt + Date.now()) / 2 + data.deadline - data.serverNow;
      setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
      setSession(data);
      setRules(data.rules);
      setSelected(data.selected);
      setPage(data.status === 'completed' ? 'result' : 'question');
    } catch (e) { if (mounted.current) setError(errorMessage(e)); }
    finally { requestActive.current = false; if (mounted.current) setBusy(false); }
  }, []);

  useEffect(() => {
    if (page !== 'question' || !session || session.feedback) return;
    const update = () => setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    update();
    const interval = setInterval(update, 200);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') update(); });
    return () => { clearInterval(interval); listener.remove(); };
  }, [page, session]);

  useEffect(() => {
    if (page === 'question' && session && seconds === 0 && !session.feedback && !busy && !error) {
      request(() => getQuiz(session.id));
    }
  }, [page, session, seconds, busy, error, request]);

  const goBack = useCallback(() => {
    if (requestActive.current) return;
    if (page !== 'leaderboard') setPage('leaderboard');
    else navigation.goBack();
  }, [navigation, page]);

  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => listener.remove();
  }, [goBack]));

  const start = () => request(startQuiz);

  const advance = () => {
    if (!session || busy) return;
    if (error) { request(() => getQuiz(session.id)); return; }
    if (wrong) {
      setSelected(null);
      return;
    }
    if (correct || timedOut) request(() => nextQuizQuestion(session.id, session.index));
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#080B13" />
      {page === 'leaderboard' ? (
        <ScrollView contentContainerStyle={styles.landing} showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>Quivio <Text style={styles.gold}>🏆</Text></Text>
          </View>
          <View style={[styles.hero, { height: heroHeight }]}>
            <Image source={require('../assets/quiz-host.png')} style={styles.host} resizeMode="contain" accessibilityLabel="Quivio host in a purple suit" />
            <View style={styles.facts}>
              {quizInfoCards.map(card => (
                  <Image
                    key={card.label}
                    source={card.source}
                    style={[styles.factImage, { width: cardWidth, height: cardWidth / card.aspectRatio }]}
                    resizeMode="contain"
                    accessible
                    accessibilityLabel={card.label}
                  />
              ))}
            </View>
          </View>
          <LinearGradient colors={['#071A32', '#030812']} style={styles.arena}>
            <View style={styles.trophy}><Icon name="trophy" size={40} color="#FFCB42" /></View>
            <Text style={styles.playTitle}>Play Smart Quiz Every Day</Text>
            <Text style={styles.tagline}>Boost knowledge daily, win challenges,{ '\n' }become smarter every day.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Start quiz" disabled={busy || loadingLeaders} onPress={start} style={styles.startWrap}>
              <LinearGradient colors={['#FFE363', '#FFB800', '#FF9C00']} style={styles.start}>
                {busy || loadingLeaders ? <ActivityIndicator color="#121212" /> : <><Text style={styles.startText}>{session?.status === 'playing' ? 'Resume' : 'Start'}</Text><Icon name="play-outline" size={25} color="#121212" /></>}
              </LinearGradient>
            </Pressable>
            <View style={styles.leaderboard}>
              <Text accessibilityRole="header" style={styles.leaderTitle}>Leaderboard 🏆</Text>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableHeading, styles.rank]}>Rank</Text>
                  <Text style={[styles.tableHeading, styles.player]}>Player</Text>
                  <Text style={[styles.tableHeading, styles.score]}>Score</Text>
                </View>
                {leaders.map((player, index) => (
                  <View key={player.user_id} style={styles.tableRow}>
                    <View style={styles.rank}>
                      {index < 3 ? <Icon name="medal" size={25} color={['#FFD253', '#CBD4E0', '#D98A48'][index]} /> : <Text style={styles.cell}>{index + 1}</Text>}
                    </View>
                    <View style={[styles.player, styles.playerRow]}>
                      <View style={styles.avatar}><Text style={styles.initial}>{player.name?.[0] || '?'}</Text></View>
                      <Text style={styles.cell}>{player.name}</Text>
                    </View>
                    <Text style={[styles.cell, styles.score]}>{player.score}</Text>
                  </View>
                ))}
              </View>
              {loadingLeaders && <ActivityIndicator color="#00DFED" />}
              {!loadingLeaders && !error && leaders.length === 0 && <Text style={styles.previewNote}>Be the first to complete a quiz!</Text>}
            </View>
            <Text style={styles.previewNote}>Best completed score · Quiz points are separate from wallet rewards</Text>
            {!!error && <Pressable accessibilityRole="button" onPress={loadLeaders}><Text style={styles.error}>{error} Tap to retry.</Text></Pressable>}
          </LinearGradient>
        </ScrollView>
      ) : page === 'question' && session && question ? (
        <View style={styles.questionContainer}>
        <ScrollView key={questionIndex} contentContainerStyle={styles.questionPage} showsVerticalScrollIndicator={false}>
          <View style={styles.questionHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to leaderboard" onPress={goBack} style={styles.back}><Icon name="chevron-left" color="#FFFFFF" size={28} /></Pressable>
            <Text accessibilityRole="header" style={styles.questionCount}>Question {questionIndex + 1} of {session.total}</Text>
          </View>
          <View style={styles.progress} accessibilityLabel={`Question ${questionIndex + 1} of ${session.total}`}>
            {Array.from({ length: session.total }, (_, index) => <View key={index} style={[styles.segment, index <= questionIndex && styles.segmentActive]} />)}
          </View>
          <Text style={styles.points}>Score: {session.score} · Wrong attempt −{rules.wrongPenalty}</Text>
          <View style={styles.timerSpace}>
            <View style={[styles.timer, seconds <= 5 && !correct && styles.timerUrgent]} accessibilityLabel={`${seconds} seconds remaining`}>
              <Text style={styles.timerValue}>00:{String(seconds).padStart(2, '0')}</Text><Text style={styles.seconds}>Seconds</Text>
            </View>
          </View>
          <Text accessibilityRole="header" style={styles.question}>{question.question}</Text>
          <View style={styles.options}>
            {question.options.map((option, index) => {
              const isSelected = selected === index;
              const stateStyle = isSelected ? (correct ? styles.correct : styles.incorrect) : undefined;
              const textStyle = isSelected ? (correct ? styles.correctText : styles.incorrectText) : undefined;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={`${String.fromCharCode(65 + index)}. ${option}${isSelected ? (correct ? ', correct' : ', incorrect') : ''}`}
                  accessibilityState={{ selected: isSelected, disabled: selected !== null || busy || seconds === 0 || timedOut || session.attempts.includes(index) }}
                  disabled={selected !== null || busy || seconds === 0 || timedOut || session.attempts.includes(index)}
                  onPress={() => request(() => answerQuiz(session.id, questionIndex, index))}
                  style={[styles.option, stateStyle, !isSelected && session.attempts.includes(index) && styles.usedOption]}
                >
                  <View style={[styles.letterCircle, isSelected && stateStyle]}><Text style={[styles.letter, textStyle]}>{String.fromCharCode(65 + index)}</Text></View>
                  <Text style={[styles.optionText, textStyle]}>{option}</Text>
                  {isSelected && <Icon name={correct ? 'check' : 'close'} size={21} color={correct ? '#40D335' : '#FF343F'} />}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.questionFooter}>
          <Text accessibilityLiveRegion="polite" style={styles.feedback}>{timedOut ? `Time’s up! −${rules.timeoutPenalty} point` : selected === null ? ' ' : correct ? `Correct! +${rules.correctPoints} points` : `Incorrect. −${rules.wrongPenalty} point. Try another answer.`}</Text>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || (!error && selected === null && !timedOut) }} disabled={busy || (!error && selected === null && !timedOut)} onPress={advance} style={[styles.action, styles.questionAction, !error && selected === null && !timedOut && styles.disabledAction, wrong && styles.retryAction]}>
            {busy ? <ActivityIndicator color="#030B12" /> : <Text style={[styles.actionText, styles.questionActionText]}>{error ? 'Reconnect' : wrong ? 'Try Again' : questionIndex === session.total - 1 ? 'Finish' : 'Continue'}</Text>}
          </Pressable>
        </View>
        </View>
      ) : (
        <View style={styles.result}>
          <Icon name="trophy" size={88} color="#FFCB42" />
          <Text accessibilityRole="header" style={styles.resultTitle}>Quiz complete!</Text>
          <Text style={styles.resultScore}>{session?.score ?? 0} pts</Text>
          <Text style={styles.resultCopy}>Correct: {session?.correctCount ?? 0} / {session?.total ?? 5} · Wrong attempts: {session?.wrongCount ?? 0}{'\n'}Timed out: {(session?.total ?? 5) - (session?.correctCount ?? 0)}</Text>
          <Text style={styles.previewNote}>Score saved · Your best round counts on the leaderboard</Text>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable accessibilityRole="button" disabled={busy} onPress={start} style={styles.action}>{busy ? <ActivityIndicator color="#030B12" /> : <Text style={styles.actionText}>Play Again</Text>}</Pressable>
          <Pressable accessibilityRole="button" onPress={goBack} style={styles.touchTarget}><Text style={styles.skip}>Back to Leaderboard</Text></Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080B13' },
  landing: { paddingHorizontal: 20, paddingBottom: 20, maxWidth: 540, width: '100%', alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: '#FFFFFF', fontSize: 23, fontWeight: '700' },
  gold: { color: '#FFCB42' },
  touchTarget: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  skip: { color: '#EDEEF4', fontSize: 14 },
  hero: { flexDirection: 'row', marginHorizontal: -10 },
  host: { position: 'absolute', left: 0, bottom: -16, width: '44%', height: '105%', zIndex: 1 },
  facts: { flex: 1, marginLeft: '44%', gap: 2, paddingTop: 8, paddingRight: 10, paddingBottom: 12 },
  factImage: { alignSelf: 'center', flexShrink: 0 },
  arena: { borderWidth: 1, borderColor: '#168BFF', borderRadius: 28, padding: 9, paddingTop: 30, shadowColor: '#008CFF', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
  trophy: { position: 'absolute', top: -23, alignSelf: 'center' },
  playTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  tagline: { color: '#CCD1DC', textAlign: 'center', fontSize: 11, lineHeight: 15, marginTop: 5 },
  startWrap: { alignSelf: 'center', width: '68%', marginVertical: 14, borderRadius: 26, borderWidth: 1, borderColor: '#FFEB97', overflow: 'hidden' },
  start: { minHeight: 44, flexDirection: 'row', gap: 14, alignItems: 'center', justifyContent: 'center' },
  startText: { fontSize: 19, fontWeight: '700', color: '#111111' },
  leaderboard: { borderWidth: 1, borderColor: '#2476C5', borderRadius: 18, padding: 6 },
  leaderTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center', paddingVertical: 6 },
  table: { borderWidth: 1, borderColor: '#1C3049', borderRadius: 10, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1C3049', minHeight: 31 },
  tableHeading: { color: '#B9C2D1', fontSize: 10, paddingVertical: 4 },
  rank: { width: '19%', alignItems: 'center', textAlign: 'center' },
  player: { flex: 1, paddingLeft: 8 },
  score: { width: '23%', textAlign: 'center' },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#1C3049', paddingVertical: 3 },
  avatar: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#9BB9F7' },
  initial: { color: '#14213C', fontSize: 12, fontWeight: '700' },
  cell: { color: '#F4F6FC', fontSize: 12 },
  previewNote: { color: '#94A3B8', fontSize: 10, textAlign: 'center', marginVertical: 8 },
  error: { color: '#FF9DA9', fontSize: 13, textAlign: 'center', marginVertical: 8 },
  points: { color: '#9BCFF5', fontSize: 12, textAlign: 'center', marginTop: 14 },
  timerUrgent: { borderColor: '#FF5964' },
  usedOption: { opacity: 0.4 },
  questionContainer: { flex: 1 },
  questionFooter: { paddingHorizontal: 24, paddingBottom: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
  questionPage: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, maxWidth: 480, width: '100%', alignSelf: 'center' },
  questionHeader: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 44 },
  back: { position: 'absolute', left: 0, width: 44, height: 44, justifyContent: 'center' },
  questionCount: { color: '#FFFFFF', fontSize: 16, fontWeight: '500', textAlign: 'center' },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  segment: { width: 23, height: 6, borderRadius: 3, backgroundColor: '#D9D9D9' },
  segmentActive: { backgroundColor: '#388BCD' },
  timerSpace: { minHeight: 116, justifyContent: 'center', alignItems: 'center', paddingVertical: 14 },
  timer: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: '#388BCD', alignItems: 'center', justifyContent: 'center' },
  timerValue: { color: '#F7FFFF', fontSize: 22, fontVariant: ['tabular-nums'] },
  seconds: { color: '#FFFFFF', fontSize: 12, letterSpacing: 1 },
  question: { color: '#FAFAFF', fontSize: 18, fontWeight: '600', textAlign: 'center', lineHeight: 25, marginBottom: 20, marginTop: 8 },
  options: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: 8, borderWidth: 1, borderColor: '#388BCD', borderRadius: 11, backgroundColor: '#142031' },
  letterCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#60BFFF', backgroundColor: '#091D35', justifyContent: 'center', alignItems: 'center' },
  letter: { color: '#60BFFF', fontSize: 16, fontWeight: '700' },
  optionText: { flex: 1, color: '#FFFFFF', fontSize: 17 },
  correct: { backgroundColor: '#142F15', borderColor: '#40D335' },
  incorrect: { backgroundColor: '#300C19', borderColor: '#FF343F' },
  correctText: { color: '#40D335' },
  incorrectText: { color: '#FF343F' },
  feedback: { minHeight: 20, color: '#C9D3E0', fontSize: 12, textAlign: 'center', marginTop: 12 },
  action: { minHeight: 60, borderRadius: 30, backgroundColor: '#00DFED', alignItems: 'center', justifyContent: 'center', padding: 14, marginTop: 22, width: '100%' },
  disabledAction: { backgroundColor: '#E5E5E5' },
  retryAction: { backgroundColor: '#FFD0DA', borderWidth: 1, borderColor: '#FF343F' },
  actionText: { color: '#030B12', fontSize: 21, fontWeight: '600' },
  questionAction: { minHeight: 52, borderRadius: 26, padding: 12, marginTop: 14 },
  questionActionText: { fontSize: 18 },
  result: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14, maxWidth: 540, width: '100%', alignSelf: 'center' },
  resultTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '700' },
  resultScore: { color: '#00DFED', fontSize: 48, fontWeight: '700' },
  resultCopy: { color: '#CCD1DC', fontSize: 16, textAlign: 'center', lineHeight: 24 },
});
