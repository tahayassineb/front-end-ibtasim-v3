export function validatePhoneByCountry(phone, countryCode) {
  const cleaned = phone.replace(/\D/g, "");

  switch (countryCode) {
    case "MA":
    case "+212":
      if (cleaned.length === 9) return /^[567]\d{8}$/.test(cleaned);
      if (cleaned.length === 10) return /^0[567]\d{8}$/.test(cleaned);
      return false;
    case "FR":
    case "+33":
      return cleaned.length === 9 && /^[1-9]\d{8}$/.test(cleaned);
    case "ES":
    case "+34":
      return cleaned.length === 9 && /^[67]\d{8}$/.test(cleaned);
    case "US":
    case "CA":
    case "+1":
      return cleaned.length === 10;
    case "GB":
    case "+44":
      return cleaned.length >= 10 && cleaned.length <= 11;
    case "AE":
    case "+971":
    case "SA":
    case "+966":
      return cleaned.length === 9 && /^5\d{8}$/.test(cleaned);
    default:
      return cleaned.length >= 8 && cleaned.length <= 15;
  }
}

export function formatPhoneForDisplay(phone, countryCode) {
  const cleaned = phone.replace(/\D/g, "");

  if (countryCode === "MA" || countryCode === "+212") {
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  return cleaned.replace(/(\d{3})(?=(\d)+$)/g, "$1 ").trim();
}
