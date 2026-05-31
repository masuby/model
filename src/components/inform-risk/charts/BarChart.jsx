/**
 * BarChart — academic / Excel-style SVG bar chart (vertical column or horizontal
 * bar): drawn axes with tick marks, gridlines, value labels. Explicit hex so it
 * exports cleanly to PNG. data: [{ label, sub?, value, color }].
 */
import React from 'react';

const AXIS = '#94a3b8';
const GRID = '#edf1f6';
const INK = '#0a0f1a';
const MUTED = '#334155';
const FONT = 'Calibri, system-ui, sans-serif';

export default function BarChart({ data, horizontal = false, max = 10, unit = '', height }) {
  if (horizontal) {
    const rowH = 28, padL = 140, padR = 46, padT = 10, padB = 26, W = 540;
    const H = padT + padB + data.length * rowH;
    const x0 = padL, plotW = W - padL - padR;
    const xticks = [0, max / 2, max];
    const xOf = (v) => x0 + (Math.max(0, v) / max) * plotW;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height || H} role="img" style={{ fontFamily: FONT }}>
        {/* vertical gridlines + x ticks */}
        {xticks.map((t) => (
          <g key={t}>
            <line x1={xOf(t)} y1={padT} x2={xOf(t)} y2={H - padB} stroke={GRID} />
            <line x1={xOf(t)} y1={H - padB} x2={xOf(t)} y2={H - padB + 4} stroke={AXIS} />
            <text x={xOf(t)} y={H - padB + 15} textAnchor="middle" fontSize="10" fill={MUTED}>{t}</text>
          </g>
        ))}
        {/* axes */}
        <line x1={x0} y1={padT} x2={x0} y2={H - padB} stroke={AXIS} strokeWidth="1.25" />
        <line x1={x0} y1={H - padB} x2={W - padR} y2={H - padB} stroke={AXIS} strokeWidth="1.25" />
        {data.map((d, i) => {
          const y = padT + i * rowH;
          const w = Math.max(1, (Math.max(0, d.value ?? 0) / max) * plotW);
          return (
            <g key={i}>
              <text x={x0 - 8} y={y + rowH / 2 - 2} textAnchor="end" fontSize="12" fontWeight="600" fill={INK}>{d.label}</text>
              {d.sub && <text x={x0 - 8} y={y + rowH / 2 + 10} textAnchor="end" fontSize="9.5" fill={MUTED}>{d.sub}</text>}
              <rect x={x0} y={y + 6} width={w} height={rowH - 13} fill={d.color} />
              <text x={x0 + w + 6} y={y + rowH / 2 + 2} fontSize="12" fontWeight="700" fill={INK}>
                {d.value == null ? '—' : Math.round(d.value * 10) / 10}{unit}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // vertical column chart
  const W = 540, H = 260, padL = 40, padR = 14, padT = 22, padB = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x0 = padL, y0 = padT + plotH;
  const n = data.length, band = plotW / n, bw = band * 0.52;
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  const yOf = (v) => padT + plotH - (Math.max(0, v) / max) * plotH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height || H} role="img" style={{ fontFamily: FONT }}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x0} y1={yOf(t)} x2={W - padR} y2={yOf(t)} stroke={GRID} />
          <line x1={x0 - 4} y1={yOf(t)} x2={x0} y2={yOf(t)} stroke={AXIS} />
          <text x={x0 - 7} y={yOf(t) + 3.5} textAnchor="end" fontSize="10" fill={MUTED}>{Math.round(t)}</text>
        </g>
      ))}
      {/* axes */}
      <line x1={x0} y1={padT} x2={x0} y2={y0} stroke={AXIS} strokeWidth="1.25" />
      <line x1={x0} y1={y0} x2={W - padR} y2={y0} stroke={AXIS} strokeWidth="1.25" />
      {data.map((d, i) => {
        const x = padL + i * band + (band - bw) / 2;
        const y = yOf(d.value ?? 0);
        return (
          <g key={i}>
            <line x1={x + bw / 2} y1={y0} x2={x + bw / 2} y2={y0 + 4} stroke={AXIS} />
            <rect x={x} y={y} width={bw} height={y0 - y} fill={d.color} />
            <text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize="12" fontWeight="700" fill={INK}>{d.value}</text>
            <text x={x + bw / 2} y={y0 + 15} textAnchor="middle" fontSize="10" fill={MUTED}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
