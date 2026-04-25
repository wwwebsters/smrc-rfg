import { NextResponse } from 'next/server';

// Simple endpoint to check if RFG admin auth cookie is set
// The middleware will return 401 if not authenticated
export async function GET() {
  return NextResponse.json({ authenticated: true });
}
