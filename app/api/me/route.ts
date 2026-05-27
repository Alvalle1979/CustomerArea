import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";
import { fetchCustomer } from "@/lib/shopify-auth";

export async function GET() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const customer = await fetchCustomer(session.accessToken);
    return NextResponse.json({ customer });
  } catch (err) {
    console.error("Erro ao buscar customer:", err);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}
