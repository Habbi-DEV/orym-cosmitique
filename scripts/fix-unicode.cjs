// Decode literal \uXXXX sequences accidentally stored as raw text in source files
const fs = require('fs');
const path = require('path');

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)],
  );

const files = walk('src').filter((f) => /\.tsx?$/.test(f));
let fixed = 0;

for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  // (?<!\\) → do not touch intentionally double-escaped sequences
  const out = s.replace(/(?<!\\)\\u([0-9a-fA-F]{4})/g, (m, h) =>
    String.fromCharCode(parseInt(h, 16)),
  );
  if (out !== s) {
    fs.writeFileSync(f, out);
    fixed++;
    console.log('fixed:', f);
  }
}
console.log('--- total files fixed:', fixed);
