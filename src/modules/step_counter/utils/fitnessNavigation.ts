import { CommonActions, StackActions, type NavigationState } from '@react-navigation/native';
import type { FitnessTab } from '../component/fitness/FitnessTabBar';

/** Target the fitness stack explicitly: the parent also has a Dashboard route. */
export function fitnessTabAction(state: NavigationState, tab: FitnessTab) {
  const current = state.routes[state.index];
  if (current?.name === tab || (current?.name === 'AfterGoal' && tab === 'Dashboard')) return null;
  const action = tab === 'Dashboard' || current?.name === 'Dashboard' || current?.name === 'AfterGoal'
    ? CommonActions.navigate(tab)
    : StackActions.replace(tab);
  return { ...action, target: state.key, source: current?.key };
}

/** Deep links can open a screen with no previous fitness route. */
export function goBackInFitness(navigation: {
  canGoBack: () => boolean;
  goBack: () => void;
  dispatch: (action: ReturnType<typeof CommonActions.navigate>) => void;
}, fallback = 'Dashboard') {
  if (navigation.canGoBack()) navigation.goBack();
  else navigation.dispatch(CommonActions.navigate(fallback));
}
