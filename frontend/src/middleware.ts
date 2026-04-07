import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

const getApiBaseUrl = () => "http://norte-gaming-api:4000/api";

type MeResponse = {
  role?: string;
};

const isAdminToken = async (token: string) => {
  const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
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
