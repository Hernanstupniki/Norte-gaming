import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isLoginPath = pathname === "/admin/login";

  if (!token && !isLoginPath) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (!token) {
    return NextResponse.next();
  }

  const isAdmin = await isAdminToken(token);
  if (!isAdmin) {
    if (isLoginPath) {
      const response = NextResponse.next();
      response.cookies.delete(ADMIN_SESSION_COOKIE);
      return response;
    }

    const loginUrl = new URL("/admin/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(ADMIN_SESSION_COOKIE);
    return response;
  }

  if (isLoginPath) {
    const adminUrl = new URL("/admin/productos", request.url);
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
