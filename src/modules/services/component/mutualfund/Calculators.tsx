import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useServicesTheme } from '../../utils/useServicesTheme';
import LinearGradient from 'react-native-linear-gradient';
import { CalculatorScreen } from './CalculatorScreen';
import { SliderRow, ResultCard, SectionHeader } from './UIComponents';
import {
  calculateSIP,
  calculateGoalSIP,
  calculateSmartGoal,
  calculateInflation,
  calculateCostOfDelay,
  calculateLumpsum,
  calculateRetirement,
  calculateStepUpSIP,
  calculateSWP,
  formatCurrency,
} from '../utils/calculations';

// ─── Shared Card ──────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDark } = useServicesTheme();
  return (
    <View style={[cardStyle.card, isDark && cardStyle.cardDark]}>
      {children}
    </View>
  );
};

const cardStyle = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(134,101,255,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#4C2F91',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 4 },
    }),
  },
  cardDark: {
    backgroundColor: '#1C1C26',
    borderColor: 'rgba(255,255,255,0.08)',
  },
});

// ─── Maturity Banner ──────────────────────────────────────────────
const MaturityBanner: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <LinearGradient
    colors={['#3545A3', '#080B26']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={bannerStyle.banner}
  >
    <Text style={bannerStyle.label}>{label}</Text>
    <Text style={bannerStyle.value}>{value}</Text>
  </LinearGradient>
);

const bannerStyle = StyleSheet.create({
  banner: {
    borderRadius: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#5B47A3',
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 6 },
    }),
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    // marginBottom: 4,
    padding: 10,

  },
  value: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
});

