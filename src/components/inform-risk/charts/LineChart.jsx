/**
 * LineChart — academic / Excel-style multi-series SVG line chart:
 * drawn x & y axes with tick marks, light gridlines, axis titles, a legend and
 * data markers. Dependency-free; explicit hex so it exports cleanly to PNG.
 *
 * props:
 *   series:  [{ name, color, values:[number|null] }]
 *   xLabels: [string]
 *   max, height, yTitle, xTitle
 */
import React from 'react';

const AXIS = '#94a3b8';
const GRID = '#edf1f6';
const INK = '#0f172a';
const MUTED = '#475569';

export default function LineChart({ series, xLabels, max = 10, height = 360, yTitle = 'Score (0–10)', xTitle = 'Region (ordered by INFORM Risk →)' }) {
  const W = 780, padL = 56, padR = 22, padT = 46, padB = 92;
  const H = height;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x0 = padL, y0 = padT + plotH; // axis origin (bottom-left)
  const n = xLabels.length || 1;
  const xOf = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yOf = (v) => padT + plotH - (Math.max(0, Math.min(max, v)) / max) * plotH;
  const yticks = [0, 2, 4, 6, 8, 10].filter((t) => t <= max);
  const step = Math.ceil(n / 18);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" style={{ fontFamily: 'Calibri, system-ui, sans-serif' }}>
      {/* legend (top, centered) */}
      <g transform={`translate(${padL}, 20)`} fontFamily="system-ui, sans-serif">
        {series.map((s, i) => (
          <g key={s.name} transform={`translate(${i * 168}, 0)`}>
            <line x1="0" y1="0" x2="20" y2="0" stroke={s.color} strokeWidth="2.5" />
            <circle cx="10" cy="0" r="3" fill="#fff" stroke={s.color} strokeWidth="1.5" />
            <text x="26" y="4" fontSize="12" fill={INK}>{s.name}</text>
          </g>
        ))}
      </g>

      {/* horizontal gridlines + y ticks/labels */}
      {yticks.map((t) => (
        <g key={t}>
          <line x1={x0} y1={yOf(t)} x2={padL + plotW} y2={yOf(t)} stroke={GRID} />
          <line x1={x0 - 4} y1={yOf(t)} x2={x0} y2={yOf(t)} stroke={AXIS} />
          <text x={x0 - 9} y={yOf(t) + 3.5} textAnchor="end" fontSize="11" fill={MUTED} fontFamily="system-ui, sans-serif">{t}</text>
        </g>
      ))}

      {/* axes */}
      <line x1={x0} y1={padT} x2={x0} y2={y0} stroke={AXIS} strokeWidth="1.25" />
      <line x1={x0} y1={y0} x2={padL + plotW} y2={y0} stroke={AXIS} strokeWidth="1.25" />

      {/* x ticks + rotated labels */}
      {xLabels.map((lbl, i) => (i % step === 0 ? (
        <g key={i}>
          <line x1={xOf(i)} y1={y0} x2={xOf(i)} y2={y0 + 4} stroke={AXIS} />
          <text x={xOf(i)} y={y0 + 8} fontSize="9.5" fill={MUTED} textAnchor="end"
            transform={`rotate(-45, ${xOf(i)}, ${y0 + 8})`} fontFamily="system-ui, sans-serif">{lbl}</text>
        </g>
      ) : null))}

      {/* axis titles */}
      <text transform={`translate(15, ${padT + plotH / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill={INK} fontFamily="system-ui, sans-serif">{yTitle}</text>
      <text x={padL + plotW / 2} y={H - 6} textAnchor="middle" fontSize="11" fill={INK} fontFamily="system-ui, sans-serif">{xTitle}</text>

      {/* series lines + markers */}
      {series.map((s) => {
        const pts = s.values.map((v, i) => (v == null ? null : `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`)).filter(Boolean).join(' ');
        return (
          <g key={s.name}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) => (v == null ? null : (
              <circle key={i} cx={xOf(i)} cy={yOf(v)} r="2.6" fill="#fff" stroke={s.color} strokeWidth="1.4" />
            )))}
          </g>
        );
      })}
    </svg>
  );
}
