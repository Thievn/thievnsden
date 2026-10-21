import { NextRequest, NextResponse } from "next/server";
import {
  authConfigured,
  createSessionToken,
  credentialsMatch,
  sessionCookieBase,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FAIL = "The lock does not turn.";
const UNSET = "The lock is not set.";

function wantsJson(req: NextRequest) {
  return (req.headers.get("accept") ?? "").includes("application/json");
}

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

function fail(req: NextRequest, message: string, status: number) {
  if (wantsJson(req)) {
    return NextResponse.json({ ok: false, error: message }, { status });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = status === 503 ? "lock=1&err=unset" : "lock=1&err=1";
  return NextResponse.redirect(url, 303);
}

function finishLogout(req: NextRequest) {
  const secure = req.nextUrl.protocol === "https:";
  if (wantsJson(req)) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set({ ...sessionCookieBase(secure), value: "", maxAge: 0 });
    return res;
  }
  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  const res = NextResponse.redirect(url, 303);
  res.cookies.set({ ...sessionCookieBase(secure), value: "", maxAge: 0 });
  return res;
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ ok: false, error: FAIL }, { status: 403 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 4_000) {
    return fail(req, FAIL, 413);
  }

  let email = "";
  let password = "";
  let intent = "";
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as {
      email?: unknown;
      password?: unknown;
      intent?: unknown;
    } | null;
    email = typeof body?.email === "string" ? body.email : "";
    password = typeof body?.password === "string" ? body.password : "";
    intent = typeof body?.intent === "string" ? body.intent : "";
  } else if (contentType.includes("form")) {
    const form = await req.formData();
    email = String(form.get("email") ?? "");
    password = String(form.get("password") ?? "");
    intent = String(form.get("intent") ?? "");
  } else {
    return fail(req, FAIL, 415);
  }

  if (intent === "logout") return finishLogout(req);

  if (email.length > 200 || password.length > 200) return fail(req, FAIL, 401);

  if (!authConfigured()) {
    console.error(
      "Den auth is not configured. Set DEN_OWNER_EMAIL, DEN_OWNER_PASSWORD (10+ chars), and SESSION_SECRET (32+ chars).",
    );
    return fail(req, UNSET, 503);
  }

  if (!credentialsMatch(email, password)) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return fail(req, FAIL, 401);
  }

  const token = createSessionToken();
  if (!token) return fail(req, UNSET, 503);

  const secure = req.nextUrl.protocol === "https:";
  if (wantsJson(req)) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set({ ...sessionCookieBase(secure), value: token });
    return res;
  }

  const url = req.nextUrl.clone();
  url.pathname = "/den";
  url.search = "";
  const res = NextResponse.redirect(url, 303);
  res.cookies.set({ ...sessionCookieBase(secure), value: token });
  return res;
}
