/**
 * INFORM INDICATORS TAB
 * View and manage INFORM risk indicators
 */

import React, { useState } from 'react';
import { USER_ROLES } from '../../../services/authService';
import './TabStyles.css';

function INFORMIndicators({ user, riskData }) {
  const [expandedCategory, setExpandedCategory] = useState('hazard');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndicator, setEditingIndicator] = useState(null);

  const canEdit = user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.PMO_OFFICER;

  // INFORM indicator structure
  const indicatorStructure = {
    hazard: {
      name: 'Hazard & Exposure',
      color: '#ef4444',
      icon: '⚠️',
      weight: 0.33,
      categories: [
        {
          name: 'Natural',
          indicators: [
            { id: 'drought', name: 'Drought Probability', value: 5.2, source: 'TMA', unit: '0-10' },
            { id: 'flood', name: 'Flood Probability', value: 6.8, source: 'TMA/MOW', unit: '0-10' },
            { id: 'earthquake', name: 'Earthquake Intensity', value: 3.1, source: 'GST', unit: '0-10' },
            { id: 'cyclone', name: 'Tropical Cyclone', value: 2.5, source: 'TMA', unit: '0-10' }
          ]
        },
        {
          name: 'Human',
          indicators: [
            { id: 'conflict', name: 'Current Conflict', value: 1.2, source: 'Internal', unit: '0-10' },
            { id: 'violence', name: 'Projected Violence', value: 1.8, source: 'Internal', unit: '0-10' }
          ]
        }
      ]
    },
    vulnerability: {
      name: 'Vulnerability',
      color: '#f59e0b',
      icon: '🏚️',
      weight: 0.33,
      categories: [
        {
          name: 'Socio-Economic',
          indicators: [
            { id: 'poverty', name: 'Development & Deprivation', value: 4.5, source: 'NBS', unit: '0-10' },
            { id: 'inequality', name: 'Inequality', value: 5.1, source: 'NBS', unit: '0-10' },
            { id: 'aid_dependency', name: 'Aid Dependency', value: 3.8, source: 'BoT', unit: '0-10' }
          ]
        },
        {
          name: 'Vulnerable Groups',
          indicators: [
            { id: 'uprooted', name: 'Uprooted People', value: 2.3, source: 'UNHCR', unit: '0-10' },
            { id: 'health', name: 'Health Conditions', value: 4.9, source: 'MOH', unit: '0-10' },
            { id: 'children', name: 'Children U5', value: 5.6, source: 'NBS', unit: '0-10' },
            { id: 'food_security', name: 'Food Security', value: 4.2, source: 'MOA', unit: '0-10' }
          ]
        }
      ]
    },
    coping: {
      name: 'Lack of Coping Capacity',
      color: '#3b82f6',
      icon: '🛡️',
      weight: 0.33,
      categories: [
        {
          name: 'Infrastructure',
          indicators: [
            { id: 'comm_infra', name: 'Communication', value: 4.1, source: 'TCRA', unit: '0-10' },
            { id: 'health_infra', name: 'Physical Health', value: 5.3, source: 'MOH', unit: '0-10' },
            { id: 'econ_infra', name: 'Access to Healthcare', value: 4.7, source: 'MOH', unit: '0-10' }
          ]
        },
        {
          name: 'Institutional',
          indicators: [
            { id: 'drr', name: 'DRR Capacity', value: 3.9, source: 'PMO-DMD', unit: '0-10' },
            { id: 'governance', name: 'Governance', value: 4.4, source: 'Internal', unit: '0-10' }
          ]
        }
      ]
    }
  };

  const calculateDimensionScore = (dimension) => {
    const categories = dimension.categories;
    let sum = 0;
    let count = 0;
    categories.forEach(cat => {
      cat.indicators.forEach(ind => {
        sum += ind.value;
        count++;
      });
    });
    return count > 0 ? (sum / count).toFixed(2) : 0;
  };

  const calculateOverallRisk = () => {
    const hazard = parseFloat(calculateDimensionScore(indicatorStructure.hazard));
    const vuln = parseFloat(calculateDimensionScore(indicatorStructure.vulnerability));
    const coping = parseFloat(calculateDimensionScore(indicatorStructure.coping));
    return Math.pow(hazard * vuln * coping, 1/3).toFixed(2);
  };

  const handleEditIndicator = (indicator) => {
    if (canEdit) {
      setEditingIndicator(indicator);
    }
  };

  const handleSaveIndicator = () => {
    alert(`Indicator ${editingIndicator.name} updated!`);
    setEditingIndicator(null);
  };

  const filterIndicators = (categories) => {
    if (!searchTerm) return categories;
    return categories.map(cat => ({
      ...cat,
      indicators: cat.indicators.filter(ind =>
        ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ind.source.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(cat => cat.indicators.length > 0);
  };

  return (
    <div className="tab-content inform-indicators">
      <div className="tab-header">
        <h3>INFORM Risk Indicators</h3>
        <div className="indicator-search">
          <input
            type="text"
            placeholder="Search indicators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="risk-overview">
        <div className="overall-risk">
          <div className="risk-circle">
            <span className="risk-value">{calculateOverallRisk()}</span>
            <span className="risk-label">INFORM Risk Index</span>
          </div>
        </div>
        <div className="dimension-scores">
          {Object.entries(indicatorStructure).map(([key, dim]) => (
            <div key={key} className="dimension-score" style={{ borderColor: dim.color }}>
              <span className="dim-icon">{dim.icon}</span>
              <span className="dim-name">{dim.name}</span>
              <span className="dim-value" style={{ color: dim.color }}>
                {calculateDimensionScore(dim)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="indicators-accordion">
        {Object.entries(indicatorStructure).map(([key, dimension]) => (
          <div
            key={key}
            className={`accordion-item ${expandedCategory === key ? 'expanded' : ''}`}
          >
            <div
              className="accordion-header"
              onClick={() => setExpandedCategory(expandedCategory === key ? '' : key)}
              style={{ borderLeftColor: dimension.color }}
            >
              <span className="accordion-icon">{dimension.icon}</span>
              <span className="accordion-title">{dimension.name}</span>
              <span className="accordion-score" style={{ backgroundColor: dimension.color }}>
                {calculateDimensionScore(dimension)}
              </span>
              <span className="accordion-arrow">{expandedCategory === key ? '▼' : '▶'}</span>
            </div>

            {expandedCategory === key && (
              <div className="accordion-content">
                {filterIndicators(dimension.categories).map((category, catIdx) => (
                  <div key={catIdx} className="indicator-category">
                    <h5>{category.name}</h5>
                    <table className="indicators-table">
                      <thead>
                        <tr>
                          <th>Indicator</th>
                          <th>Value</th>
                          <th>Source</th>
                          {canEdit && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {category.indicators.map(indicator => (
                          <tr key={indicator.id}>
                            <td>{indicator.name}</td>
                            <td>
                              <div className="value-bar">
                                <div
                                  className="value-fill"
                                  style={{
                                    width: `${indicator.value * 10}%`,
                                    backgroundColor: dimension.color
                                  }}
                                />
                                <span className="value-text">{indicator.value}</span>
                              </div>
                            </td>
                            <td>
                              <span className="source-badge">{indicator.source}</span>
                            </td>
                            {canEdit && (
                              <td>
                                <button
                                  className="btn-small"
                                  onClick={() => handleEditIndicator(indicator)}
                                >
                                  Edit
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="formula-reference">
        <h4>INFORM Risk Formula</h4>
        <div className="formula-display">
          INFORM Risk = (Hazard × Vulnerability × Lack of Coping Capacity)^(1/3)
        </div>
        <p className="formula-note">
          All dimensions are equally weighted (33.3% each). Values range from 0 (very low risk) to 10 (very high risk).
        </p>
      </div>

      {/* Edit Modal */}
      {editingIndicator && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Edit Indicator</h4>
              <button className="close-btn" onClick={() => setEditingIndicator(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Indicator Name</label>
                <input type="text" value={editingIndicator.name} disabled />
              </div>
              <div className="form-group">
                <label>Value (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  defaultValue={editingIndicator.value}
                />
              </div>
              <div className="form-group">
                <label>Source</label>
                <input type="text" defaultValue={editingIndicator.source} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={3} placeholder="Add any notes about this update..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditingIndicator(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveIndicator}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default INFORMIndicators;
