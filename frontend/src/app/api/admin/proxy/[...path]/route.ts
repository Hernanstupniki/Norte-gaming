import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

const getApiBaseUrl = () => "http://norte-gaming-api:4000/api";

const proxyRequest = async (
  request: Request,
  params: { path: string[] },
  method: "GET" | "POST" | "PATCH" | "DELETE",
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: "Sesión admin inválida" }, { status: 401 });
  }

  const backendPath = params.path.join("/");
  const incomingUrl = new URL(request.url);
  const query = incomingUrl.search || "";
  const targetUrl = `${getApiBaseUrl()}/${backendPath}${query}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const body = method === "GET" ? undefined : await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const responseContentType = response.headers.get("content-type") || "application/json";
  const responseBody = await response.arrayBuffer();

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "content-type": responseContentType,
    },
  });
};

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params, "GET");
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params, "POST");
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params, "PATCH");
}

export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params, "DELETE");
}
