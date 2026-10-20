/**
 * Standard amortising-loan maths for the payment estimate.
 * monthly = P·r / (1 − (1 + r)^−n), with r the monthly rate and n the number of monthly payments.
 */
export interface MortgageEstimate {
  loan: number;
  monthly: number;
  totalInterest: number;
}

export function estimateMortgage(price: number, downPaymentPercent: number, years: number, annualRatePercent: number): MortgageEstimate {
  const down = Math.min(Math.max(downPaymentPercent, 0), 100) / 100;
  const loan = Math.max(price * (1 - down), 0);
  const n = Math.max(Math.round(years * 12), 1);
  const r = Math.max(annualRatePercent, 0) / 100 / 12;
  const monthly = loan === 0 ? 0 : r === 0 ? loan / n : (loan * r) / (1 - (1 + r) ** -n);
  return { loan, monthly, totalInterest: monthly * n - loan };
}
