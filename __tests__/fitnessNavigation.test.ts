import { StackRouter } from '@react-navigation/routers';
import { fitnessTabAction, goBackInFitness } from '../src/modules/step_counter/utils/fitnessNavigation';
import type { FitnessTab } from '../src/modules/step_counter/component/fitness/FitnessTabBar';

const tabs: FitnessTab[] = ['Dashboard', 'AchievementCard', 'CoinHistory', 'MyPlan'];
const router = StackRouter({ initialRouteName: 'Dashboard' });
const options = { routeNames: tabs, routeParamList: {}, routeGetIdList: {} };

it('opens every tab from every other tab without building duplicate history', () => {
  for (const from of tabs) {
    for (const to of tabs) {
      let state = router.getInitialState(options);
      const first = fitnessTabAction(state, from);
      if (first) state = router.getStateForAction(state, first, options)!;
      const action = fitnessTabAction(state, to);
      if (action) {
        expect(action.target).toBe(state.key);
        expect(action.source).toBe(state.routes[state.index].key);
        state = router.getStateForAction(state, action, options)!;
      }
      expect(state.routes[state.index].name).toBe(to);
      expect(state.routes.length).toBeLessThanOrEqual(2);
    }
  }
});

it('returns from tab screens to Dashboard', () => {
  let state = router.getInitialState(options);
  for (const tab of ['MyPlan', 'CoinHistory', 'AchievementCard'] as FitnessTab[]) {
    state = router.getStateForAction(state, fitnessTabAction(state, tab)!, options)!;
  }
  expect(state.routes.map(route => route.name)).toEqual(['Dashboard', 'AchievementCard']);
});

it('uses history when present and a safe destination otherwise', () => {
  const nav = { canGoBack: jest.fn(() => true), goBack: jest.fn(), dispatch: jest.fn() };
  goBackInFitness(nav);
  expect(nav.goBack).toHaveBeenCalledTimes(1);
  expect(nav.dispatch).not.toHaveBeenCalled();
  nav.canGoBack.mockReturnValue(false);
  goBackInFitness(nav);
  expect(nav.dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ payload: { name: 'Dashboard' } }));
  goBackInFitness(nav, 'StepWelcome');
  expect(nav.dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ payload: { name: 'StepWelcome' } }));
});
