import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "localhost:3000";

  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  const origin = `${proto}://${host}`;
  const callbackUri = `${origin}/api/auth/callback/google`;

  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;

  return NextResponse.json({
    status: "ok",
    detectedOrigin: origin,
    googleOAuthSettings: {
      authorizedJavascriptOrigin: origin,
      authorizedRedirectUri: callbackUri,
      localhostRedirectUri: "http://localhost:3000/api/auth/callback/google",
    },
    environmentVariablesDetected: {
      GOOGLE_CLIENT_ID: hasClientId ? "Configured (Present)" : "MISSING",
      GOOGLE_CLIENT_SECRET: hasClientSecret ? "Configured (Present)" : "MISSING",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "Not set (Using dynamic host auto-detection)",
    },
    stepsToFixInGoogleCloudConsole: [
      "1. Open https://console.cloud.google.com/apis/credentials",
      "2. Click on your OAuth 2.0 Client ID under 'OAuth 2.0 Client IDs'",
      `3. Under 'Authorized JavaScript origins', add: ${origin}`,
      `4. Under 'Authorized redirect URIs', add: ${callbackUri}`,
      "   (Also ensure 'http://localhost:3000/api/auth/callback/google' is present for local development)",
      "5. Click 'SAVE' at the bottom of the page.",
      "6. Wait 1-2 minutes for Google's servers to sync the new redirect URI, then sign in again!"
    ]
  });
}
