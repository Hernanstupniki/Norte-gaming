import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

type SessionBody = {
  token?: string;
};

const getServerApiBaseUrl = () =>
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_INTERNAL_API_URL ||
  "http://norte-gaming-api:4000/api";

type MeResponse = {
  role?: string;
};

const isAdminToken = async (token: string) => {
  const response = await fetch(`${getServerApiBaseUrl()}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return false;
  }

  const payload = (await response.json().catch(() => ({}))) as MeResponse;
  return payload.role === "ADMIN";
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SessionBody;
  const token = (body.token || "").trim();

  if (!token) {
    return NextResponse.json({ message: "Token inválido" }, { status: 400 });
  }

  const isAdmin = await isAdminToken(token);
  if (!isAdmin) {
    return NextResponse.json(
      { message: "Solo administradores pueden abrir sesión de panel" },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  const requestUrl = new URL(request.url);
  const isLocalhost = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !isLocalhost,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
