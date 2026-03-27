'use client';

import { useState } from 'react';

export default function UploadDataPage() {
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadMessage(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadMessage({
          type: 'success',
          text: `Uploaded "${data.fileName}" - ${data.sheetCount} sheets, ${data.sheets.map((s: { sheetName: string; rowCount: number }) => `${s.sheetName}: ${s.rowCount} rows`).join(', ')}`,
        });
      } else {
        setUploadMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch {
      setUploadMessage({ type: 'error', text: 'Network error' });
    }

    e.target.value = '';
  };

  return (
    <section className="card p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>Upload Excel Data</h2>
      <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
        Upload an SMRC Excel spreadsheet to import updated race data.
      </p>

      <label className="inline-flex items-center gap-2 px-6 py-3 rounded-lg cursor-pointer font-semibold text-white transition-all" style={{ background: 'var(--accent-blue)' }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Choose File
        <input type="file" accept=".xlsx,.xls" onChange={handleUpload} className="hidden" />
      </label>

      {uploadMessage && (
        <div className="mt-4 p-4 rounded-lg text-sm" style={{
          background: uploadMessage.type === 'success' ? 'rgba(0,200,117,0.08)' : 'rgba(226,68,92,0.08)',
          color: uploadMessage.type === 'success' ? '#00854D' : '#D83A52',
          border: `1px solid ${uploadMessage.type === 'success' ? 'rgba(0,200,117,0.25)' : 'rgba(226,68,92,0.25)'}`,
        }}>
          {uploadMessage.text}
        </div>
      )}
    </section>
  );
}
