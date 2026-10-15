// Health check for the host (Render pings this); deliberately touches nothing external.
export function GET() {
  return Response.json({ ok: true });
}
