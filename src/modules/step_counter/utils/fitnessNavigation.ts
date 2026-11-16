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
