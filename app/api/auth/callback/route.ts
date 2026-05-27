import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getShopifyConfig } from "@/lib/shopify-auth";
import { encodeSession, SESSION_COOKIE } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { appUrl } = getShopifyConfig();
  const searchParams = request.nextUrl.searchParams;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${appUrl}/?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/?error=missing_params`);
  }

  const cookieState = request.cookies.get("oauth_state")?.value;
  const cookieVerifier = request.cookies.get("oauth_verifier")?.value;

  if (!cookieState || !cookieVerifier || state !== cookieState) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_state`);
  }

  try {
    const tokenData = await exchangeCodeForToken(code, cookieVerifier);

    const sessionValue = encodeSession({
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    });

    const response = NextResponse.redirect(`${appUrl}/dashboard`);

    response.cookies.set(SESSION_COOKIE, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokenData.expires_in,
    });

    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_verifier");
    response.cookies.delete("oauth_nonce");

    return response;
  } catch (err) {
    console.error("Erro no callback:", err);
    return NextResponse.redirect(`${appUrl}/?error=token_exchange_failed`);
  }
}
