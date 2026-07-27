/** Construit le contenu CSV (séparateur `;`, compatible Excel FR) — logique pure, testable */
export function toCsvString(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(';'),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(';')),
  ];
  // \uFEFF (BOM) : Excel affiche correctement les accents français
  return '\uFEFF' + lines.join('\r\n');
}

/** Génère et télécharge un fichier CSV dans le navigateur */
export function downloadCsv(filename: string, rows: Record<string, string | number>[]): void {
  const csv = toCsvString(rows);
  if (!csv) return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
