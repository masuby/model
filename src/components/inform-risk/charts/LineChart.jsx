/**
 * LineChart - academic / Excel-style multi-series SVG line chart with smooth
 * curves, drawn axes + tick marks, gridlines, axis titles, a legend, markers and
 * an area fill under the highlighted series. Dependency-free; explicit hex so it
 * exports cleanly to PNG.
 *
 * props: series:[{name,color,values:[number|null]}], xLabels:[string], max, height, yTitle, xTitle, emphasize
 */
import React from 'react';

const AXIS = '#94a3b8';
const GRID = '#e8edf3';
const INK = '#0a0f1a';
const MUTED = '#1e293b';
const FONT = 'Calibri, system-ui, sans-serif';

// Catmull-Rom → cubic bezier for smooth lines.
function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export default function LineChart({ series, xLabels, max = 10, height = 420, yTitle = 'Score (0-10)', xTitle = 'Region (ordered by INFORM Risk →)', emphasize }) {
  const W = 820, padL = 64, padR = 24, padT = 54, padB = 104;
  const H = height;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x0 = padL, y0 = padT + plotH;
  const n = xLabels.length || 1;
  const xOf = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yOf = (v) => padT + plotH - (Math.max(0, Math.min(max, v)) / max) * plotH;
  const yticks = [0, 2, 4, 6, 8, 10].filter((t) => t <= max);
  const step = Math.ceil(n / 18);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" style={{ fontFamily: FONT }}>
      {/* legend */}
      <g transform={`translate(${padL}, 22)`}>
        {series.map((s, i) => (
          <g key={s.name} transform={`translate(${i * 188}, 0)`}>
            <line x1="0" y1="0" x2="24" y2="0" stroke={s.color} strokeWidth="3" strokeLinecap="round" />
            <circle cx="12" cy="0" r="3.6" fill="#fff" stroke={s.color} strokeWidth="2" />
            <text x="32" y="5" fontSize="15" fontWeight="600" fill={INK}>{s.name}</text>
          </g>
        ))}
      </g>

      {/* gridlines + y ticks/labels */}
      {yticks.map((t) => (
        <g key={t}>
          <line x1={x0} y1={yOf(t)} x2={padL + plotW} y2={yOf(t)} stroke={GRID} />
          <line x1={x0 - 5} y1={yOf(t)} x2={x0} y2={yOf(t)} stroke={AXIS} />
          <text x={x0 - 11} y={yOf(t) + 4.5} textAnchor="end" fontSize="13" fill={MUTED}>{t}</text>
        </g>
      ))}

      {/* axes */}
      <line x1={x0} y1={padT} x2={x0} y2={y0} stroke={AXIS} strokeWidth="1.4" />
      <line x1={x0} y1={y0} x2={padL + plotW} y2={y0} stroke={AXIS} strokeWidth="1.4" />

      {/* x ticks + rotated labels */}
      {xLabels.map((lbl, i) => (i % step === 0 ? (
        <g key={i}>
          <line x1={xOf(i)} y1={y0} x2={xOf(i)} y2={y0 + 5} stroke={AXIS} />
          <text x={xOf(i)} y={y0 + 9} fontSize="12" fill={MUTED} textAnchor="end"
            transform={`rotate(-45, ${xOf(i)}, ${y0 + 9})`}>{lbl}</text>
        </g>
      ) : null))}

      {/* axis titles */}
      <text transform={`translate(17, ${padT + plotH / 2}) rotate(-90)`} textAnchor="middle" fontSize="14" fontWeight="600" fill={INK}>{yTitle}</text>
      <text x={padL + plotW / 2} y={H - 8} textAnchor="middle" fontSize="14" fontWeight="600" fill={INK}>{xTitle}</text>

      {/* series: smooth lines + markers (+ area under the emphasized one) */}
      {series.map((s) => {
        const em = emphasize && s.name === emphasize;
        const dim = emphasize && !em;
        const pts = s.values.map((v, i) => (v == null ? null : [xOf(i), yOf(v)])).filter(Boolean);
        if (!pts.length) return null;
        const d = smoothPath(pts);
        return (
          <g key={s.name} opacity={dim ? 0.72 : 1}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={em ? 4 : 2.6} strokeLinejoin="round" strokeLinecap="round" />
            {pts.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={em ? 4.2 : 3.2} fill="#fff" stroke={s.color} strokeWidth={em ? 2.4 : 1.8} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
