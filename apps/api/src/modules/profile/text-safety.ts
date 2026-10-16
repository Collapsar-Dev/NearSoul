/** Anti-scam text checks for names and bios (PROF-001, SAFE-003). */
const URL_RE = /(https?:\/\/|www\.)|\b[a-z0-9-]+\.(com|net|org|io|me|ru|app|link|ly|co|xyz|info)\b/i;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const HANDLE_RE = /(^|\s)@[a-z0-9_.]{2,}/i;
const MESSENGER_RE = /\b(whatsapp|telegram|snapchat|instagram|insta|t\.me|wa\.me|kik|signal me)\b/i;

export function containsContactInfo(text: string): boolean {
  return URL_RE.test(text) || PHONE_RE.test(text) || HANDLE_RE.test(text) || MESSENGER_RE.test(text);
}

const SCAM_RE = /\b(crypto|bitcoin|investment|invest with me|forex|trading signals|sugar daddy|cash ?app|gift ?card)\b/i;
export const looksLikeScam = (text: string) => SCAM_RE.test(text);

export const NAME_RE = /^[\p{L}][\p{L}\p{M}' -]{0,29}$/u;
