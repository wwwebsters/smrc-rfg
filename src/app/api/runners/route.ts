import { NextResponse } from 'next/server';
import { dbAll } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const runners = await dbAll(
      `SELECT id, nickname, full_name, birthday, age FROM runners ORDER BY nickname ASC`
    );
    return NextResponse.json(runners);
  } catch (error) {
    console.error('Runners error:', error);
    return NextResponse.json({ error: 'Failed to fetch runners' }, { status: 500 });
  }
}
