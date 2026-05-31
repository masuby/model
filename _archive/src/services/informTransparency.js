// INFORM Transparency data: formula reference, data-flow pipeline, sheet linkages.
// Ported from the retired Go backend (inform-system/internal/formula/formula.go).
// Drives the transparency UI so users can audit how risk scores are produced.

export const FORMULA_DOCS = [
  {
    name: 'INFORM Risk Score',
    formula: 'RISK = HAZARD^(1/3) × VULNERABILITY^(1/3) × LACK_OF_COPING_CAPACITY^(1/3)',
    description:
      'The final INFORM Risk score is the cubic geometric mean of the three dimensions, so a high score in any one dimension lifts the overall result.',
    inputs: ['Hazard Total (0-10)', 'Vulnerability Total (0-10)', 'Lack of Coping Capacity (0-10)'],
    output: 'Risk Score (0-10)',
    example: 'RISK = 5.2^(1/3) × 4.8^(1/3) × 6.1^(1/3) = 1.73 × 1.69 × 1.83 = 5.3',
  },
  {
    name: 'Dimension Score (Adjusted Geometric Mean)',
    formula: '(10 - GEOMEAN(((10-CAT1)/10×9+1), ((10-CAT2)/10×9+1))) / 9 × 10',
    description:
      'Hazard, Vulnerability and Coping Capacity dimensions use an adjusted geometric mean so the 0-10 scale is preserved while both contributing categories carry weight.',
    inputs: ['Category 1 Score (0-10)', 'Category 2 Score (0-10)'],
    output: 'Dimension Score (0-10)',
    example:
      'For Natural=6.5, Human=3.2: adj1=((10-6.5)/10×9+1)=4.15, adj2=((10-3.2)/10×9+1)=7.12, GEOMEAN=5.44, Result=(10-5.44)/9×10=5.1',
  },
  {
    name: 'Category Score (Arithmetic Average)',
    formula: 'CATEGORY = AVERAGE(Component1, Component2, ..., ComponentN)',
    description:
      'Default category aggregation is the arithmetic mean of its components, giving each component equal weight.',
    inputs: ['Component scores (0-10 each)'],
    output: 'Category Score (0-10)',
    example: 'For components [5.2, 6.1, 4.8]: AVERAGE = (5.2 + 6.1 + 4.8) / 3 = 5.4',
  },
  {
    name: 'Min-Max Normalization',
    formula: 'NORMALIZED = ((VALUE - MIN) / (MAX - MIN)) × 10',
    description:
      'Raw indicator values are rescaled to 0-10 using min-max normalization against theoretical or empirical bounds.',
    inputs: ['Raw Value', 'Minimum Value', 'Maximum Value'],
    output: 'Normalized Score (0-10)',
    example: 'For HDI=0.54 with min=0.2, max=0.95: NORMALIZED = ((0.54-0.2)/(0.95-0.2))×10 = 4.5',
  },
  {
    name: 'Log Transformation',
    formula: 'TRANSFORMED = LN(VALUE + 1)',
    description:
      'Highly skewed inputs (population counts, fatalities) are log-transformed before normalization to dampen extreme values.',
    inputs: ['Raw Value (positive)'],
    output: 'Transformed Value',
    example: 'For population=500000: LN(500001) = 13.12',
  },
  {
    name: 'Lack of Coping Capacity',
    formula: 'LOCC = 10 - COPING_CAPACITY',
    description:
      'Coping Capacity is inverted (higher capacity → lower risk) to produce Lack of Coping Capacity for the risk formula.',
    inputs: ['Coping Capacity (0-10)'],
    output: 'Lack of Coping Capacity (0-10)',
    example: 'If Coping Capacity = 6.2, then LOCC = 10 - 6.2 = 3.8',
  },
  {
    name: 'Outlier Detection (IQR Method)',
    formula: 'Lower Bound = Q1 - 1.5×IQR, Upper Bound = Q3 + 1.5×IQR',
    description:
      'Outliers are detected with the Interquartile Range method and clamped so extreme values do not skew normalization.',
    inputs: ['Dataset values', 'Q1 (25th percentile)', 'Q3 (75th percentile)'],
    output: 'Lower and Upper bounds',
    example: 'For Q1=2.5, Q3=7.5, IQR=5.0: Lower=2.5-7.5=-5, Upper=7.5+7.5=15',
  },
  {
    name: 'Risk Classification',
    formula:
      "IF RISK<2 THEN 'Very Low', IF RISK<3.5 THEN 'Low', IF RISK<5 THEN 'Medium', IF RISK<6.5 THEN 'High', ELSE 'Very High'",
    description: 'Numeric risk scores map to five INFORM risk classes via fixed thresholds.',
    inputs: ['Risk Score (0-10)'],
    output: 'Risk Class (Very Low / Low / Medium / High / Very High)',
    example: "Risk Score 5.3 → 'High' (5.0 ≤ 5.3 < 6.5)",
  },
]

