const TRUST_KEY = "pnw-desk-trusted";
const EMAIL_KEY = "pnw-desk-email";
const PIN_KEY = "pnw-desk-pin-ok";

function read(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked */
  }
}

export function isDeskTrusted() {
  return read(TRUST_KEY) === "1";
}

export function rememberedDeskEmail() {
  return read(EMAIL_KEY) ?? "";
}

export function rememberDeskDevice(email: string) {
  write(TRUST_KEY, "1");
  write(EMAIL_KEY, email.trim().toLowerCase());
  write(PIN_KEY, "1");
}

export function pinUnlocked() {
  if (isDeskTrusted()) return true;
  if (read(PIN_KEY) === "1") return true;
  try {
    return window.sessionStorage.getItem(PIN_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberPinUnlock() {
  write(PIN_KEY, "1");
  try {
    window.sessionStorage.setItem(PIN_KEY, "1");
  } catch {
    /* storage blocked */
  }
}
