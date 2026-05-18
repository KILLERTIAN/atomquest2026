import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session?.user?.role;

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/manager") && role !== "MANAGER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/employee") && role !== "EMPLOYEE" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/employee/:path*", "/manager/:path*", "/admin/:path*"],
};
