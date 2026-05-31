/**
 * LineChart — dependency-free SVG line chart. Used for the "profile" curve of
 * all districts ranked by the active metric, with INFORM class bands behind it.
 */
import React from 'react';

const INK = '#0f172a';
const MUTED = '#64748b';
const GRID = '#e6eaf0';
const PRIMARY = '#1f6feb';

// Tanzania INFORM bands (upper bounds) + colours.
const BANDS = [
  { to: 2.5, color: '#2E7D32' },
  { to: 3.4, color: '#8BC34A' },
  { to: 4.3, color: '#FFC107' },
  { to: 5.9, color: '#FF9800' },
  { to: 10, color: '#D32F2F' },
];

export default function LineChart({ values, max = 10, height, xLabel = 'District rank (high → low)' }) {
  const W = 520, H = 240, padL = 34, padR = 12, padT = 14, padB = 34;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = values.length || 1;
  const xOf = (i) => padL + (i / Math.max(1, n - 1)) * plotW;
  const yOf = (v) => padT + plotH - (Math.max(0, Math.min(max, v)) / max) * plotH;

  const pts = values.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
  const area = `${padL},${padT + plotH} ${pts} ${xOf(n - 1)},${padT + plotH}`;
  const ticks = [0, max / 2, max];

  let prev = 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height || H} role="img" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* class bands */}
      {BANDS.map((b, i) => {
        const yTop = yOf(b.to), yBot = yOf(prev), h = yBot - yTop; prev = b.to;
        return <rect key={i} x={padL} y={yTop} width={plotW} height={Math.max(0, h)} fill={b.color} opacity="0.1" />;
      })}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={yOf(t)} x2={W - padR} y2={yOf(t)} stroke={GRID} />
          <text x={padL - 6} y={yOf(t) + 3} textAnchor="end" fontSize="10" fill={MUTED}>{t}</text>
        </g>
      ))}
      <polygon points={area} fill={PRIMARY} opacity="0.08" />
      <polyline points={pts} fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <text x={padL + plotW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill={MUTED}>{xLabel}</text>
      <text x={padL + plotW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill={INK} opacity="0" />
    </svg>
  );
}
