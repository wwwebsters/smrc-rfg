import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    const isValidName = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!validTypes.includes(file.type) && !isValidName) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sheetSummaries = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

      const headers = data.length > 0 ? (data[0] as string[]) : [];
      const rowCount = Math.max(0, data.length - 1); // exclude header row
      const sampleRows = data.slice(1, 6); // up to 5 sample data rows

      return {
        sheetName,
        headers,
        rowCount,
        sampleRows,
      };
    });

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      sheetCount: workbook.SheetNames.length,
      sheets: sheetSummaries,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to parse Excel file' }, { status: 500 });
  }
}
