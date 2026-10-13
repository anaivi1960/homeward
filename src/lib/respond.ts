import { NextResponse } from 'next/server';

// The action routes are posted to by plain page forms, which want sending back to their page,
// and by the pharmacy ledger grid and API clients, which ask for JSON.
export function respond(request: Request, backTo: string | URL, ok: boolean) {
  if (request.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
  }
  return NextResponse.redirect(new URL(backTo, request.url), 303);
}
