import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { classify, CLASS_COLORS, CLASS_KEYS, THRESHOLDS, type Scale } from '@/engine/risk/classes';
import { cn, formatScore } from '@/lib/utils';

/**
 * Semicircular gauge: the arc is segmented by the scale's own INFORM class thresholds, and a needle
 * points at the score. Used for headline risk and dimension scores.
 */
export function ScoreGauge({
  value,
  scale = 'risk',
  size = 200,
  label,
  max = 10,
  className,
}: {
  value: number | null | undefined;
  scale?: Scale;
  size?: number;
  label?: string;
  max?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const c = classify(value, scale);
  const w = size;
  const h = size * 0.62;
  const r = size * 0.42;
  const cx = w / 2;
  const cy = size * 0.52;
  const stroke = size * 0.085;
  const bounds = [0, ...THRESHOLDS[scale], max];
  const angle = (v: number) => Math.PI * (1 - Math.max(0, Math.min(max, v)) / max);
  const pt = (a: number, rr = r) => [cx + rr * Math.cos(a), cy - rr * Math.sin(a)] as const;
  const arc = (from: number, to: number) => {
    const [x1, y1] = pt(angle(from));
    const [x2, y2] = pt(angle(to));
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const v = typeof value === 'number' ? value : 0;
  const needle = pt(angle(v), r - stroke * 0.2);

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)} style={{ width: w }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label ?? ''} ${formatScore(value)} ${c ? t(`classes.${c.key}`) : ''}`}>
        {CLASS_KEYS.map((k, i) => (
          <path key={k} d={arc(bounds[i] + (i ? 0.06 : 0), bounds[i + 1] - (i < 4 ? 0.06 : 0))} stroke={CLASS_COLORS[k]} strokeWidth={stroke} fill="none" strokeLinecap="butt" opacity={c && c.index !== i ? 0.35 : 1} />
        ))}
        {typeof value === 'number' && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <line x1={cx} y1={cy} x2={needle[0]} y2={needle[1]} stroke="currentColor" strokeWidth={size * 0.018} strokeLinecap="round" className="text-foreground" />
            <circle cx={cx} cy={cy} r={size * 0.035} className="fill-foreground" />
          </motion.g>
        )}
      </svg>
      <div className="-mt-[6%] flex flex-col items-center">
        <span className="num font-display leading-none font-extrabold tracking-tight" style={{ fontSize: size * 0.2 }}>
          {formatScore(value)}
        </span>
        {label && <span className="mt-1 text-xs font-medium text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
