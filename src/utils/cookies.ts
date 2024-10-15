import { parseCookies, setCookie } from "nookies";

const cookieOption = {
  maxAge: 30 * 24 * 60 * 60,
  path: "/",
};

export type SupportedKeys = "Authorization";

interface CookiePayload {
  key: string;
  data: string;
}

export const getClientCookie = (key: SupportedKeys) => {
  try {
    const cookies = parseCookies();
    return cookies[key];
  } catch (e) {
    return null;
  }
};

export function clientSetCookie(payload: CookiePayload) {
  const str = payload.data;
  setCookie(null, payload.key, str, cookieOption);
}

export function clearCookie(key: SupportedKeys) {
  setCookie(null, key, "", cookieOption);
}
