import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

function maintenanceOn() {
  const flag = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isLogin =
    pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (
    maintenanceOn() &&
    !isAdmin &&
    pathname !== "/maintenance" &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    pathname !== "/favicon.ico" &&
    pathname !== "/robots.txt" &&
    pathname !== "/sitemap.xml"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    const response = NextResponse.rewrite(url);
    response.headers.set("Retry-After", "3600");
    return response;
  }

  if (isAdmin && !isLogin) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
