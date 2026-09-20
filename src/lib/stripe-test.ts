export type CardBrand = "visa" | "mastercard" | "amex";

export type CardValue = {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
};

type TokenRow = {
  brand: CardBrand;
  last4: string;
  outcome: "succeed" | "declined" | "insufficient_funds" | "expired" | "cvc";
};

const TOKENS: Record<string, TokenRow> = {
  tok_visa: { brand: "visa", last4: "4242", outcome: "succeed" },
  tok_mastercard: { brand: "mastercard", last4: "4444", outcome: "succeed" },
  tok_amex: { brand: "amex", last4: "0005", outcome: "succeed" },
  tok_link: { brand: "visa", last4: "4242", outcome: "succeed" },
  tok_charge_declined: { brand: "visa", last4: "0002", outcome: "declined" },
  tok_insufficient_funds: { brand: "visa", last4: "9995", outcome: "insufficient_funds" },
  tok_expired: { brand: "visa", last4: "0069", outcome: "expired" },
  tok_cvc: { brand: "visa", last4: "0127", outcome: "cvc" },
};

const PAN_TO_TOKEN: Record<string, string> = {
  "4242424242424242": "tok_visa",
  "5555555555554444": "tok_mastercard",
  "378282246310005": "tok_amex",
  "4000000000000002": "tok_charge_declined",
  "4000000000009995": "tok_insufficient_funds",
  "4000000000000069": "tok_expired",
  "4000000000000127": "tok_cvc",
};

const OUTCOME_MESSAGE: Record<Exclude<TokenRow["outcome"], "succeed">, string> = {
  declined: "Your card was declined.",
  insufficient_funds: "Your card has insufficient funds.",
  expired: "Your card has expired.",
  cvc: "Your card’s security code is incorrect.",
};

export const TEST_CARD = {
  number: "4242424242424242",
  display: "4242 4242 4242 4242",
  expMonth: "12",
  expYear: "34",
  cvc: "123",
  zip: "98901",
  email: "buyer@pnwcardhub.test",
} as const;

export function brandLabel(brand: string) {
  if (brand === "mastercard") return "Mastercard";
  if (brand === "amex") return "American Express";
  if (brand === "visa") return "Visa";
  if (brand === "link") return "Link";
  if (brand === "card") return "Card";
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function detectBrand(digits: string): CardBrand | "unknown" {
  if (/^3[47]/.test(digits)) return "amex";
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard";
  return "unknown";
}

function luhn(digits: string) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  if (detectBrand(digits) === "amex") {
    const compact = digits.slice(0, 15);
    return [compact.slice(0, 4), compact.slice(4, 10), compact.slice(10)].filter(Boolean).join(" ");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export function parseExpiry(display: string): { month: string; year: string } {
  let digits = display.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 1 && Number(digits) > 1) digits = `0${digits}`;
  return { month: digits.slice(0, 2), year: digits.slice(2, 4) };
}

export function cardComplete(value: CardValue) {
  const digits = value.number.replace(/\D/g, "");
  const brand = detectBrand(digits);
  const want = brand === "amex" ? 15 : 16;
  const cvcWant = brand === "amex" ? 4 : 3;
  return (
    digits.length === want &&
    value.expMonth.length === 2 &&
    value.expYear.length === 2 &&
    value.cvc.replace(/\D/g, "").length === cvcWant
  );
}

export function tokenizeCard(
  value: CardValue,
): { ok: true; token: string; brand: CardBrand; last4: string } | { ok: false; error: string } {
  const digits = value.number.replace(/\D/g, "");
  const brand = detectBrand(digits);
  const want = brand === "amex" ? 15 : 16;
  if (brand === "unknown" || digits.length < want) {
    return { ok: false, error: "Your card number is incomplete." };
  }
  if (!luhn(digits)) {
    return { ok: false, error: "Your card number is invalid." };
  }
  const month = Number(value.expMonth);
  const year = 2000 + Number(value.expYear);
  if (!Number.isFinite(month) || month < 1 || month > 12 || value.expYear.length !== 2) {
    return { ok: false, error: "Your card’s expiration date is incomplete." };
  }
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    return { ok: false, error: "Your card has expired." };
  }
  const cvcWant = brand === "amex" ? 4 : 3;
  if (value.cvc.replace(/\D/g, "").length !== cvcWant) {
    return { ok: false, error: "Your card’s security code is incomplete." };
  }
  const token = PAN_TO_TOKEN[digits];
  if (!token) {
    return {
      ok: false,
      error: "This shop is in Stripe test mode. Use card 4242 4242 4242 4242.",
    };
  }
  const row = TOKENS[token];
  return { ok: true, token, brand: row.brand, last4: row.last4 };
}

export function chargeTestToken(token: string): { brand: CardBrand; last4: string } {
  const row = TOKENS[token];
  if (!row) {
    throw new Error("This shop is in Stripe test mode. Use card 4242 4242 4242 4242.");
  }
  if (row.outcome !== "succeed") {
    throw new Error(OUTCOME_MESSAGE[row.outcome]);
  }
  return { brand: row.brand, last4: row.last4 };
}
