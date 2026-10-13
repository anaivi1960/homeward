import { NextResponse } from 'next/server';
import { searchDirectory } from '@/lib/pharmacy-search';

// GET /api/pharmacies/search?q=abakpa&state=Enugu&lga=Enugu%20East&limit=10
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const limit = Number(params.get('limit'));
  const result = await searchDirectory({
    q: params.get('q') ?? undefined,
    state: params.get('state') ?? undefined,
    lga: params.get('lga') ?? undefined,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
  });
  return NextResponse.json(result);
}
