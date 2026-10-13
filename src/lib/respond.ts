import { NextResponse } from 'next/server';

// The public address of the app. Behind a host's proxy (Render) the request's own URL is an
// internal one such as localhost:10000, so links and redirects must not be built from it.
export function originOf(headers: Headers) {
  const fixed = process.env.APP_URL ?? process.env.RENDER_EXTERNAL_URL;
  if (fixed) return fixed.replace(/\/$/, '');
  const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? 'localhost:3000';
  return `${headers.get('x-forwarded-proto') ?? 'http'}://${host}`;
}

// The action routes are posted to by plain page forms, which want sending back to their page,
// and by the pharmacy ledger grid and API clients, which ask for JSON. `backTo` is a path.
export function respond(request: Request, backTo: string, ok: boolean) {
  if (request.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
  }
  return NextResponse.redirect(`${originOf(request.headers)}${backTo}`, 303);
}
