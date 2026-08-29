import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

type SessionBody = {
  token?: string;
};

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("Falta configurar JWT_ACCESS_SECRET en el frontend");
  }
  return new TextEncoder().encode(secret);
};

const isAdminToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret());
    return payload.role === "ADMIN";
  } catch {
    return false;
  }
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
