// Chart download helpers — export an SVG node to PNG, or data to CSV.
// SVG charts use explicit hex colours (not CSS vars) so the rasterised PNG
// keeps its colours when serialised standalone.

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCSV(filename, header, rows) {
  const esc = (c) => `"${String(c ?? '').replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
}

export function svgToPng(svgEl, filename, scale = 2) {
  if (!svgEl) return;
  const w = svgEl.viewBox?.baseVal?.width || svgEl.clientWidth || 600;
  const h = svgEl.viewBox?.baseVal?.height || svgEl.clientHeight || 400;
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const xml = new XMLSerializer().serializeToString(clone);
  const svg64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => blob && saveBlob(blob, filename), 'image/png');
  };
  img.src = svg64;
}
