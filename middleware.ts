import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function maintenanceOn() {
  const flag = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export function middleware(request: NextRequest) {
  if (!maintenanceOn()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    pathname === "/maintenance" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  const response = NextResponse.rewrite(url);
  response.headers.set("Retry-After", "3600");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
