import { NextResponse } from 'next/server';
import { dbAll } from '@/lib/db';

interface RecapRow {
  id: number;
  runner_id: number;
  race_name: string;
  race_date: string | null;
  recap_text: string;
  original_format: string;
  original_filename: string | null;
  email_subject: string;
  email_date: string;
  created_at: string;
  runner_nickname: string;
  runner_full_name: string;
}

export async function GET() {
  try {
    const recaps = await dbAll<RecapRow>(
      `SELECT
        rc.id,
        rc.runner_id,
        rc.race_name,
        rc.race_date,
        rc.recap_text,
        rc.original_format,
        rc.original_filename,
        rc.email_subject,
        rc.email_date,
        rc.created_at,
        r.nickname as runner_nickname,
        r.full_name as runner_full_name
      FROM race_recaps rc
      JOIN runners r ON rc.runner_id = r.id
      ORDER BY r.full_name, rc.email_date DESC`
    );

    // Group by runner
    const byRunner: Record<string, {
      runner_id: number;
      runner_name: string;
      nickname: string;
      recaps: Array<{
        id: number;
        race_name: string;
        race_date: string | null;
        recap_text: string;
        original_format: string;
        email_date: string;
      }>;
    }> = {};

    for (const recap of recaps) {
      const key = recap.runner_full_name;
      if (!byRunner[key]) {
        byRunner[key] = {
          runner_id: recap.runner_id,
          runner_name: recap.runner_full_name,
          nickname: recap.runner_nickname,
          recaps: []
        };
      }
      byRunner[key].recaps.push({
        id: recap.id,
        race_name: recap.race_name,
        race_date: recap.race_date,
        recap_text: recap.recap_text,
        original_format: recap.original_format,
        email_date: recap.email_date
      });
    }

    return NextResponse.json(Object.values(byRunner));
  } catch (error) {
    console.error('Error fetching recaps:', error);
    return NextResponse.json({ error: 'Failed to fetch recaps' }, { status: 500 });
  }
}
