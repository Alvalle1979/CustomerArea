import crypto from "crypto";

const COOKIE_NAME = "shopify_session";

interface SessionData {
  accessToken: string;
  expiresAt: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET precisa estar definido com pelo menos 16 caracteres");
  }
  return secret;
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

export function encodeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function decodeSession(cookieValue: string | undefined): SessionData | null {
  if (!cookieValue) return null;

  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  if (signature !== expected) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionData;
    if (data.expiresAt < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
