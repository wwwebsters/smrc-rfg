import { NextResponse } from 'next/server';
import { dbRun, dbGet } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { nickname, fullName, birthday } = await request.json();

    if (!nickname || !fullName) {
      return NextResponse.json(
        { error: 'Nickname and full name are required' },
        { status: 400 }
      );
    }

    // Check if nickname already exists
    const existing = await dbGet<{ id: number }>(
      `SELECT id FROM runners WHERE nickname = ?`,
      [nickname]
    );

    if (existing) {
      return NextResponse.json(
        { error: `Runner with nickname "${nickname}" already exists` },
        { status: 409 }
      );
    }

    // Calculate age from birthday
    let age: number | null = null;
    if (birthday) {
      const birth = new Date(birthday);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    const result = await dbRun(
      `INSERT INTO runners (nickname, full_name, birthday, age) VALUES (?, ?, ?, ?)`,
      [nickname.trim(), fullName.trim(), birthday || null, age]
    );

    return NextResponse.json(
      { id: Number(result.lastInsertRowid), message: `Runner "${nickname}" added` },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add runner error:', error);
    return NextResponse.json({ error: 'Failed to add runner' }, { status: 500 });
  }
}
