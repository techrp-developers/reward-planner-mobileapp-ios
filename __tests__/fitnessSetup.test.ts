// Pure setup-routing and measurement rules for RP Move. Native / auth
// modules are stubbed; only the decision functions are exercised.
jest.mock('react-native-health-connect', () => ({ SdkAvailabilityStatus: { SDK_AVAILABLE: 3 } }));
jest.mock('../src/modules/step_counter/component/StepCode/useStepTracker', () => ({ useStepTracker: jest.fn() }));
jest.mock('../src/modules/step_counter/context/StepTrackerContext', () => ({ hasStepsPerm: jest.fn() }));
jest.mock('../src/modules/common/auth/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../src/modules/step_counter/api/ProfileAPI', () => ({ fetchProfilePlan: jest.fn() }));
jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (k: string) => k } }));

import { entryRouteFor, routeForStage, stageOf } from '../src/modules/step_counter/utils/fitnessSetup';
import { bmiFrom, HEIGHT_OPTIONS, nearestOption } from '../src/modules/step_counter/utils/measurements';
import type { ProfilePlanResponse } from '../src/modules/step_counter/api/ProfileAPI';

const plan = (over: Partial<ProfilePlanResponse> = {}): ProfilePlanResponse => ({
  bmi: '21.40',
  category: 'normal',
  recommended_steps: 7000,
  recommended_minutes: 45,
  goal: 'Stay Healthy',
  daily_reward_coins: 5,
  weekly_plan: [{ week: 1, steps: 5000 }],
  current_goal: { daily_steps: 5000, start_date: '2026-11-01' },
  ...over,
});

describe('RP Move setup stage', () => {
  it('sends a brand-new user to the welcome screen', () => {
    const stage = stageOf(null, false);
    expect(stage).toBe('health');
    expect(entryRouteFor(stage, null)).toEqual({ name: 'StepWelcome' });
  });

  it('asks a returning user on a new phone only to reconnect health', () => {
    const p = plan();
    const stage = stageOf(p, false);
    expect(stage).toBe('health');
    expect(entryRouteFor(stage, p)).toEqual({ name: 'StepsTrackerScreen' });
  });

  it('goes to StepForm when health is ready but no profile exists', () => {
    expect(routeForStage(stageOf(null, true))).toEqual({ name: 'StepForm' });
  });

  it('resumes on measurements when basic details are saved but BMI is not', () => {
    expect(stageOf(plan({ bmi: null, current_goal: null }), true)).toBe('body');
    expect(routeForStage('body')).toEqual({ name: 'StepForm', params: { startAt: 'body' } });
  });

  it('opens the plan/goal step when the goal is missing', () => {
    expect(routeForStage(stageOf(plan({ current_goal: null }), true))).toEqual({ name: 'BMICart' });
  });

  it('opens the Dashboard when everything is ready', () => {
    const p = plan();
    expect(stageOf(p, true)).toBe('ready');
    expect(entryRouteFor('ready', p)).toEqual({ name: 'Dashboard' });
  });
});

describe('RP Move measurements', () => {
  it("labels heights in feet and inches with correct centimetres", () => {
    const fiveEight = HEIGHT_OPTIONS.find(o => o.label === `5' 8"`);
    expect(fiveEight?.value).toBe(173); // 68 in × 2.54, not 5.8 ft × 30.48
  });

  it('computes BMI like the server', () => {
    expect(bmiFrom(173, 55)).toBeCloseTo(18.38, 2);
    expect(bmiFrom(0, 55)).toBe(0);
  });

  it('preselects the closest height for a saved value', () => {
    expect(nearestOption(HEIGHT_OPTIONS, 170)?.label).toBe(`5' 7"`);
    expect(nearestOption(HEIGHT_OPTIONS, null)).toBeNull();
  });
});
