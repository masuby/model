/**
 * HAZARD AND EXPOSURE DIMENSION
 *
 * Shows all hazard types (Natural + Human) with their exposure levels
 * Based on Tanzania Country Model Template structure
 */

import React, { useState } from 'react';
import './DimensionStyles.css';

const HazardExposureDimension = ({ data }) => {
  const [expandedCategory, setExpandedCategory] = useState('natural');

  // Physical Exposure Indicators - Population and assets exposed to hazards
  const physicalExposureIndicators = [
    { id: 'totalPopulation', name: 'Total Population Exposed', value: data.exposure?.totalPopulation ?? 6.2, unit: 'Index', description: 'Proportion of total population in hazard-prone areas' },
    { id: 'urbanPopulation', name: 'Urban Population at Risk', value: data.exposure?.urbanPopulation ?? 5.8, unit: 'Index', description: 'Urban residents in areas exposed to hazards' },
    { id: 'ruralPopulation', name: 'Rural Population at Risk', value: data.exposure?.ruralPopulation ?? 6.5, unit: 'Index', description: 'Rural residents in areas exposed to hazards' },
    { id: 'agriculturalLand', name: 'Agricultural Land Exposed', value: data.exposure?.agriculturalLand ?? 5.4, unit: 'Index', description: 'Cropland and pastures in hazard zones' },
    { id: 'builtUpAreas', name: 'Built-up Areas Exposed', value: data.exposure?.builtUpAreas ?? 4.8, unit: 'Index', description: 'Settlements and infrastructure in risk zones' },
    { id: 'criticalFacilities', name: 'Critical Facilities at Risk', value: data.exposure?.criticalFacilities ?? 4.2, unit: 'Index', description: 'Hospitals, schools, emergency services in hazard areas' },
    { id: 'economicAssets', name: 'Economic Assets Exposed', value: data.exposure?.economicAssets ?? 5.0, unit: 'Index', description: 'Industrial and commercial areas in risk zones' },
    { id: 'transportNetwork', name: 'Transport Network at Risk', value: data.exposure?.transportNetwork ?? 4.5, unit: 'Index', description: 'Roads, railways, ports in hazard-prone areas' }
  ];

  // Geographical/Geological Exposure Indicators - Terrain and location-based exposure
  const geographicalExposureIndicators = [
    { id: 'coastalZone', name: 'Coastal Zone Population', value: data.exposure?.coastalZone ?? 5.6, unit: 'Index', description: 'Population in coastal areas exposed to sea-level rise, storm surge, and tsunamis' },
    { id: 'floodPlain', name: 'Flood Plain Areas', value: data.exposure?.floodPlain ?? 6.8, unit: 'Index', description: 'Low-lying areas prone to riverine and flash flooding' },
    { id: 'seismicZone', name: 'Seismic Zone Exposure', value: data.exposure?.seismicZone ?? 3.2, unit: 'Index', description: 'Population and assets in earthquake-prone geological zones' },
    { id: 'landslideTerrain', name: 'Landslide-Prone Terrain', value: data.exposure?.landslideTerrain ?? 4.1, unit: 'Index', description: 'Steep slopes and unstable terrain susceptible to landslides' },
    { id: 'riverBasin', name: 'River Basin Communities', value: data.exposure?.riverBasin ?? 5.9, unit: 'Index', description: 'Populations near major rivers and watersheds' },
    { id: 'droughtZone', name: 'Drought-Prone Zones', value: data.exposure?.droughtZone ?? 6.3, unit: 'Index', description: 'Arid and semi-arid regions vulnerable to water scarcity' },
    { id: 'volcanicZone', name: 'Volcanic Zone Proximity', value: data.exposure?.volcanicZone ?? 2.8, unit: 'Index', description: 'Communities near active or dormant volcanic areas' },
    { id: 'lowlandAreas', name: 'Low-Elevation Coastal Zones', value: data.exposure?.lowlandAreas ?? 5.2, unit: 'Index', description: 'Areas below 10m elevation susceptible to flooding and sea intrusion' }
  ];

  // Calculate physical exposure aggregate
  const physicalExposureAggregate = data.exposure?.physicalAggregate ??
    physicalExposureIndicators.reduce((sum, ind) => sum + (ind.value || 0), 0) / physicalExposureIndicators.filter(ind => ind.value !== null).length;

  // Calculate geographical exposure aggregate
  const geographicalExposureAggregate = data.exposure?.geographicalAggregate ??
    geographicalExposureIndicators.reduce((sum, ind) => sum + (ind.value || 0), 0) / geographicalExposureIndicators.filter(ind => ind.value !== null).length;

  // Combined exposure aggregate (geometric mean of physical and geographical)
  const exposureAggregate = data.exposure?.aggregate ??
    Math.sqrt(physicalExposureAggregate * geographicalExposureAggregate);

  // Natural Hazards from Excel template - expanded with additional hazard types
  const naturalHazards = [
    { id: 'heavyRainfall', name: 'Heavy Rainfall', value: data.natural?.heavyRainfall ?? 5.8, unit: 'Index' },
    { id: 'largeWaves', name: 'Large Waves', value: data.natural?.largeWaves ?? 3.2, unit: 'Index' },
    { id: 'extremeCold', name: 'Extreme Cold', value: data.natural?.extremeCold ?? 2.1, unit: 'Index' },
    { id: 'extremeHot', name: 'Extreme Hot', value: data.natural?.extremeHot ?? 5.4, unit: 'Index' },
    { id: 'strongWinds', name: 'Strong Winds', value: data.natural?.strongWinds ?? 4.2, unit: 'Index' },
    { id: 'coastalHazards', name: 'Coastal Hazards', value: data.natural.coastalHazards, unit: 'Index' },
    { id: 'drought', name: 'Drought', value: data.natural.drought, unit: 'Index' },
    { id: 'earthquake', name: 'Earthquake', value: data.natural.earthquake, unit: 'Index' },
    { id: 'environmentalDegradation', name: 'Environmental Degradation', value: data.natural.environmentalDegradation, unit: 'Index' },
    { id: 'flood', name: 'Flood', value: data.natural.flood, unit: 'Index' },
    { id: 'heatwave', name: 'Heatwave', value: data.natural.heatwave, unit: 'Index' },
    { id: 'landslide', name: 'Landslide', value: data.natural.landslide, unit: 'Index' },
    { id: 'lightning', name: 'Lightning', value: data.natural.lightning, unit: 'Index' },
    { id: 'stormsCyclone', name: 'Storms and Cyclone', value: data.natural.stormsCyclone, unit: 'Index' },
    { id: 'volcano', name: 'Volcano', value: data.natural.volcano, unit: 'Index' },
    { id: 'wildfire', name: 'Wildfire', value: data.natural.wildfire, unit: 'Index' },
    { id: 'zoonoses', name: 'Zoonoses, Plants & Pests', value: data.natural.zoonoses, unit: 'Index' }
  ];

  // Human Hazards from Excel template
  const humanHazards = [
    { id: 'conflictIntensity', name: 'Conflict Intensity', value: data.human.conflictIntensity, unit: 'Index' },
    { id: 'conflictRisk', name: 'Conflict Risk', value: data.human.conflictRisk, unit: 'Index' },
    { id: 'hazardousMaterial', name: 'Hazardous Material', value: data.human.hazardousMaterial, unit: 'Index' },
    { id: 'internalViolence', name: 'Internal Violence', value: data.human.internalViolence, unit: 'Index' },
    { id: 'vehicleAccidents', name: 'Vehicle Accidents', value: data.human.vehicleAccidents, unit: 'Index' }
  ];

  return (
    <div className="dimension-detail">
      <div className="dimension-intro">
        <h2>Hazard and Exposure</h2>
        <p className="dimension-explanation">
          <strong>Exposure</strong> answers the critical question: <em>"Who and what is in harm's way?"</em>
          It measures the population, infrastructure, and assets located in hazard-prone areas - including
          physical exposure (people, buildings, critical facilities) and geographical exposure (coastal zones,
          flood plains, seismic zones). <strong>Hazard</strong> answers: <em>"What can happen?"</em> and measures
          the probability and intensity of potentially damaging events - both natural hazards (floods, drought,
          earthquakes, storms) and human-induced hazards (conflict, accidents). Together, they determine overall risk exposure.
        </p>

        <div className="dimension-score-banner he-banner">
          <div className="banner-left">
            <div className="score-display">
              <span className="score-label">H and E Score</span>
              <span className="score-value">{data.total.toFixed(2)}</span>
              <span className="score-scale">/ 10</span>
            </div>
          </div>
          <div className="banner-right">
            <div className="sub-scores">
              <div className="sub-score">
                <span className="sub-label">Natural Hazards</span>
                <span className="sub-value">{data.natural.aggregate?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="sub-score">
                <span className="sub-label">Human Hazards</span>
                <span className="sub-value">{data.human.aggregate?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="sub-score">
                <span className="sub-label">Total Exposure</span>
                <span className="sub-value">{exposureAggregate?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="sub-score">
                <span className="sub-label">Physical</span>
                <span className="sub-value">{physicalExposureAggregate?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="sub-score">
                <span className="sub-label">Geographical</span>
                <span className="sub-value">{geographicalExposureAggregate?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hazard Categories - Natural first, then Human, then Exposure */}
      <div className="hazard-categories">
        {/* Natural Hazards */}
        <div className="hazard-category">
          <div
            className={`category-header ${expandedCategory === 'natural' ? 'expanded' : ''}`}
            onClick={() => setExpandedCategory(expandedCategory === 'natural' ? null : 'natural')}
          >
            <div className="category-title">
              <span className="category-icon">🌍</span>
              <h3>Natural Hazards</h3>
              <span className="category-count">({naturalHazards.filter(h => h.value !== null).length} indicators)</span>
            </div>
            <div className="category-score">
              <span className="aggregate-score">{data.natural.aggregate?.toFixed(2) || 'N/A'}</span>
              <span className="expand-icon">{expandedCategory === 'natural' ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedCategory === 'natural' && (
            <div className="category-indicators">
              <div className="exposure-explanation">
                <strong>What are Natural Hazards?</strong> Natural hazards are potentially damaging physical events,
                phenomena, or human activities that may cause loss of life, injury, property damage, or other health,
                social, or economic impacts. These include meteorological, hydrological, and geological events.
              </div>
              {naturalHazards.map(hazard => (
                <IndicatorCard key={hazard.id} indicator={hazard} />
              ))}
            </div>
          )}
        </div>

        {/* Human Hazards */}
        <div className="hazard-category">
          <div
            className={`category-header ${expandedCategory === 'human' ? 'expanded' : ''}`}
            onClick={() => setExpandedCategory(expandedCategory === 'human' ? null : 'human')}
          >
            <div className="category-title">
              <span className="category-icon">⚠️</span>
              <h3>Human Hazards</h3>
              <span className="category-count">({humanHazards.filter(h => h.value !== null).length} indicators)</span>
            </div>
            <div className="category-score">
              <span className="aggregate-score">{data.human.aggregate?.toFixed(2) || 'N/A'}</span>
              <span className="expand-icon">{expandedCategory === 'human' ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedCategory === 'human' && (
            <div className="category-indicators">
              <div className="exposure-explanation">
                <strong>What are Human Hazards?</strong> Human-induced hazards are events or conditions that result
                from human activities, including conflict, violence, industrial accidents, and transportation incidents.
                These can cause significant harm to populations and infrastructure.
              </div>
              {humanHazards.map(hazard => (
                <IndicatorCard key={hazard.id} indicator={hazard} />
              ))}
            </div>
          )}
        </div>

        {/* Physical Exposure - Population and Assets */}
        <div className="hazard-category">
          <div
            className={`category-header ${expandedCategory === 'physical' ? 'expanded' : ''}`}
            onClick={() => setExpandedCategory(expandedCategory === 'physical' ? null : 'physical')}
          >
            <div className="category-title">
              <span className="category-icon">👥</span>
              <h3>Physical Exposure</h3>
              <span className="category-count">({physicalExposureIndicators.filter(e => e.value !== null).length} indicators)</span>
            </div>
            <div className="category-score">
              <span className="aggregate-score">{physicalExposureAggregate?.toFixed(2) || 'N/A'}</span>
              <span className="expand-icon">{expandedCategory === 'physical' ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedCategory === 'physical' && (
            <div className="category-indicators">
              <div className="exposure-explanation">
                <strong>What is Physical Exposure?</strong> Physical exposure measures the population, built assets,
                and infrastructure located in hazard-prone areas. This includes people, buildings, and critical facilities.
              </div>
              {physicalExposureIndicators.map(indicator => (
                <ExposureIndicatorCard key={indicator.id} indicator={indicator} />
              ))}
            </div>
          )}
        </div>

        {/* Geographical/Geological Exposure - Terrain and Location */}
        <div className="hazard-category">
          <div
            className={`category-header ${expandedCategory === 'geographical' ? 'expanded' : ''}`}
            onClick={() => setExpandedCategory(expandedCategory === 'geographical' ? null : 'geographical')}
          >
            <div className="category-title">
              <span className="category-icon">🗺️</span>
              <h3>Geographical Exposure</h3>
              <span className="category-count">({geographicalExposureIndicators.filter(e => e.value !== null).length} indicators)</span>
            </div>
            <div className="category-score">
              <span className="aggregate-score">{geographicalExposureAggregate?.toFixed(2) || 'N/A'}</span>
              <span className="expand-icon">{expandedCategory === 'geographical' ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedCategory === 'geographical' && (
            <div className="category-indicators">
              <div className="exposure-explanation">
                <strong>What is Geographical Exposure?</strong> Geographical exposure captures terrain and location-based
                vulnerabilities - coastal zones, flood plains, low-lying areas, seismic zones, and other geological factors
                that determine where hazards are most likely to impact.
              </div>
              {geographicalExposureIndicators.map(indicator => (
                <ExposureIndicatorCard key={indicator.id} indicator={indicator} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overview Note */}
      <div className="methodology-note">
        <h4>📊 Hazard and Exposure Overview</h4>
        <p>
          <strong>Hazard and Exposure</strong> combines four critical components:
        </p>
        <ul>
          <li><strong>Natural Hazards</strong> - Meteorological, hydrological, and geological events (heavy rainfall, floods, drought, earthquakes, extreme temperatures, strong winds)</li>
          <li><strong>Human Hazards</strong> - Events resulting from human activities (conflict, violence, industrial accidents, transportation incidents)</li>
          <li><strong>Physical Exposure</strong> - Who and what is in harm's way (population, assets, infrastructure in hazard zones)</li>
          <li><strong>Geographical Exposure</strong> - Where hazards are most likely to impact (coastal zones, flood plains, seismic zones)</li>
        </ul>
        <p>
          High exposure without hazards creates no risk. Similarly, severe hazards with no exposed population or assets
          also create no risk. Risk emerges when hazards and exposure intersect.
        </p>
        <div className="formula-note">
          H and E = max(Natural Hazards, Human Hazards) × √(Physical Exposure × Geographical Exposure)
        </div>
      </div>
    </div>
  );
};

/**
 * Indicator Card Component
 */
const IndicatorCard = ({ indicator }) => {
  const hasData = indicator.value !== null && indicator.value !== undefined;
  const classification = hasData ? getRiskClassification(indicator.value) : null;

  return (
    <div className={`indicator-card ${!hasData ? 'no-data' : ''}`}>
      <div className="indicator-header">
        <div className="indicator-name">{indicator.name}</div>
        {hasData ? (
          <div className="indicator-score" style={{ color: classification.color }}>
            {indicator.value.toFixed(2)}
          </div>
        ) : (
          <div className="indicator-no-data">No Data</div>
        )}
      </div>

      {hasData && (
        <>
          <div className="indicator-bar">
            <div
              className="indicator-bar-fill"
              style={{
                width: `${(indicator.value / 10) * 100}%`,
                backgroundColor: classification.color
              }}
            />
          </div>

          <div className="indicator-classification">
            <span className="classification-level">{classification.level}</span>
            <span className="classification-range">{classification.range}</span>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Exposure Indicator Card Component - With description
 */
const ExposureIndicatorCard = ({ indicator }) => {
  const hasData = indicator.value !== null && indicator.value !== undefined;
  const classification = hasData ? getRiskClassification(indicator.value) : null;

  return (
    <div className={`indicator-card detailed ${!hasData ? 'no-data' : ''}`}>
      <div className="indicator-header">
        <div className="indicator-name">{indicator.name}</div>
        {hasData ? (
          <div className="indicator-score" style={{ color: classification.color }}>
            {indicator.value.toFixed(2)}
          </div>
        ) : (
          <div className="indicator-no-data">No Data</div>
        )}
      </div>

      {indicator.description && (
        <div className="indicator-description">{indicator.description}</div>
      )}

      {hasData && (
        <>
          <div className="indicator-bar">
            <div
              className="indicator-bar-fill"
              style={{
                width: `${(indicator.value / 10) * 100}%`,
                backgroundColor: classification.color
              }}
            />
          </div>

          <div className="indicator-classification">
            <span className="classification-level">{classification.level}</span>
            <span className="classification-range">{classification.range}</span>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Helper: Get risk classification
 */
function getRiskClassification(score) {
  if (score >= 0 && score < 2) return { level: 'Very Low', color: '#43A047', range: '0.0 - 1.9' };
  if (score >= 2 && score < 3.5) return { level: 'Low', color: '#8BC34A', range: '2.0 - 3.4' };
  if (score >= 3.5 && score < 5) return { level: 'Medium', color: '#FFC107', range: '3.5 - 4.9' };
  if (score >= 5 && score < 6.5) return { level: 'High', color: '#FF9800', range: '5.0 - 6.4' };
  return { level: 'Very High', color: '#F44336', range: '6.5 - 10.0' };
}

export default HazardExposureDimension;
