'use client';

export interface PRData {
  pr: string; agPr: string; agPrDate: string; ageAtAgPr: string;
  factorAtRace: string; agTime: string; todaysFactor: string; target: string;
}

export interface RunnerForm {
  nickname: string; fullName: string; birthday: string;
  prs: Record<string, PRData>;
}

const DISTANCES = [
  '5k', '4 mile', '5 mile', '10k', '8 mile', '15k',
  '10 mile', 'Half Marathon', 'Full Marathon',
  '50k', '50 Mile', '100 Mile',
];

export function emptyForm(): RunnerForm {
  return { nickname: '', fullName: '', birthday: '', prs: {} };
}

export function RunnerFormFields({ form, setForm }: { form: RunnerForm; setForm: (f: RunnerForm) => void }) {
  const updatePR = (dist: string, field: string, value: string) => {
    const current = form.prs[dist] || { pr: '', agPr: '', agPrDate: '', ageAtAgPr: '', factorAtRace: '', agTime: '', todaysFactor: '', target: '' };
    setForm({ ...form, prs: { ...form.prs, [dist]: { ...current, [field]: value } } });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nickname *</label>
          <input type="text" required value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="e.g., Speedy" className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
          <input type="text" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g., John Smith" className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Birthday</label>
          <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className="input" />
        </div>
      </div>

      <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Personal Records & Targets</h3>
      <p className="text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: 'var(--text-muted)' }}>Leave blank for distances not yet raced. Times in H:MM:SS or MM:SS format.</p>
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="text-sm" style={{ minWidth: '700px' }}>
          <thead>
            <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--card-border)' }}>
              <th className="px-1.5 sm:px-3 py-2 text-left font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Distance</th>
              <th className="px-1.5 sm:px-3 py-2 text-left font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>PR</th>
              <th className="px-1.5 sm:px-3 py-2 text-left font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>AG PR</th>
              <th className="px-1.5 sm:px-3 py-2 text-left font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Date</th>
              <th className="px-1.5 sm:px-3 py-2 text-left font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Age</th>
              <th className="px-1.5 sm:px-3 py-2 text-left font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Factor</th>
              <th className="px-1.5 sm:px-3 py-2 text-left font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>AG Time</th>
              <th className="px-1.5 sm:px-3 py-2 text-left font-semibold text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>T.Factor</th>
              <th className="px-1.5 sm:px-3 py-2 text-left font-semibold text-xs sm:text-sm" style={{ color: 'var(--accent-gold)' }}>Target</th>
            </tr>
          </thead>
          <tbody>
            {DISTANCES.map((dist) => {
              const prData = form.prs[dist] || { pr: '', agPr: '', agPrDate: '', ageAtAgPr: '', factorAtRace: '', agTime: '', todaysFactor: '', target: '' };
              return (
                <tr key={dist} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td className="px-1.5 sm:px-3 py-2 font-medium whitespace-nowrap text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>{dist}</td>
                  <td className="px-1 sm:px-3 py-1"><input type="text" value={prData.pr} onChange={(e) => updatePR(dist, 'pr', e.target.value)} placeholder="MM:SS" className="input py-1 sm:py-1.5 text-xs" style={{ minWidth: '65px' }} /></td>
                  <td className="px-1 sm:px-3 py-1"><input type="text" value={prData.agPr} onChange={(e) => updatePR(dist, 'agPr', e.target.value)} placeholder="MM:SS" className="input py-1 sm:py-1.5 text-xs" style={{ minWidth: '65px' }} /></td>
                  <td className="px-1 sm:px-3 py-1"><input type="date" value={prData.agPrDate} onChange={(e) => updatePR(dist, 'agPrDate', e.target.value)} className="input py-1 sm:py-1.5 text-xs" style={{ minWidth: '100px' }} /></td>
                  <td className="px-1 sm:px-3 py-1"><input type="number" value={prData.ageAtAgPr} onChange={(e) => updatePR(dist, 'ageAtAgPr', e.target.value)} placeholder="Age" className="input py-1 sm:py-1.5 text-xs" style={{ minWidth: '45px' }} /></td>
                  <td className="px-1 sm:px-3 py-1"><input type="text" value={prData.factorAtRace} onChange={(e) => updatePR(dist, 'factorAtRace', e.target.value)} placeholder="0.0000" className="input py-1 sm:py-1.5 text-xs" style={{ minWidth: '60px' }} /></td>
                  <td className="px-1 sm:px-3 py-1"><input type="text" value={prData.agTime} onChange={(e) => updatePR(dist, 'agTime', e.target.value)} placeholder="MM:SS" className="input py-1 sm:py-1.5 text-xs" style={{ minWidth: '65px' }} /></td>
                  <td className="px-1 sm:px-3 py-1"><input type="text" value={prData.todaysFactor} onChange={(e) => updatePR(dist, 'todaysFactor', e.target.value)} placeholder="0.0000" className="input py-1 sm:py-1.5 text-xs" style={{ minWidth: '60px' }} /></td>
                  <td className="px-1 sm:px-3 py-1"><input type="text" value={prData.target} onChange={(e) => updatePR(dist, 'target', e.target.value)} placeholder="MM:SS" className="input py-1 sm:py-1.5 text-xs" style={{ minWidth: '65px' }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function StatusMessage({ msg }: { msg: { type: 'success' | 'error'; text: string } }) {
  return (
    <div className="mt-4 p-3 rounded-lg text-sm" style={{
      background: msg.type === 'success' ? 'rgba(0,200,117,0.08)' : 'rgba(226,68,92,0.08)',
      color: msg.type === 'success' ? '#00854D' : '#D83A52',
      border: `1px solid ${msg.type === 'success' ? 'rgba(0,200,117,0.25)' : 'rgba(226,68,92,0.25)'}`,
    }}>
      {msg.text}
    </div>
  );
}
