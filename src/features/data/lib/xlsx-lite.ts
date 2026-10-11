/**
 * xlsx-lite - read one worksheet of an .xlsx file in the browser without a spreadsheet library.
 *
 * An .xlsx file is a zip of XML parts. This reader walks the zip's central directory, inflates the
 * parts it needs with the browser's DecompressionStream ('deflate-raw'), and reads cell values
 * (shared strings, inline strings, numbers, booleans; formulas give their cached value). It covers the
 * collection tools this platform issues (scripts/build-collection-tool.py, openpyxl output) and
 * ordinary spreadsheets saved by Excel or LibreOffice; it never evaluates formulas or macros.
 *
 * Why not a library: the xlsx package was moved out of the client bundle for its advisories (SEC-03);
 * a reader of a few hundred lines keeps the client dependency-free and parses only what it needs.
 */

export type Cell = string | number | boolean | null;

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

const TEXT = new TextDecoder();

function readCentralDirectory(buf: ArrayBuffer): ZipEntry[] {
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  // End of central directory record: signature 0x06054b50, searched from the end (comment up to 64 KiB).
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 22 - 65536); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const entries: ZipEntry[] = [];
  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) throw new Error('bad central directory');
    const method = view.getUint16(p + 10, true);
    const compressedSize = view.getUint32(p + 20, true);
    const uncompressedSize = view.getUint32(p + 24, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localHeaderOffset = view.getUint32(p + 42, true);
    const name = TEXT.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    entries.push({ name, method, compressedSize, uncompressedSize, localHeaderOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') throw new Error('DecompressionStream is not available in this browser');
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readEntry(buf: ArrayBuffer, e: ZipEntry): Promise<string> {
  const view = new DataView(buf);
  const p = e.localHeaderOffset;
  if (view.getUint32(p, true) !== 0x04034b50) throw new Error('bad local header');
  const nameLen = view.getUint16(p + 26, true);
  const extraLen = view.getUint16(p + 28, true);
  const start = p + 30 + nameLen + extraLen;
  const data = new Uint8Array(buf, start, e.compressedSize);
  if (e.method === 0) return TEXT.decode(data);
  if (e.method === 8) return TEXT.decode(await inflate(data));
  throw new Error(`unsupported compression method ${e.method}`);
}

const unescape = (s: string): string =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');

/** Text of every <t> inside a <si> or <is>, joined (rich text runs). */
function textOf(xml: string): string {
  const parts: string[] = [];
  const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) parts.push(unescape(m[1]));
  return parts.join('');
}

function parseSharedStrings(xml: string): string[] {
  const out: string[] = [];
  const re = /<si>([\s\S]*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(textOf(m[1]));
  return out;
}

/** Column letters → zero-based index ("A" → 0, "AB" → 27). */
export function columnIndex(ref: string): number {
  let n = 0;
  for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + (ch.toUpperCase().charCodeAt(0) - 64);
  return n - 1;
}

function parseSheet(xml: string, shared: string[]): Cell[][] {
  const rows: Cell[][] = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  const cellRe = /<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(xml))) {
    const row: Cell[] = [];
    let cm: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((cm = cellRe.exec(rm[1]))) {
      const attrs = cm[1];
      const inner = cm[2] ?? '';
      const ref = /\br="([A-Z]+)\d+"/.exec(attrs)?.[1];
      if (!ref) continue;
      const col = columnIndex(ref);
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? 'n';
      let value: Cell = null;
      if (type === 's') {
        const i = Number(/<v>([^<]*)<\/v>/.exec(inner)?.[1]);
        value = Number.isInteger(i) ? (shared[i] ?? '') : '';
      } else if (type === 'inlineStr') value = textOf(inner);
      else if (type === 'str') value = unescape(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? '');
      else if (type === 'b') value = /<v>([^<]*)<\/v>/.exec(inner)?.[1] === '1';
      else if (type === 'e') value = null;
      else {
        const v = /<v>([^<]*)<\/v>/.exec(inner)?.[1];
        value = v == null || v === '' ? null : Number(v);
      }
      while (row.length < col) row.push(null);
      row[col] = value;
    }
    rows.push(row);
  }
  return rows;
}

export interface WorkbookLite {
  /** Sheet names in workbook order. */
  sheets: string[];
  /** Rows of one sheet (null for an empty cell); sheet by name or zero-based index. */
  rows(sheet: string | number): Promise<Cell[][]>;
}

/** Open an .xlsx file (ArrayBuffer) for reading. */
export async function openXlsx(buf: ArrayBuffer): Promise<WorkbookLite> {
  const entries = readCentralDirectory(buf);
  const byName = new Map(entries.map((e) => [e.name, e]));
  const workbookXml = byName.get('xl/workbook.xml');
  if (!workbookXml) throw new Error('not an Excel workbook');
  const wb = await readEntry(buf, workbookXml);
  const relsXml = byName.get('xl/_rels/workbook.xml.rels') ? await readEntry(buf, byName.get('xl/_rels/workbook.xml.rels')!) : '';
  const rels = new Map<string, string>();
  for (const m of relsXml.matchAll(/<Relationship\s([^>]*?)\/?>/g)) {
    const id = /\bId="([^"]+)"/.exec(m[1])?.[1];
    const target = /\bTarget="([^"]+)"/.exec(m[1])?.[1];
    if (id && target) rels.set(id, target.replace(/^\/?(xl\/)?/, 'xl/'));
  }
  const sheets: Array<{ name: string; part: string }> = [];
  for (const m of wb.matchAll(/<sheet\s([^>]*?)\/?>/g)) {
    const name = unescape(/\bname="([^"]*)"/.exec(m[1])?.[1] ?? '');
    const rid = /\br:id="([^"]+)"/.exec(m[1])?.[1] ?? /\bid="([^"]+)"/.exec(m[1])?.[1];
    const part = (rid && rels.get(rid)) || `xl/worksheets/sheet${sheets.length + 1}.xml`;
    sheets.push({ name, part });
  }
  let shared: string[] | null = null;
  const sharedStrings = async () => (shared ??= byName.get('xl/sharedStrings.xml') ? parseSharedStrings(await readEntry(buf, byName.get('xl/sharedStrings.xml')!)) : []);
  return {
    sheets: sheets.map((s) => s.name),
    async rows(sheet) {
      const s = typeof sheet === 'number' ? sheets[sheet] : sheets.find((x) => x.name === sheet);
      if (!s) throw new Error(`no sheet ${String(sheet)}`);
      const entry = byName.get(s.part);
      if (!entry) throw new Error(`missing part ${s.part}`);
      return parseSheet(await readEntry(buf, entry), await sharedStrings());
    },
  };
}
