// First cohort. Price sits in the middle of the 390k–790k UZS range from BUSINESS_STRATEGY.md:
// under 50 USD, payable in two parts. The start date avoids the New Year break and leaves December for applications.
// Change these values to reprice or reschedule; /kurs and the landing page read them.
export const COHORT = {
  priceUzs: 590_000,
  installmentUzs: 295_000,
  startDate: '2027-yil 11-yanvar, dushanba',
  applyBy: '6-yanvargacha',
  seats: 15
};

export const formatUzs = (value: number) => value.toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
