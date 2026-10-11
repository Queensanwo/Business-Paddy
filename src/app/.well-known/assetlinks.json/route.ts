import { NextResponse } from 'next/server';

/**
 * Digital Asset Links statement for the Android APK (Bubblewrap/PWABuilder).
 * Served only when configured via ANDROID_ASSETLINKS_JSON (server env);
 * otherwise 404 so no placeholder ever ships. The SHA-256 fingerprint comes
 * from the release keystore at packaging time — see RELEASE.md.
 */
export async function GET() {
  const raw = process.env.ANDROID_ASSETLINKS_JSON;
  if (!raw) {
    return NextResponse.json({ error: 'Not configured.' }, { status: 404 });
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Misconfigured.' }, { status: 500 });
  }
}
