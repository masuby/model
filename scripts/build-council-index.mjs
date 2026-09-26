/**
 * build-council-index.mjs — write src/data/tanzania-councils-index.json: the 195 councils' properties
 * WITHOUT geometry. The risk model only needs names/codes/regions/source units, so the app shell no
 * longer bundles the 470 KB boundary file (the map loads geometry lazily with its own chunk).
 *
 * Run after scripts/export-councils.py whenever tanzania-councils.json changes.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const geo = JSON.parse(fs.readFileSync(ROOT + 'src/data/tanzania-councils.json', 'utf8'));
const index = geo.features.map((f) => {
  const { code, name, reg, src, isNew, parent } = f.properties;
  return { code: String(code), name, reg, src, ...(isNew ? { isNew: true } : {}), ...(parent ? { parent } : {}) };
});
fs.writeFileSync(ROOT + 'src/data/tanzania-councils-index.json', JSON.stringify(index));
console.log(`wrote ${index.length} councils to src/data/tanzania-councils-index.json`);
