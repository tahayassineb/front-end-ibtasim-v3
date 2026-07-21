export const defaultFormData = {
  accountHolder: "جمعية ابتسم",
  rib: "",
  bankName: "Attijariwafa Bank",
  agency: "",
  associationPhone: "",
  organizationName: "جمعية ابتسم",
  email: "contact@ibtasam.org",
  phone: "+212 5XX-XXXXXX",
  address: "الدار البيضاء، المغرب",
  description: "جمعية خيرية تعمل على رعاية الأيتام",
  newDonation: true,
  donationVerified: true,
  weeklyReports: false,
  monthlyReports: true,
};

export const defaultWhatsAppSession = {
  isConnected: false,
  phoneNumber: "",
  instanceId: null,
  qrCode: null,
  lastConnected: null,
  messagesSent: 0,
  messagesReceived: 0,
  isLoading: false,
};

export function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizeWhatsAppPhoneNumber(phoneNumber) {
  let normalized = (phoneNumber || "").replace(/[\s().-]/g, "");
  if (/^0[67]\d{8}$/.test(normalized)) normalized = `+212${normalized.slice(1)}`;
  else if (/^\d+$/.test(normalized)) normalized = `+${normalized}`;
  return normalized;
}
