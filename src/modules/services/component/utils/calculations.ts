export function calculateSIP(monthly: number, rate: number, years: number) {
  const n = years * 12;
  const r = rate / 12 / 100;
  const maturity =
    r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = monthly * n;
  return { maturity, invested, returns: maturity - invested };
}

export function calculateGoalSIP(goal: number, rate: number, years: number) {
  const n = years * 12;
  const r = rate / 12 / 100;
  const monthlyRequired =
    r === 0 ? goal / n : (goal * r) / ((Math.pow(1 + r, n) - 1) * (1 + r));
  const invested = monthlyRequired * n;
  return { monthlyRequired, invested, returns: goal - invested };
}

export function calculateSmartGoal(
  goal: number,
  savings: number,
  rate: number,
  years: number,
) {
  const existingGrowth = savings * Math.pow(1 + rate / 100, years);
  const remaining = Math.max(0, goal - existingGrowth);
  const n = years * 12;
  const r = rate / 12 / 100;
  const monthlyRequired =
    remaining <= 0
      ? 0
      : r === 0
      ? remaining / n
      : (remaining * r) / ((Math.pow(1 + r, n) - 1) * (1 + r));
  return { existingGrowth, remaining, monthlyRequired };
}

export function calculateInflation(
  expense: number,
  inflation: number,
  years: number,
) {
  const futureValue = expense * Math.pow(1 + inflation / 100, years);
  return { futureValue, increase: futureValue - expense };
}

export function calculateCostOfDelay(
  monthly: number,
  rate: number,
  years: number,
  delayMonths: number,
) {
  const without = calculateSIP(monthly, rate, years);
  const withDelay = calculateSIP(monthly, rate, years - delayMonths / 12);
  return {
    withoutDelay: without.maturity,
    withDelay: withDelay.maturity,
    loss: without.maturity - withDelay.maturity,
  };
}

export function calculateLumpsum(
  principal: number,
  rate: number,
  years: number,
) {
  const maturity = principal * Math.pow(1 + rate / 100, years);
  return { maturity, returns: maturity - principal };
}

export function calculateRetirement(
  currentAge: number,
  retirementAge: number,
  monthlyExpense: number,
  inflationRate: number,
  expectedReturn: number,
  postReturn: number,
  lifeExpectancy: number,
) {
  const yearsToRetire = retirementAge - currentAge;
  const retirementYears = lifeExpectancy - retirementAge;
  const inflatedExpense =
    monthlyExpense * Math.pow(1 + inflationRate / 100, yearsToRetire);
  const annualExpense = inflatedExpense * 12;
  const r = postReturn / 100;
  const corpusRequired =
    annualExpense * (1 - Math.pow(1 + r, -retirementYears)) / r;
  const n = yearsToRetire * 12;
  const mr = expectedReturn / 12 / 100;
  const monthlyRequired =
    mr === 0
      ? corpusRequired / n
      : (corpusRequired * mr) / ((Math.pow(1 + mr, n) - 1) * (1 + mr));
  return { inflatedExpense, corpusRequired, monthlyRequired, retirementYears };
}

export function calculateStepUpSIP(
  monthly: number,
  rate: number,
  years: number,
  stepUp: number,
) {
  let total = 0;
  let invested = 0;
  let currentMonthly = monthly;
  const mr = rate / 12 / 100;
  for (let y = 0; y < years; y++) {
    for (let m = 0; m < 12; m++) {
      total = total * (1 + mr) + currentMonthly;
      invested += currentMonthly;
    }
    currentMonthly *= 1 + stepUp / 100;
  }
  return { maturity: total, invested, returns: total - invested };
}

export function calculateSWP(
  principal: number,
  withdrawal: number,
  rate: number,
  years: number,
) {
  const n = years * 12;
  const mr = rate / 12 / 100;
  let balance = principal;
  let totalWithdrawn = 0;
  for (let i = 0; i < n; i++) {
    balance = balance * (1 + mr) - withdrawal;
    totalWithdrawn += withdrawal;
    if (balance <= 0) {
      balance = 0;
      break;
    }
  }
  return { finalBalance: balance, totalWithdrawn };
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