// ═══════════════════════════════════════════════════════════════════
// 1. SIP CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const SIPCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const result = useMemo(() => calculateSIP(monthly, rate, years), [monthly, rate, years]);

  return (
    <CalculatorScreen
      title="SIP Calculator"
      subtitle="Estimate future value of your monthly SIP"
      icon="📅"
      navigation={navigation}
    >
      <MaturityBanner label="Estimated Maturity Value" value={formatCurrency(result.maturity)} />
      <Card>
        <SectionHeader title="Parameters" subtitle="Adjust to see projections" />
        <SliderRow label="Monthly Investment" value={monthly} min={500} max={100000} step={500}
          onChange={setMonthly} prefix="₹" />
        <SliderRow label="Expected Annual Return" value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label="Investment Duration" value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title="Breakdown" />
        <ResultCard items={[
          { label: 'Total Invested', value: formatCurrency(result.invested) },
          { label: 'Estimated Returns', value: formatCurrency(result.returns) },
          { label: 'Maturity Value', value: formatCurrency(result.maturity), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 2. GOAL SIP CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const GoalSIPCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [goal, setGoal] = useState(1000000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const result = useMemo(() => calculateGoalSIP(goal, rate, years), [goal, rate, years]);

  return (
    <CalculatorScreen
      title="Goal SIP Calculator"
      subtitle="Monthly investment needed to reach your goal"
      icon="🎯"
      navigation={navigation}
    >
      <MaturityBanner label="Monthly SIP Required" value={formatCurrency(result.monthlyRequired)} />
      <Card>
        <SectionHeader title="Goal Details" />
        <SliderRow label="Target Goal Amount" value={goal} min={10000} max={50000000} step={10000}
          onChange={setGoal} prefix="₹" />
        <SliderRow label="Expected Annual Return" value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label="Time to Achieve Goal" value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title="Summary" />
        <ResultCard items={[
          { label: 'Monthly SIP Required', value: formatCurrency(result.monthlyRequired), highlight: true },
          { label: 'Total Amount Invested', value: formatCurrency(result.invested) },
          { label: 'Wealth Gained', value: formatCurrency(result.returns) },
          { label: 'Target Amount', value: formatCurrency(goal) },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 3. SMART GOAL CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const SmartGoalCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [goal, setGoal] = useState(2000000);
  const [currentSavings, setCurrentSavings] = useState(200000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const result = useMemo(
    () => calculateSmartGoal(goal, currentSavings, rate, years),
    [goal, currentSavings, rate, years],
  );

  return (
    <CalculatorScreen
      title="Smart Goal Calculator"
      subtitle="Plan goals considering existing investments"
      icon="🧠"
      navigation={navigation}
    >
      <MaturityBanner label="Additional Monthly SIP Needed" value={formatCurrency(result.monthlyRequired)} />
      <Card>
        <SectionHeader title="Your Goal" />
        <SliderRow label="Goal Amount" value={goal} min={50000} max={100000000} step={50000}
          onChange={setGoal} prefix="₹" />
        <SliderRow label="Current Savings / Investments" value={currentSavings} min={0} max={5000000} step={10000}
          onChange={setCurrentSavings} prefix="₹" />
        <SliderRow label="Expected Annual Return" value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label="Time Horizon" value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title="Analysis" />
        <ResultCard items={[
          { label: 'Goal Amount', value: formatCurrency(goal) },
          { label: 'Existing Savings Growth', value: formatCurrency(result.existingGrowth) },
          { label: 'Remaining to Fund', value: formatCurrency(result.remaining) },
          { label: 'Monthly SIP Needed', value: formatCurrency(result.monthlyRequired), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 4. INFLATION CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const InflationCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [expense, setExpense] = useState(50000);
  const [inflation, setInflation] = useState(6);
  const [years, setYears] = useState(10);

  const result = useMemo(
    () => calculateInflation(expense, inflation, years),
    [expense, inflation, years],
  );

  return (
    <CalculatorScreen
      title="Inflation Calculator"
      subtitle="Impact of inflation on your expenses"
      icon="📈"
      navigation={navigation}
    >
      <MaturityBanner label="Future Value of Expenses" value={formatCurrency(result.futureValue)} />
      <Card>
        <SectionHeader title="Parameters" />
        <SliderRow label="Current Monthly Expense" value={expense} min={1000} max={500000} step={1000}
          onChange={setExpense} prefix="₹" />
        <SliderRow label="Expected Inflation Rate" value={inflation} min={1} max={20} step={0.5}
          onChange={setInflation} suffix="%" />
        <SliderRow label="Time Period" value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title="Impact Analysis" />
        <ResultCard items={[
          { label: 'Current Monthly Expense', value: formatCurrency(expense) },
          { label: 'Inflation Impact', value: formatCurrency(result.increase) },
          { label: `Expense After ${years} Years`, value: formatCurrency(result.futureValue), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 5. COST OF DELAY CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const CostOfDelayCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(15);
  const [delay, setDelay] = useState(12);

  const result = useMemo(
    () => calculateCostOfDelay(monthly, rate, years, delay),
    [monthly, rate, years, delay],
  );

  return (
    <CalculatorScreen
      title="Cost of Delay"
      subtitle="Impact of delaying your investments"
      icon="⏳"
      navigation={navigation}
    >
      <MaturityBanner label="Wealth Lost Due to Delay" value={formatCurrency(result.loss)} />
      <Card>
        <SectionHeader title="Parameters" />
        <SliderRow label="Monthly Investment" value={monthly} min={500} max={100000} step={500}
          onChange={setMonthly} prefix="₹" />
        <SliderRow label="Expected Annual Return" value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label="Investment Duration" value={years} min={5} max={40} step={1}
          onChange={setYears} suffix=" yr" />
        <SliderRow label="Delay Period" value={delay} min={1} max={60} step={1}
          onChange={setDelay} suffix=" mo" />
      </Card>
      <Card>
        <SectionHeader title="Comparison" />
        <ResultCard items={[
          { label: 'Without Delay', value: formatCurrency(result.withoutDelay) },
          { label: `With ${delay} Month Delay`, value: formatCurrency(result.withDelay) },
          { label: 'Wealth Lost', value: formatCurrency(result.loss), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 6. LUMPSUM CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const LumpsumCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const result = useMemo(
    () => calculateLumpsum(principal, rate, years),
    [principal, rate, years],
  );

  return (
    <CalculatorScreen
      title="Lumpsum Calculator"
      subtitle="Calculate returns on one-time investment"
      icon="💰"
      navigation={navigation}
    >
      <MaturityBanner label="Estimated Maturity Value" value={formatCurrency(result.maturity)} />
      <Card>
        <SectionHeader title="Investment Details" />
        <SliderRow label="One-Time Investment Amount" value={principal} min={1000} max={10000000} step={1000}
          onChange={setPrincipal} prefix="₹" />
        <SliderRow label="Expected Annual Return" value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label="Investment Duration" value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title="Breakdown" />
        <ResultCard items={[
          { label: 'Amount Invested', value: formatCurrency(principal) },
          { label: 'Estimated Returns', value: formatCurrency(result.returns) },
          { label: 'Total Value', value: formatCurrency(result.maturity), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 7. RETIREMENT PLANNING CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const RetirementCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [monthlyExpense, setMonthlyExpense] = useState(50000);
  const [inflationRate, setInflationRate] = useState(6);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [postReturn, setPostReturn] = useState(7);
  const [lifeExpectancy, setLifeExpectancy] = useState(80);

  const result = useMemo(
    () =>
      calculateRetirement(
        currentAge,
        retirementAge,
        monthlyExpense,
        inflationRate,
        expectedReturn,
        postReturn,
        lifeExpectancy,
      ),
    [currentAge, retirementAge, monthlyExpense, inflationRate, expectedReturn, postReturn, lifeExpectancy],
  );

  return (
    <CalculatorScreen
      title="Retirement Planning"
      subtitle="Estimate your retirement corpus"
      icon="🏖️"
      navigation={navigation}
    >
      <MaturityBanner label="Monthly SIP Required" value={formatCurrency(result.monthlyRequired)} />
      <Card>
        <SectionHeader title="Your Details" />
        <SliderRow label="Current Age" value={currentAge} min={18} max={55} step={1}
          onChange={setCurrentAge} suffix=" yr" />
        <SliderRow label="Retirement Age" value={retirementAge} min={40} max={70} step={1}
          onChange={setRetirementAge} suffix=" yr" />
        <SliderRow label="Life Expectancy" value={lifeExpectancy} min={60} max={100} step={1}
          onChange={setLifeExpectancy} suffix=" yr" />
        <SliderRow label="Monthly Expenses (Today)" value={monthlyExpense} min={10000} max={500000} step={5000}
          onChange={setMonthlyExpense} prefix="₹" />
      </Card>
      <Card>
        <SectionHeader title="Return Assumptions" />
        <SliderRow label="Expected Return (Pre-Retirement)" value={expectedReturn} min={1} max={30} step={0.5}
          onChange={setExpectedReturn} suffix="%" />
        <SliderRow label="Return (Post-Retirement)" value={postReturn} min={1} max={15} step={0.5}
          onChange={setPostReturn} suffix="%" />
        <SliderRow label="Inflation Rate" value={inflationRate} min={1} max={15} step={0.5}
          onChange={setInflationRate} suffix="%" />
      </Card>
      <Card>
        <SectionHeader title="Retirement Plan" />
        <ResultCard items={[
          { label: 'Years to Retirement', value: `${retirementAge - currentAge} years` },
          { label: 'Monthly Expense at Retirement', value: formatCurrency(result.inflatedExpense) },
          { label: 'Retirement Duration', value: `${result.retirementYears} years` },
          { label: 'Corpus Required', value: formatCurrency(result.corpusRequired) },
          { label: 'Monthly SIP Required', value: formatCurrency(result.monthlyRequired), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 8. STEP-UP SIP CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const StepUpSIPCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const [stepUp, setStepUp] = useState(10);

  const result = useMemo(
    () => calculateStepUpSIP(monthly, rate, years, stepUp),
    [monthly, rate, years, stepUp],
  );
  const baseline = useMemo(() => calculateSIP(monthly, rate, years), [monthly, rate, years]);

  return (
    <CalculatorScreen
      title="Step-Up SIP Calculator"
      subtitle="Future value with annual SIP increase"
      icon="🚀"
      navigation={navigation}
    >
      <MaturityBanner label="Maturity with Step-Up" value={formatCurrency(result.maturity)} />
      <Card>
        <SectionHeader title="Parameters" />
        <SliderRow label="Initial Monthly SIP" value={monthly} min={500} max={100000} step={500}
          onChange={setMonthly} prefix="₹" />
        <SliderRow label="Annual Step-Up Percentage" value={stepUp} min={1} max={50} step={1}
          onChange={setStepUp} suffix="%" />
        <SliderRow label="Expected Annual Return" value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label="Investment Duration" value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title="Step-Up Advantage" />
        <ResultCard items={[
          { label: 'Total Invested (Step-Up)', value: formatCurrency(result.invested) },
          { label: 'Returns (Step-Up)', value: formatCurrency(result.returns) },
          { label: 'Maturity (Step-Up)', value: formatCurrency(result.maturity), highlight: true },
          { label: 'Without Step-Up', value: formatCurrency(baseline.maturity) },
          { label: 'Extra Wealth Gained', value: formatCurrency(result.maturity - baseline.maturity) },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 9. SWP CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const SWPCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [principal, setPrincipal] = useState(1000000);
  const [withdrawal, setWithdrawal] = useState(10000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(10);

  const result = useMemo(
    () => calculateSWP(principal, withdrawal, rate, years),
    [principal, withdrawal, rate, years],
  );

  return (
    <CalculatorScreen
      title="SWP Calculator"
      subtitle="Systematic Withdrawal Plan projections"
      icon="💸"
      navigation={navigation}
    >
      <MaturityBanner label="Remaining Balance" value={formatCurrency(result.finalBalance)} />
      <Card>
        <SectionHeader title="Parameters" />
        <SliderRow label="Total Investment" value={principal} min={10000} max={50000000} step={10000}
          onChange={setPrincipal} prefix="₹" />
        <SliderRow label="Monthly Withdrawal" value={withdrawal} min={1000} max={500000} step={1000}
          onChange={setWithdrawal} prefix="₹" />
        <SliderRow label="Expected Annual Return" value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label="Withdrawal Duration" value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title="Withdrawal Plan" />
        <ResultCard items={[
          { label: 'Total Invested', value: formatCurrency(principal) },
          { label: 'Total Withdrawn', value: formatCurrency(result.totalWithdrawn) },
          { label: `Balance After ${years} Years`, value: formatCurrency(result.finalBalance), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};