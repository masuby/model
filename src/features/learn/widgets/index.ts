import type * as React from 'react';
import type { WidgetId } from '../course';
import CopingWhatIf from './CopingWhatIf';
import DecisionChecklist from './DecisionChecklist';
import ExposureCompare from './ExposureCompare';
import HazardHotspots from './HazardHotspots';
import RiskPlayground from './RiskPlayground';
import SeverityCalculator from './SeverityCalculator';
import VulnerabilityProfile from './VulnerabilityProfile';

/** Live widgets embeddable from lesson content (`{ "type": "widget", "id": … }`). */
export const WIDGETS: Record<WidgetId, React.ComponentType> = {
  hazardHotspots: HazardHotspots,
  exposureCompare: ExposureCompare,
  vulnerabilityProfile: VulnerabilityProfile,
  copingWhatIf: CopingWhatIf,
  riskPlayground: RiskPlayground,
  severityCalculator: SeverityCalculator,
  decisionChecklist: DecisionChecklist,
};
