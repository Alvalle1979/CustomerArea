import { NextResponse } from "next/server";
import { getShopifyConfig } from "@/lib/shopify-auth";
import { SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const { appUrl } = getShopifyConfig();
  const response = NextResponse.redirect(appUrl);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
