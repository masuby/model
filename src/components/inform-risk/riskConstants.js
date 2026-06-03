// Single source of truth for the Tanzania INFORM 5-class risk scale.
// Thresholds + colours mirror TANZANIA_THRESHOLDS.RISK [2.5,3.4,4.3,5.9,10] and
// RISK_CLASS_LABELS in src/services/informIndicatorDefinitions.js (from
// TZ_INFORM_model.xlsx). Import from here - do not redefine the palette anywhere.

export const RISK_CLASSES = [
  { level: 'Very Low',  color: '#2E7D32', max: 2.5,  range: '0.0-2.4' },
  { level: 'Low',       color: '#8BC34A', max: 3.4,  range: '2.5-3.3' },
  { level: 'Medium',    color: '#FFC107', max: 4.3,  range: '3.4-4.2' },
  { level: 'High',      color: '#FF9800', max: 5.9,  range: '4.3-5.8' },
  { level: 'Very High', color: '#D32F2F', max: 10.1, range: '5.9-10.0' },
];

export const CLASS_LABELS = RISK_CLASSES.map((c) => c.level);
export const CLASS_COLOR = Object.fromEntries(RISK_CLASSES.map((c) => [c.level, c.color]));

export function classifyRisk(score) {
  if (score == null || Number.isNaN(score)) return { level: 'No data', color: '#cbd5e1', range: '-' };
  return RISK_CLASSES.find((c) => score < c.max) || RISK_CLASSES[RISK_CLASSES.length - 1];
}