export const DATA_FLOW_STEPS = [
  {
    step: 1,
    name: 'Raw Data Collection',
    description: 'Data is gathered from field surveys, satellite imagery, and statistical offices.',
    input: 'Original measurements in various units',
    output: 'Raw indicator values',
    sheets: ['Data Entry Forms', 'Indicator Data'],
  },
  {
    step: 2,
    name: 'Data Validation',
    description: 'Entries are checked for completeness, format, and plausibility.',
    input: 'Raw indicator values',
    output: 'Validated values with status flags',
    sheets: ['Indicator Data', 'Validation Rules'],
  },
  {
    step: 3,
    name: 'Outlier Detection',
    description: 'Statistical outliers are identified via IQR and clamped.',
    input: 'Validated values',
    output: 'Outlier-adjusted values',
    sheets: ['Indicator Processing - 12'],
  },
  {
    step: 4,
    name: 'Transformation',
    description: 'Log or sqrt transforms are applied to skewed distributions.',
    input: 'Outlier-adjusted values',
    output: 'Transformed values',
    sheets: ['Indicator Processing - 12'],
  },
  {
    step: 5,
    name: 'Normalization',
    description: 'Values are rescaled to 0-10 using min-max normalization.',
    input: 'Transformed values',
    output: 'Normalized scores (0-10)',
    sheets: ['Indicator Processing - 22', 'Indicator - Processed'],
  },
  {
    step: 6,
    name: 'Component Aggregation',
    description: 'Indicators are aggregated to component scores using arithmetic mean.',
    input: 'Normalized scores',
    output: 'Component scores (0-10)',
    sheets: ['INFORM SADC 2024'],
  },
  {
    step: 7,
    name: 'Category Aggregation',
    description: 'Components are aggregated to category scores using arithmetic mean.',
    input: 'Component scores',
    output: 'Category scores (0-10)',
    sheets: ['INFORM SADC 2024'],
  },
  {
    step: 8,
    name: 'Dimension Calculation',
    description: 'Categories are combined into dimensions via an adjusted geometric mean.',
    input: 'Category scores',
    output: 'Dimension scores (0-10)',
    sheets: ['INFORM SADC 2024'],
  },
  {
    step: 9,
    name: 'Risk Calculation',
    description: 'Final INFORM Risk is produced from the three dimensions.',
    input: 'Dimension scores',
    output: 'INFORM Risk Score (0-10)',
    sheets: ['INFORM SADC 2024'],
  },
  {
    step: 10,
    name: 'Classification & Visualization',
    description: 'Scores are classified into risk tiers and rendered on maps and dashboards.',
    input: 'INFORM Risk Score',
    output: 'Risk Class, Maps, Reports',
    sheets: ['Dashboard', 'Maps'],
  },
]

export const SHEET_LINKAGES = [
  { source: 'Data Entry Forms', target: 'Indicator Data', linkType: 'data_input', description: 'User-entered data flows to indicator storage.' },
  { source: 'Metadata', target: 'Indicator Data', linkType: 'reference', description: 'Indicator definitions and validation rules.' },
  { source: 'Indicator Data', target: 'Indicator Processing - 12', linkType: 'data_flow', description: 'Raw values feed outlier detection.' },
  { source: 'Indicator Processing - 12', target: 'Indicator Processing - 22', linkType: 'data_flow', description: 'Outlier-adjusted values feed transformation.' },
  { source: 'Indicator Processing - 22', target: 'Indicator - Processed', linkType: 'data_flow', description: 'Transformed values feed normalization.' },
  { source: 'Indicator - Processed', target: 'INFORM SADC 2024', linkType: 'aggregation', description: 'Normalized values feed dimension calculation.' },
  { source: 'INFORM SADC 2024', target: 'Dashboard', linkType: 'visualization', description: 'Risk scores feed the dashboard display.' },
  { source: 'INFORM SADC 2024', target: 'Maps', linkType: 'visualization', description: 'Risk scores feed geographic visualization.' },
]
