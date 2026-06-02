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
  earthquake: {
    basis: 'East African Rift seismicity — western branch highest (Tanganyika-Rukwa, PGA>0.32g); 2016 Kagera Mw5.9',
    regions: { Rukwa: 9, Katavi: 8, Kigoma: 8, Mbeya: 8, Songwe: 8, Kagera: 7, Njombe: 6, Arusha: 6, Manyara: 6,
      Kilimanjaro: 6, Singida: 5, Iringa: 5, Ruvuma: 4 },
    districts: { Sumbawanga: 9, Nkasi: 9, Kalambo: 9, Mpanda: 8, Mlele: 8, Tanganyika: 8, Bukoba: 8, Muleba: 7,
      Missenyi: 7, Mbozi: 8, Ileje: 8, Momba: 8, Kyela: 8, Rungwe: 7, Busekelo: 7, Ngorongoro: 7, Longido: 6, Monduli: 6 },
  },
  wildfire: {
    basis: 'Miombo woodland fire regime — western/southern dry-season burning (MODIS/VIIRS refine pending)',
    regions: { Tabora: 6, Katavi: 6, Rukwa: 6, Ruvuma: 6, Lindi: 5, Morogoro: 5, Iringa: 5, Mbeya: 5, Singida: 5,
      Songwe: 5, Kigoma: 5, Njombe: 5, Manyara: 4, Dodoma: 4 },
    districts: { Sikonge: 7, Urambo: 7, Kaliua: 7, Uyui: 6, Tunduru: 7, Namtumbo: 7, Liwale: 7, Nachingwea: 6, Chunya: 6 },
  },
  vehicleAccidents: {  // human/technological hazard — kept moderate (not a primary disaster driver)
    basis: 'Major highway corridors (TANZAM/A104, A7 Dar-Mwanza) + urban traffic (police road-accident data)',
    regions: { 'Dar es Salaam': 5, Morogoro: 4, Pwani: 4, Dodoma: 3, Singida: 3, Mbeya: 4, Iringa: 3, Arusha: 4,
      Kilimanjaro: 4, Tanga: 3, Mwanza: 4, Manyara: 3 },
    districts: { Ilala: 5, Kinondoni: 5, Temeke: 5, Ubungo: 5, Kigamboni: 4, Chalinze: 6, Kibaha: 5, Bagamoyo: 4,
      Morogoro: 5, Kilosa: 4, Mbeya: 5, Arusha: 5, Moshi: 4, Dodoma: 4, Nyamagana: 4, Babati: 3 },
  },
  hazardousMaterial: {  // human/technological hazard — localized, kept moderate
    basis: 'Industrial (Dar), gold/mercury mining (Geita/Kahama/Mara), gas & petroleum (Mtwara/Lindi, Dar port/pipeline)',
    districts: { Ilala: 4, Kinondoni: 4, Temeke: 6, Kigamboni: 5, Ubungo: 4, Geita: 5, Chato: 4, Mbogwe: 4, Kahama: 5,
      Msalala: 4, Tarime: 4, Mtwara: 5, Kilwa: 4, Lindi: 4, Nyamagana: 4, Ilemela: 4, Chunya: 5, Mbeya: 4, Mpanda: 4 },
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
