/**
 * build-hazard-overlays.mjs — generate documented hazard overlays from researched rules into
 * one tidy CSV. Each value is a 0–10 exposure grade with a cited basis. Raise-only when applied
 * (apply-climate-hazards.mjs floors at the documented baseline). Extend by editing the rules.
 *
 * Sources:
 *  • Lightning  — Lake Victoria basin is one of Earth's top lightning hotspots (NASA LIS/OTD;
 *                 Albrecht et al.; Lake Victoria thunderstorm studies). Highest on the shore.
 *  • Volcano    — East African Rift volcanism: Ol Doinyo Lengai (active, Lake Natron/Arusha),
 *                 Rungwe Volcanic Province (Mbeya/Songwe), Kilimanjaro & Meru (dormant).
 *  • Zoonoses/pests — 2020 desert-locust invasion (northern TZ), fall armyworm (maize belts),
 *                 livestock disease/RVF (pastoral), tsetse/trypanosomiasis (western miombo).
 *
 * out: data-source/hazard_overlays.csv  (dist_name, reg_name, indicator, value, basis)
 */
import { readFileSync, writeFileSync } from 'fs';

const feats = JSON.parse(readFileSync('src/data/tanzania-districts.json', 'utf8')).features;
const DISTRICTS = feats.map((f) => ({ name: f.properties.dist_name, reg: f.properties.reg_name }));

// indicator → { basis, regions: {region:value}, districts: {district:value} }  (district overrides region)
const RULES = {
  lightning: {
    basis: 'Lake Victoria basin lightning hotspot (NASA LIS/OTD; one of Earth’s highest flash densities)',
    regions: { Mwanza: 8, Geita: 8, Kagera: 8, Mara: 8, Simiyu: 7, Kigoma: 7, Shinyanga: 6, Kilimanjaro: 6,
      Tabora: 5, Katavi: 5, Rukwa: 5, Arusha: 5, Mbeya: 5, Songwe: 5, Manyara: 4, Singida: 4, Iringa: 4,
      Njombe: 4, Morogoro: 3, Dodoma: 3, Tanga: 3, Pwani: 3, 'Dar es Salaam': 3, Ruvuma: 3, Lindi: 2, Mtwara: 2 },
    districts: { Ukerewe: 9, Sengerema: 9, Ilemela: 9, Nyamagana: 9, Magu: 8, Bukoba: 9, Muleba: 9, Missenyi: 8,
      Musoma: 9, Bunda: 9, Rorya: 9, Butiama: 8, Chato: 9, Geita: 9, Busega: 9, Bariadi: 8 },
  },
  volcano: {
    basis: 'East African Rift volcanism (Ol Doinyo Lengai active; Rungwe province; Kilimanjaro/Meru dormant)',
    districts: { Ngorongoro: 8, Longido: 7, Monduli: 6, Arumeru: 6, Arusha: 5, Karatu: 4,
      Hai: 5, Siha: 5, Moshi: 5, Rombo: 5, Mwanga: 4, Same: 4,
      Rungwe: 7, Busekelo: 7, Kyela: 6, Mbeya: 5, Ileje: 6, Mbarali: 4 },
  },
  zoonoses: {
    basis: '2020 desert-locust invasion (north), fall armyworm (maize belts), livestock disease (pastoral), tsetse (west)',
    regions: { Manyara: 6, Arusha: 6, Kilimanjaro: 5, Singida: 5, Dodoma: 4, Iringa: 4, Njombe: 4, Ruvuma: 4,
      Morogoro: 4, Mbeya: 4, Tabora: 4, Katavi: 4, Kigoma: 4, Rukwa: 4, Songwe: 4 },
    districts: { Monduli: 7, Longido: 7, Ngorongoro: 7, Kiteto: 7, Simanjiro: 6, Hanang: 6, Mbulu: 6, Karatu: 6,
      Babati: 6, Same: 6, Mwanga: 5 },
  },
};

const rows = [['dist_name', 'reg_name', 'indicator', 'value', 'basis']];
for (const [indicator, rule] of Object.entries(RULES)) {
  for (const d of DISTRICTS) {
    const v = rule.districts?.[d.name] ?? rule.regions?.[d.reg];
    if (typeof v === 'number') rows.push([d.name, d.reg, indicator, v, rule.basis]);
  }
}
const q = (s) => (/[",]/.test(String(s)) ? `"${s}"` : s);
writeFileSync('data-source/hazard_overlays.csv', rows.map((r) => r.map(q).join(',')).join('\n') + '\n');
const byInd = {};
rows.slice(1).forEach((r) => { byInd[r[2]] = (byInd[r[2]] || 0) + 1; });
console.log('wrote data-source/hazard_overlays.csv:', Object.entries(byInd).map(([k, c]) => `${k}=${c}`).join(' '));
