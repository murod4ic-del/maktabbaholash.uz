import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/login", "/api", "/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/teacher") && token.role !== "teacher") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/parent") && token.role !== "parent") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
