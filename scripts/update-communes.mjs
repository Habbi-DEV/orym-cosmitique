/**
 * update-communes.mjs
 * --------------------
 * Récupère la liste OFFICIELLE et COMPLÈTE des 1541 communes d'Algérie
 * (source : othmanus/algeria-cities — dépôt MIT, basé sur les données du
 * Ministère de l'Intérieur algérien, inclut les 10 puis nouvelles wilayas)
 * et régénère src/data/wilayas.ts avec la liste complète des communes
 * pour chaque wilaya — SANS toucher aux prix (home/stopdesk) ni aux
 * surcoûts (`extra`) que tu as déjà définis pour les communes existantes.
 *
 * Pourquoi un script et pas un fichier tout fait ?
 * → 1541 communes copiées à la main = risque réel d'erreurs de frappe
 *   (des noms de villes utilisés pour calculer les frais de livraison).
 *   Ce script les récupère directement depuis la source, donc 0 erreur
 *   de transcription, et tu peux le relancer plus tard si la liste change.
 *
 * USAGE (depuis la racine du projet, avec une connexion internet) :
 *   node scripts/update-communes.mjs
 *
 * Un fichier de sauvegarde src/data/wilayas.backup.ts est créé avant
 * toute modification.
 */
import fs from 'node:fs';
import path from 'node:path';

const CSV_URL = 'https://raw.githubusercontent.com/othmanus/algeria-cities/master/csv/ascii/algeria_cities.csv';
const TARGET = path.resolve('src/data/wilayas.ts');
const BACKUP = path.resolve('src/data/wilayas.backup.ts');

// ---- 1. Télécharger le CSV officiel ----
console.log('Téléchargement de la liste officielle des communes...');
const res = await fetch(CSV_URL);
if (!res.ok) {
  console.error(`Échec du téléchargement (HTTP ${res.status}). Vérifie ta connexion internet.`);
  process.exit(1);
}
const csvText = await res.text();

// ---- 2. Parser le CSV (gère les guillemets et virgules internes) ----
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
const idx = {
  commune: header.indexOf('commune_name_ascii') !== -1 ? header.indexOf('commune_name_ascii') : header.indexOf('commune_name'),
  wilayaCode: header.indexOf('wilaya_code'),
  wilayaName: header.indexOf('wilaya_name_ascii') !== -1 ? header.indexOf('wilaya_name_ascii') : header.indexOf('wilaya_name'),
};
if (idx.commune === -1 || idx.wilayaCode === -1) {
  console.error('Format CSV inattendu — colonnes trouvées:', header);
  process.exit(1);
}

/** @type {Map<number, {name: string, communes: string[]}>} */
const byWilaya = new Map();
for (let i = 1; i < lines.length; i++) {
  const cols = parseCsvLine(lines[i]);
  const code = parseInt(cols[idx.wilayaCode], 10);
  const communeName = (cols[idx.commune] || '').trim();
  const wilayaName = (cols[idx.wilayaName] || '').trim();
  if (!code || !communeName) continue;
  if (!byWilaya.has(code)) byWilaya.set(code, { name: wilayaName, communes: [] });
  byWilaya.get(code).communes.push(communeName);
}

console.log(`→ ${[...byWilaya.values()].reduce((s, w) => s + w.communes.length, 0)} communes trouvées sur ${byWilaya.size} wilayas.`);

// ---- 3. Lire le fichier actuel pour récupérer home/stopdesk + surcoûts existants ----
const current = fs.readFileSync(TARGET, 'utf8');

const wilayaLineRegex = /\{\s*code:\s*(\d+),\s*name:\s*((?:'[^']*'|"[^"]*"))\s*,\s*home:\s*(\d+),\s*stopdesk:\s*(\d+),\s*communes:\s*\[([\s\S]*?)\]\s*\}/g;

/** @type {Map<number, {home:number, stopdesk:number, extras: Map<string, number>}>} */
const existing = new Map();
let match;
while ((match = wilayaLineRegex.exec(current))) {
  const code = parseInt(match[1], 10);
  const home = parseInt(match[3], 10);
  const stopdesk = parseInt(match[4], 10);
  const communesBlock = match[5];
  const extras = new Map();
  const communeRegex = /c\(\s*((?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"))\s*(?:,\s*(\d+))?\s*\)/g;
  let cm;
  while ((cm = communeRegex.exec(communesBlock))) {
    const rawName = cm[1].slice(1, -1).replace(/\\'/g, "'");
    const extra = cm[2] ? parseInt(cm[2], 10) : 0;
    extras.set(normalize(rawName), extra);
  }
  existing.set(code, { home, stopdesk, extras });
}
console.log(`→ ${existing.size} wilayas lues dans le fichier actuel (prix conservés).`);

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // enlève les accents pour comparer
    .replace(/[^a-z0-9]/g, '');
}

function escapeName(name) {
  return name.replace(/'/g, "\\'");
}

// ---- 4. Construire le nouveau fichier ----
const codes = [...byWilaya.keys()].sort((a, b) => a - b);
const lines_out = [];
lines_out.push(`export interface Commune {`);
lines_out.push(`  name: string;`);
lines_out.push(`  extra: number;`);
lines_out.push(`}`);
lines_out.push(``);
lines_out.push(`export interface Wilaya {`);
lines_out.push(`  code: number;`);
lines_out.push(`  name: string;`);
lines_out.push(`  home: number;`);
lines_out.push(`  stopdesk: number;`);
lines_out.push(`  communes: Commune[];`);
lines_out.push(`}`);
lines_out.push(``);
lines_out.push(`const c = (name: string, extra = 0): Commune => ({ name, extra });`);
lines_out.push(``);
lines_out.push(`// Liste complète des 1541 communes officielles, générée par`);
lines_out.push(`// scripts/update-communes.mjs — source: othmanus/algeria-cities (MIT).`);
lines_out.push(`// Les prix (home/stopdesk) et les surcoûts (extra) déjà définis ont été conservés.`);
lines_out.push(`export const wilayas: Wilaya[] = [`);

let missingPricing = [];
for (const code of codes) {
  const w = byWilaya.get(code);
  const prev = existing.get(code);
  if (!prev) {
    missingPricing.push(`${code} - ${w.name}`);
  }
  const home = prev?.home ?? 700;
  const stopdesk = prev?.stopdesk ?? 500;
  const communesStr = w.communes
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const extra = prev?.extras.get(normalize(name)) ?? 0;
      return extra > 0 ? `c('${escapeName(name)}', ${extra})` : `c('${escapeName(name)}')`;
    })
    .join(', ');
  lines_out.push(
    `  { code: ${code}, name: '${escapeName(w.name)}', home: ${home}, stopdesk: ${stopdesk}, communes: [${communesStr}] },`,
  );
}
lines_out.push(`];`);
lines_out.push('');

// ---- 5. Sauvegarde + écriture ----
fs.copyFileSync(TARGET, BACKUP);
fs.writeFileSync(TARGET, lines_out.join('\n'), 'utf8');

console.log(`\n✅ Terminé. Ancien fichier sauvegardé dans ${path.relative(process.cwd(), BACKUP)}`);
console.log(`✅ Nouveau fichier écrit dans ${path.relative(process.cwd(), TARGET)}`);
if (missingPricing.length) {
  console.log(`\n⚠️  Wilayas sans prix existant (700/500 DA utilisés par défaut, à ajuster) :`);
  missingPricing.forEach((m) => console.log('   - ' + m));
}
console.log('\nVérifie le fichier, puis lance `npm run build` pour confirmer que tout compile.');
