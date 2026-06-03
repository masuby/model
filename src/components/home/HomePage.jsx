/**
 * HomePage - the landing page for INFORM Tanzania. Introduces the platform and
 * routes to the three modules. Clean, flat (no gradients), on the design system.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NATIONAL, COUNCIL_UNITS, REGION_UNITS, DIMENSION_TREE, DIM_KEYS, classifyRisk, round1 } from '../inform-risk/riskModel';
import './HomePage.css';

const MODULES = [
  {
    icon: '', title: 'Education', to: '/education', cta: 'Start the course',
    desc: 'A guided course on the INFORM framework - hazard, exposure, vulnerability, coping capacity and risk - with a short quiz after each section.',
  },
  {
    icon: '', title: 'Risk', to: '/risk', cta: 'Open the explorer',
    desc: "Explore Tanzania's INFORM Risk at council, region and national level - by dimension or any single indicator - on the map, ranked tables and downloadable charts.",
  },
  {
    icon: '', title: 'Severity', to: '/severity', cta: 'Open the calculator',
    desc: 'Measure how severe a crisis is with the IASC INFORM Severity Index v6 - its impact, the conditions of affected people, and response complexity.',
  },
];

// Counts come straight from the model so the landing page can never drift from the
// real NBS-2022 structure (195 councils → 31 regions) or claim indicators it doesn't have.
const INDICATOR_COUNT = DIM_KEYS.reduce(
  (n, dim) => n + DIMENSION_TREE[dim].components.reduce((m, c) => m + c.indicators.length, 0),
  0,
);
const FACTS = [
  { n: String(DIM_KEYS.length), label: 'INFORM dimensions' },
  { n: String(COUNCIL_UNITS.length), label: 'councils (LGAs)' },
  { n: String(REGION_UNITS.length), label: 'regions (ADM1)' },
  { n: String(INDICATOR_COUNT), label: 'indicators' },
];

export default function HomePage() {
  const cls = classifyRisk(NATIONAL.risk);
  return (
    <div className="home">
      <section className="home-hero ui-card">
        <div className="home-hero-main">
          <div className="ui-eyebrow">INFORM Subnational · Tanzania</div>
          <h1 className="home-title">Tanzania Index for Risk Management</h1>
          <p className="home-lead">
            Understand disaster risk, explore it across every council, and measure the
            severity of crises - grounded in the global INFORM methodology.
          </p>
          <div className="home-cta">
            <NavLink to="/education" className="home-btn home-btn-primary">Start the course</NavLink>
            <NavLink to="/risk" className="home-btn">Explore the map</NavLink>
          </div>
        </div>
        <div className="home-hero-stat" style={{ borderColor: cls.color }}>
          <div className="home-stat-num" style={{ color: cls.color }}>{round1(NATIONAL.risk)}</div>
          <span className="ui-badge" style={{ background: cls.color }}>{cls.level} Risk</span>
          <div className="home-stat-label">National INFORM Risk</div>
        </div>
      </section>

      <section className="home-modules">
        {MODULES.map((m) => (
          <NavLink key={m.title} to={m.to} className="home-mod ui-card ui-card-pad">
            <h2 className="ui-h2">{m.title}</h2>
            <p className="home-mod-desc">{m.desc}</p>
            <span className="home-mod-link">{m.cta}</span>
          </NavLink>
        ))}
      </section>

      <section className="home-facts ui-card ui-card-pad">
        {FACTS.map((f) => (
          <div key={f.label} className="home-fact">
            <div className="home-fact-num">{f.n}</div>
            <div className="home-fact-label">{f.label}</div>
          </div>
        ))}
      </section>

      <p className="home-foot ui-muted">
        Source: Tanzania INFORM Country Model (INFORM methodology). An educational and operational tool - not an official emergency alert system.
      </p>
    </div>
  );
}
