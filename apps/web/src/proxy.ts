import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "aa_session";

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(COOKIE)?.value);
  const loggingIn = request.nextUrl.pathname.startsWith("/connexion");

  if (!hasSession && !loggingIn) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }
  if (hasSession && loggingIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
