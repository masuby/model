/**
 * ChartCard — frames a chart with a title and a download menu (PNG + CSV).
 * Grabs the inner <svg> for PNG export; takes the data for CSV export.
 */
import React, { useRef, useState } from 'react';
import { svgToPng, downloadCSV } from './chartExport';

export default function ChartCard({ title, subtitle, filenameBase, csv, children }) {
  const bodyRef = useRef(null);
  const [open, setOpen] = useState(false);

  const png = () => {
    const svg = bodyRef.current?.querySelector('svg');
    svgToPng(svg, `${filenameBase}.png`);
    setOpen(false);
  };
  const exportCsv = () => {
    if (csv) downloadCSV(`${filenameBase}.csv`, csv.header, csv.rows);
    setOpen(false);
  };

  return (
    <div className="ui-card ui-card-pad rc-card">
      <div className="rc-title">
        <span>
          <span className="ui-eyebrow">{title}</span>
          {subtitle && <span className="ui-muted rc-sub"> {subtitle}</span>}
        </span>
        <div className="rc-dl" onMouseLeave={() => setOpen(false)}>
          <button className="rc-dl-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="true" aria-expanded={open}>
            ⬇ Download
          </button>
          {open && (
            <div className="rc-dl-menu ui-card">
              <button onClick={png}>PNG image</button>
              <button onClick={exportCsv} disabled={!csv}>CSV data</button>
            </div>
          )}
        </div>
      </div>
      <div className="rc-body" ref={bodyRef}>{children}</div>
    </div>
  );
}
