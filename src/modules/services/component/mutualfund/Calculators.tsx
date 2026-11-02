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
import { useTranslation } from "react-i18next";

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
  const { t: tx } = useTranslation();
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const result = useMemo(() => calculateSIP(monthly, rate, years), [monthly, rate, years]);

  return (
    <CalculatorScreen
      title={tx("services:calculators.sipCalculator")}
      subtitle={tx("services:calculators.estimateFutureValueOfYour")}
      icon="📅"
      navigation={navigation}
    >
      <MaturityBanner label={tx("services:calculators.estimatedMaturityValue")} value={formatCurrency(result.maturity)} />
      <Card>
        <SectionHeader title={tx("services:calculators.parameters")} subtitle={tx("services:calculators.adjustToSeeProjections")} />
        <SliderRow label={tx("services:calculators.monthlyInvestment")} value={monthly} min={500} max={100000} step={500}
          onChange={setMonthly} prefix="₹" />
        <SliderRow label={tx("services:calculators.expectedAnnualReturn")} value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label={tx("services:calculators.investmentDuration")} value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title={tx("services:calculators.breakdown")} />
        <ResultCard items={[
          { label: tx('services:calcResults.totalInvested'), value: formatCurrency(result.invested) },
          { label: tx('services:calcResults.estimatedReturns'), value: formatCurrency(result.returns) },
          { label: tx('services:calcResults.maturityValue'), value: formatCurrency(result.maturity), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 2. GOAL SIP CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const GoalSIPCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t: tx } = useTranslation();
  const [goal, setGoal] = useState(1000000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const result = useMemo(() => calculateGoalSIP(goal, rate, years), [goal, rate, years]);

  return (
    <CalculatorScreen
      title={tx("services:calculators.goalSipCalculator")}
      subtitle={tx("services:calculators.monthlyInvestmentNeededToReach")}
      icon="🎯"
      navigation={navigation}
    >
      <MaturityBanner label={tx("services:calculators.monthlySipRequired")} value={formatCurrency(result.monthlyRequired)} />
      <Card>
        <SectionHeader title={tx("services:calculators.goalDetails")} />
        <SliderRow label={tx("services:calculators.targetGoalAmount")} value={goal} min={10000} max={50000000} step={10000}
          onChange={setGoal} prefix="₹" />
        <SliderRow label={tx("services:calculators.expectedAnnualReturn")} value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label={tx("services:calculators.timeToAchieveGoal")} value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title={tx("services:calculators.summary")} />
        <ResultCard items={[
          { label: tx('services:calcResults.monthlySipRequired'), value: formatCurrency(result.monthlyRequired), highlight: true },
          { label: tx('services:calcResults.totalAmountInvested'), value: formatCurrency(result.invested) },
          { label: tx('services:calcResults.wealthGained'), value: formatCurrency(result.returns) },
          { label: tx('services:calcResults.targetAmount'), value: formatCurrency(goal) },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 3. SMART GOAL CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const SmartGoalCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t: tx } = useTranslation();
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
      title={tx("services:calculators.smartGoalCalculator")}
      subtitle={tx("services:calculators.planGoalsConsideringExistingInvestments")}
      icon="🧠"
      navigation={navigation}
    >
      <MaturityBanner label={tx("services:calculators.additionalMonthlySipNeeded")} value={formatCurrency(result.monthlyRequired)} />
      <Card>
        <SectionHeader title={tx("services:calculators.yourGoal")} />
        <SliderRow label={tx("services:calculators.goalAmount")} value={goal} min={50000} max={100000000} step={50000}
          onChange={setGoal} prefix="₹" />
        <SliderRow label={tx("services:calculators.currentSavingsInvestments")} value={currentSavings} min={0} max={5000000} step={10000}
          onChange={setCurrentSavings} prefix="₹" />
        <SliderRow label={tx("services:calculators.expectedAnnualReturn")} value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label={tx("services:calculators.timeHorizon")} value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title={tx("services:calculators.analysis")} />
        <ResultCard items={[
          { label: tx('services:calcResults.goalAmount'), value: formatCurrency(goal) },
          { label: tx('services:calcResults.existingSavingsGrowth'), value: formatCurrency(result.existingGrowth) },
          { label: tx('services:calcResults.remainingToFund'), value: formatCurrency(result.remaining) },
          { label: tx('services:calcResults.monthlySipNeeded'), value: formatCurrency(result.monthlyRequired), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 4. INFLATION CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const InflationCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t: tx } = useTranslation();
  const [expense, setExpense] = useState(50000);
  const [inflation, setInflation] = useState(6);
  const [years, setYears] = useState(10);

  const result = useMemo(
    () => calculateInflation(expense, inflation, years),
    [expense, inflation, years],
  );

  return (
    <CalculatorScreen
      title={tx("services:calculators.inflationCalculator")}
      subtitle={tx("services:calculators.impactOfInflationOnYour")}
      icon="📈"
      navigation={navigation}
    >
      <MaturityBanner label={tx("services:calculators.futureValueOfExpenses")} value={formatCurrency(result.futureValue)} />
      <Card>
        <SectionHeader title={tx("services:calculators.parameters")} />
        <SliderRow label={tx("services:calculators.currentMonthlyExpense")} value={expense} min={1000} max={500000} step={1000}
          onChange={setExpense} prefix="₹" />
        <SliderRow label={tx("services:calculators.expectedInflationRate")} value={inflation} min={1} max={20} step={0.5}
          onChange={setInflation} suffix="%" />
        <SliderRow label={tx("services:calculators.timePeriod")} value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title={tx("services:calculators.impactAnalysis")} />
        <ResultCard items={[
          { label: tx('services:calcResults.currentMonthlyExpense'), value: formatCurrency(expense) },
          { label: tx('services:calcResults.inflationImpact'), value: formatCurrency(result.increase) },
          { label: tx('services:calcResults.expenseAfterYears', { years }), value: formatCurrency(result.futureValue), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 5. COST OF DELAY CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const CostOfDelayCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t: tx } = useTranslation();
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
      title={tx("services:calculators.costOfDelay")}
      subtitle={tx("services:calculators.impactOfDelayingYourInvestments")}
      icon="⏳"
      navigation={navigation}
    >
      <MaturityBanner label={tx("services:calculators.wealthLostDueToDelay")} value={formatCurrency(result.loss)} />
      <Card>
        <SectionHeader title={tx("services:calculators.parameters")} />
        <SliderRow label={tx("services:calculators.monthlyInvestment")} value={monthly} min={500} max={100000} step={500}
          onChange={setMonthly} prefix="₹" />
        <SliderRow label={tx("services:calculators.expectedAnnualReturn")} value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label={tx("services:calculators.investmentDuration")} value={years} min={5} max={40} step={1}
          onChange={setYears} suffix=" yr" />
        <SliderRow label={tx("services:calculators.delayPeriod")} value={delay} min={1} max={60} step={1}
          onChange={setDelay} suffix=" mo" />
      </Card>
      <Card>
        <SectionHeader title={tx("services:calculators.comparison")} />
        <ResultCard items={[
          { label: tx('services:calcResults.withoutDelay'), value: formatCurrency(result.withoutDelay) },
          { label: tx('services:calcResults.withMonthDelay', { months: delay }), value: formatCurrency(result.withDelay) },
          { label: tx('services:calcResults.wealthLost'), value: formatCurrency(result.loss), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 6. LUMPSUM CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const LumpsumCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t: tx } = useTranslation();
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const result = useMemo(
    () => calculateLumpsum(principal, rate, years),
    [principal, rate, years],
  );

  return (
    <CalculatorScreen
      title={tx("services:calculators.lumpsumCalculator")}
      subtitle={tx("services:calculators.calculateReturnsOnOneTime")}
      icon="💰"
      navigation={navigation}
    >
      <MaturityBanner label={tx("services:calculators.estimatedMaturityValue")} value={formatCurrency(result.maturity)} />
      <Card>
        <SectionHeader title={tx("services:calculators.investmentDetails")} />
        <SliderRow label={tx("services:calculators.oneTimeInvestmentAmount")} value={principal} min={1000} max={10000000} step={1000}
          onChange={setPrincipal} prefix="₹" />
        <SliderRow label={tx("services:calculators.expectedAnnualReturn")} value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label={tx("services:calculators.investmentDuration")} value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title={tx("services:calculators.breakdown")} />
        <ResultCard items={[
          { label: tx('services:calcResults.amountInvested'), value: formatCurrency(principal) },
          { label: tx('services:calcResults.estimatedReturns'), value: formatCurrency(result.returns) },
          { label: tx('services:calcResults.totalValue'), value: formatCurrency(result.maturity), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 7. RETIREMENT PLANNING CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const RetirementCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t: tx } = useTranslation();
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
      title={tx("services:calculators.retirementPlanning")}
      subtitle={tx("services:calculators.estimateYourRetirementCorpus")}
      icon="🏖️"
      navigation={navigation}
    >
      <MaturityBanner label={tx("services:calculators.monthlySipRequired")} value={formatCurrency(result.monthlyRequired)} />
      <Card>
        <SectionHeader title={tx("services:calculators.yourDetails")} />
        <SliderRow label={tx("services:calculators.currentAge")} value={currentAge} min={18} max={55} step={1}
          onChange={setCurrentAge} suffix=" yr" />
        <SliderRow label={tx("services:calculators.retirementAge")} value={retirementAge} min={40} max={70} step={1}
          onChange={setRetirementAge} suffix=" yr" />
        <SliderRow label={tx("services:calculators.lifeExpectancy")} value={lifeExpectancy} min={60} max={100} step={1}
          onChange={setLifeExpectancy} suffix=" yr" />
        <SliderRow label={tx("services:calculators.monthlyExpensesToday")} value={monthlyExpense} min={10000} max={500000} step={5000}
          onChange={setMonthlyExpense} prefix="₹" />
      </Card>
      <Card>
        <SectionHeader title={tx("services:calculators.returnAssumptions")} />
        <SliderRow label={tx("services:calculators.expectedReturnPreRetirement")} value={expectedReturn} min={1} max={30} step={0.5}
          onChange={setExpectedReturn} suffix="%" />
        <SliderRow label={tx("services:calculators.returnPostRetirement")} value={postReturn} min={1} max={15} step={0.5}
          onChange={setPostReturn} suffix="%" />
        <SliderRow label={tx("services:calculators.inflationRate")} value={inflationRate} min={1} max={15} step={0.5}
          onChange={setInflationRate} suffix="%" />
      </Card>
      <Card>
        <SectionHeader title={tx("services:calculators.retirementPlan")} />
        <ResultCard items={[
          { label: tx('services:calcResults.yearsToRetirement'), value: `${retirementAge - currentAge} years` },
          { label: tx('services:calcResults.monthlyExpenseAtRetirement'), value: formatCurrency(result.inflatedExpense) },
          { label: tx('services:calcResults.retirementDuration'), value: `${result.retirementYears} years` },
          { label: tx('services:calcResults.corpusRequired'), value: formatCurrency(result.corpusRequired) },
          { label: tx('services:calcResults.monthlySipRequired'), value: formatCurrency(result.monthlyRequired), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 8. STEP-UP SIP CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const StepUpSIPCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t: tx } = useTranslation();
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
      title={tx("services:calculators.stepUpSipCalculator")}
      subtitle={tx("services:calculators.futureValueWithAnnualSip")}
      icon="🚀"
      navigation={navigation}
    >
      <MaturityBanner label={tx("services:calculators.maturityWithStepUp")} value={formatCurrency(result.maturity)} />
      <Card>
        <SectionHeader title={tx("services:calculators.parameters")} />
        <SliderRow label={tx("services:calculators.initialMonthlySip")} value={monthly} min={500} max={100000} step={500}
          onChange={setMonthly} prefix="₹" />
        <SliderRow label={tx("services:calculators.annualStepUpPercentage")} value={stepUp} min={1} max={50} step={1}
          onChange={setStepUp} suffix="%" />
        <SliderRow label={tx("services:calculators.expectedAnnualReturn")} value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label={tx("services:calculators.investmentDuration")} value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title={tx("services:calculators.stepUpAdvantage")} />
        <ResultCard items={[
          { label: tx('services:calcResults.totalInvestedStepUp'), value: formatCurrency(result.invested) },
          { label: tx('services:calcResults.returnsStepUp'), value: formatCurrency(result.returns) },
          { label: tx('services:calcResults.maturityStepUp'), value: formatCurrency(result.maturity), highlight: true },
          { label: tx('services:calcResults.withoutStepUp'), value: formatCurrency(baseline.maturity) },
          { label: tx('services:calcResults.extraWealthGained'), value: formatCurrency(result.maturity - baseline.maturity) },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 9. SWP CALCULATOR
// ═══════════════════════════════════════════════════════════════════
export const SWPCalculator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t: tx } = useTranslation();
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
      title={tx("services:calculators.swpCalculator")}
      subtitle={tx("services:calculators.systematicWithdrawalPlanProjections")}
      icon="💸"
      navigation={navigation}
    >
      <MaturityBanner label={tx("services:calculators.remainingBalance")} value={formatCurrency(result.finalBalance)} />
      <Card>
        <SectionHeader title={tx("services:calculators.parameters")} />
        <SliderRow label={tx("services:calculators.totalInvestment")} value={principal} min={10000} max={50000000} step={10000}
          onChange={setPrincipal} prefix="₹" />
        <SliderRow label={tx("services:calculators.monthlyWithdrawal")} value={withdrawal} min={1000} max={500000} step={1000}
          onChange={setWithdrawal} prefix="₹" />
        <SliderRow label={tx("services:calculators.expectedAnnualReturn")} value={rate} min={1} max={30} step={0.5}
          onChange={setRate} suffix="%" />
        <SliderRow label={tx("services:calculators.withdrawalDuration")} value={years} min={1} max={40} step={1}
          onChange={setYears} suffix=" yr" />
      </Card>
      <Card>
        <SectionHeader title={tx("services:calculators.withdrawalPlan")} />
        <ResultCard items={[
          { label: tx('services:calcResults.totalInvested'), value: formatCurrency(principal) },
          { label: tx('services:calcResults.totalWithdrawn'), value: formatCurrency(result.totalWithdrawn) },
          { label: tx('services:calcResults.balanceAfterYears', { years }), value: formatCurrency(result.finalBalance), highlight: true },
        ]} />
      </Card>
    </CalculatorScreen>
  );
};