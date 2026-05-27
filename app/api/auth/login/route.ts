import { NextResponse } from "next/server";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateNonce,
  generateState,
  getShopifyConfig,
} from "@/lib/shopify-auth";

export async function GET() {
  const { clientId, redirectUri, authorizeUrl } = getShopifyConfig();

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();
  const nonce = generateNonce();

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "openid email customer-account-api:full",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const url = `${authorizeUrl}?${params.toString()}`;
  const response = NextResponse.redirect(url);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
  };

  response.cookies.set("oauth_state", state, cookieOptions);
  response.cookies.set("oauth_verifier", codeVerifier, cookieOptions);
  response.cookies.set("oauth_nonce", nonce, cookieOptions);

  return response;
}
