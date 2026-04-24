export const isCardPayment = (paymentMethod) => paymentMethod === 'card_whop';

export const requiresReceipt = (paymentMethod) => !isCardPayment(paymentMethod);

const HIDDEN_LEGACY_DONATION_IDS = new Set([
  'jd74n4qa148j6tpv0wyn9a7cfs85cyat',
]);

export const getPaymentMethodLabel = (paymentMethod) => {
  switch (paymentMethod) {
    case 'card_whop':
      return 'بطاقة';
    case 'bank_transfer':
      return 'تحويل بنكي';
    case 'cash_agency':
      return 'وكالة نقدية';
    default:
      return paymentMethod || '—';
  }
};

export const isHiddenLegacyDonation = (donation) => {
  const donationId = donation?._id || donation?.id || donation?.donationId;
  return donationId ? HIDDEN_LEGACY_DONATION_IDS.has(String(donationId)) : false;
};

const parseLocalDate = (dateValue, endOfDay = false) => {
  if (!dateValue) return undefined;
  const [year, month, day] = String(dateValue).split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999).getTime()
    : new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
};

export const getInclusiveDateRange = ({ startDate, endDate } = {}) => ({
  startDate: parseLocalDate(startDate, false),
  endDate: parseLocalDate(endDate, true),
});

export const matchesInclusiveDateRange = (timestamp, range) => {
  if (!timestamp) return false;
  if (range?.startDate != null && timestamp < range.startDate) return false;
  if (range?.endDate != null && timestamp > range.endDate) return false;
  return true;
};

const firstText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

export const getDonationReference = (donation) => {
  const paymentReference = firstText(
    donation?.whopPaymentId,
    donation?.providerPaymentId,
    donation?.paymentId
  );
  if (paymentReference) {
    return {
      label: 'مرجع الدفع',
      shortLabel: 'الدفع',
      value: paymentReference,
      type: 'payment',
    };
  }

  const transactionReference = firstText(
    donation?.transactionReference,
    donation?.paymentReference,
    donation?.referenceNumber
  );
  if (transactionReference) {
    return {
      label: 'رقم المرجع',
      shortLabel: 'المرجع',
      value: transactionReference,
      type: 'transaction',
    };
  }

  const donationId = donation?._id || donation?.id || donation?.donationId;
  return {
    label: 'معرف التبرع',
    shortLabel: 'التبرع',
    value: donationId ? String(donationId) : '—',
    type: 'donation',
  };
};
