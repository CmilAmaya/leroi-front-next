import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("token"); 

  const protectedRoutes = [
    "/profile",
    "/roadmap",
    "/generatedRoadmap",
    "/roadmapsCreados",
    "/questions",
    "/pricing",
  ];

  if (protectedRoutes.some((path) => req.nextUrl.pathname.startsWith(path)) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/roadmap/:path*",
    "/generatedRoadmap/:path*",
    "/roadmapsCreados/:path*",
    "/questions/:path*",
    "/pricing/:path*",
  ],
};
