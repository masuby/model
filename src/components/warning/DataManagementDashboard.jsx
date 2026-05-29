/**
 * DATA MANAGEMENT DASHBOARD
 *
 * UI component for managing external data sources
 * Displays connection status, available layers, and data sync controls
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  getDataIntegrationService,
  DATA_SOURCES,
  GEE_DATASETS,
  RISK_DATA_SOURCES,
  EXPOSURE_DATA_SOURCES,
  INFRASTRUCTURE_DATA_SOURCES,
  CLIMATE_DATA_SOURCES
} from '../../services/dataIntegration';

// ============================================================================
// DATA SOURCE CARD COMPONENT
// ============================================================================

const DataSourceCard = ({ source, status, onConnect, onRefresh, isConnecting }) => {
  const getStatusColor = () => {
    if (status?.connected || status?.available) return '#4CAF50';
    if (status?.error) return '#F44336';
    return '#FF9800';
  };

  const getStatusText = () => {
    if (status?.connected) return 'Connected';
    if (status?.available) return 'Available';
    if (status?.error) return 'Error';
    return 'Not Connected';
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `2px solid ${getStatusColor()}22`
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{source.name}</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>{source.description}</p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '20px',
          background: getStatusColor() + '22',
          color: getStatusColor(),
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: getStatusColor()
          }} />
          {getStatusText()}
        </div>
      </div>

      {/* Service Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ background: '#F5F5F5', padding: '10px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Service Type</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{source.serviceType}</div>
        </div>
        <div style={{ background: '#F5F5F5', padding: '10px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Data Types</div>
          <div style={{ fontSize: '12px', color: '#333' }}>
            {source.dataTypes?.slice(0, 3).join(', ')}
            {source.dataTypes?.length > 3 && '...'}
          </div>
        </div>
      </div>

      {/* Layer/Dataset Count */}
      {status?.layerCount !== undefined && (
        <div style={{
          background: '#E3F2FD',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '13px', color: '#1565C0' }}>Available Layers</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1565C0' }}>
            {status.layerCount}
          </span>
        </div>
      )}

      {/* Error Message */}
      {status?.error && (
        <div style={{
          background: '#FFEBEE',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '12px',
          color: '#C62828'
        }}>
          {status.error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onConnect(source.id)}
          disabled={isConnecting}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            background: status?.connected ? '#E8F5E9' : '#1976D2',
            color: status?.connected ? '#2E7D32' : 'white',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: isConnecting ? 'wait' : 'pointer',
            opacity: isConnecting ? 0.7 : 1
          }}
        >
          {isConnecting ? 'Connecting...' : status?.connected ? 'Reconnect' : 'Connect'}
        </button>
        {status?.connected && (
          <button
            onClick={() => onRefresh(source.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #1976D2',
              background: 'white',
              color: '#1976D2',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        )}
      </div>

      {/* URL */}
      <div style={{
        marginTop: '12px',
        padding: '8px',
        background: '#FAFAFA',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#666',
        wordBreak: 'break-all'
      }}>
        {source.baseUrl}
      </div>
    </div>
  );
};

// ============================================================================
// LAYER LIST COMPONENT
// ============================================================================

const LayerList = ({ title, layers, category, color }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `2px solid ${color}22`
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px'
          }}>
            {category === 'hazard' && '⚠️'}
            {category === 'exposure' && '🎯'}
            {category === 'vulnerability' && '🛡️'}
            {category === 'coping' && '🏛️'}
            {category === 'infrastructure' && '🏗️'}
            {category === 'climate' && '🌡️'}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', color: '#333' }}>{title}</h4>
            <span style={{ fontSize: '12px', color: '#666' }}>{layers.length} layers</span>
          </div>
        </div>
        <span style={{ fontSize: '20px', color: '#666' }}>{expanded ? '−' : '+'}</span>
      </div>

      {expanded && layers.length > 0 && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #E0E0E0', paddingTop: '12px' }}>
          {layers.map((layer, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: idx % 2 === 0 ? '#FAFAFA' : 'white',
                borderRadius: '6px',
                marginBottom: '4px'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                  {layer.title || layer.name}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  Source: {layer.source} | Unit: {layer.unit || 'index'}
                </div>
              </div>
              <span style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: color + '22',
                color: color,
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                {layer.source}
              </span>
            </div>
          ))}
        </div>
      )}

      {expanded && layers.length === 0 && (
        <div style={{
          marginTop: '16px',
          padding: '20px',
          textAlign: 'center',
          color: '#999',
          fontSize: '13px'
        }}>
          No layers available. Connect to data sources first.
        </div>
      )}
    </div>
  );
};

// ============================================================================
// GEE DATASETS PANEL
// ============================================================================

const GEEDatasetsPanel = ({ status }) => {
  const [expanded, setExpanded] = useState(false);
  const datasets = Object.entries(GEE_DATASETS);

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '2px solid #4CAF5022'
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🌍
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Google Earth Engine Datasets</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
              Global datasets available for computation
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '20px',
            background: status?.available ? '#E8F5E9' : '#FFF3E0',
            color: status?.available ? '#2E7D32' : '#EF6C00',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {status?.available ? 'Backend Available' : 'Backend Required'}
          </span>
          <span style={{ fontSize: '20px', color: '#666' }}>{expanded ? '−' : '+'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px'
          }}>
            {datasets.map(([id, dataset]) => (
              <div
                key={id}
                style={{
                  padding: '14px',
                  background: '#F8F9FA',
                  borderRadius: '10px',
                  border: '1px solid #E0E0E0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>{dataset.name}</h4>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: dataset.category === 'hazard' ? '#FFEBEE' :
                               dataset.category === 'exposure' ? '#E3F2FD' :
                               dataset.category === 'vulnerability' ? '#FFF3E0' : '#F3E5F5',
                    color: dataset.category === 'hazard' ? '#C62828' :
                           dataset.category === 'exposure' ? '#1565C0' :
                           dataset.category === 'vulnerability' ? '#E65100' : '#7B1FA2',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {dataset.category}
                  </span>
                </div>
                <p style={{ margin: '6px 0', fontSize: '11px', color: '#666' }}>
                  {dataset.description}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#888' }}>
                    Resolution: {dataset.resolution}m
                  </span>
                  {dataset.temporalCoverage && (
                    <span style={{ fontSize: '10px', color: '#888' }}>
                      | {dataset.temporalCoverage}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!status?.available && (
            <div style={{
              marginTop: '16px',
              padding: '14px 18px',
              background: '#FFF3E0',
              borderRadius: '10px',
              border: '1px solid #FFB74D',
              fontSize: '13px',
              color: '#E65100'
            }}>
              <strong>Note:</strong> GEE datasets require a backend server with Earth Engine SDK.
              Set <code>REACT_APP_GEE_API_URL</code> environment variable to enable computation.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const DataManagementDashboard = () => {
  const [integrationService, setIntegrationService] = useState(null);
  const [status, setStatus] = useState({});
  const [availableLayers, setAvailableLayers] = useState({
    hazard: [],
    exposure: [],
    vulnerability: [],
    coping: [],
    infrastructure: [],
    climate: []
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [connectingSource, setConnectingSource] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Initialize service and auto-load sample data
  useEffect(() => {
    const service = getDataIntegrationService();
    setIntegrationService(service);

    // Auto-initialize to show sample layers immediately
    const autoInit = async () => {
      setIsInitializing(true);
      try {
        const result = await service.initialize();
        setStatus(result.status);
        setAvailableLayers(service.getAllAvailableLayers());
        setLastSync(new Date());
        console.log('[DataDashboard] Auto-initialized with', result.totalLayers, 'layers');
      } catch (error) {
        console.warn('[DataDashboard] Auto-init failed, using sample data');
        // Use sample layers as fallback
        setAvailableLayers(service.getSampleLayers ? service.getSampleLayers() : {
          hazard: [], exposure: [], vulnerability: [], coping: [], infrastructure: [], climate: []
        });
      } finally {
        setIsInitializing(false);
      }
    };

    autoInit();
  }, []);

  // Initialize all connections
  const handleInitializeAll = useCallback(async () => {
    if (!integrationService) return;

    setIsInitializing(true);
    try {
      const result = await integrationService.initialize();
      setStatus(result.status);
      setAvailableLayers(integrationService.getAllAvailableLayers());
      setLastSync(new Date());
    } catch (error) {
      console.error('Initialization failed:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [integrationService]);

  // Connect to specific source
  const handleConnect = useCallback(async (sourceId) => {
    if (!integrationService) return;

    setConnectingSource(sourceId);
    try {
      const connector = integrationService.getConnector(sourceId);
      if (connector?.connect) {
        await connector.connect();
        setStatus(integrationService.getStatus());
        setAvailableLayers(integrationService.getAllAvailableLayers());
      }
    } catch (error) {
      console.error(`Connection to ${sourceId} failed:`, error);
    } finally {
      setConnectingSource(null);
    }
  }, [integrationService]);

  // Refresh source
  const handleRefresh = useCallback(async (sourceId) => {
    // Same as connect for now
    await handleConnect(sourceId);
  }, [handleConnect]);

  // Get sources from registry
  const sources = Object.entries(DATA_SOURCES).map(([id, source]) => ({
    id,
    ...source
  }));

  return (
    <div style={{
      padding: '24px',
      background: '#F5F7FA',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#1976D2' }}>
            Data Source Management
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#666' }}>
            Connect to external data sources for real-time INFORM calculations
          </p>
          {status.sampleMode && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: '#FFF3E0',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#E65100',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>📋</span>
              Sample Mode: Showing available data layers (external APIs require server-side proxy)
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastSync && (
            <span style={{ fontSize: '12px', color: '#999' }}>
              Last sync: {lastSync.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleInitializeAll}
            disabled={isInitializing}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #1976D2, #1565C0)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isInitializing ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              opacity: isInitializing ? 0.7 : 1
            }}
          >
            {isInitializing ? 'Connecting...' : 'Connect All Sources'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #E0E0E0',
        paddingBottom: '12px'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'risk', label: 'Risk Data', icon: '⚠️' },
          { id: 'exposure', label: 'Exposure Data', icon: '🎯' },
          { id: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
          { id: 'climate', label: 'Climate', icon: '🌡️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === tab.id ? '#1976D2' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#666',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Connection Status Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[
          { key: 'tcvmp', label: 'TCVMP (PMO-DMD)', icon: '🏛️' },
          { key: 'rcmrd', label: 'RCMRD', icon: '🗺️' },
          { key: 'gee', label: 'Earth Engine', icon: '🌍' },
          { key: 'risk', label: 'Risk Sources', icon: '⚠️' },
          { key: 'exposure', label: 'Exposure Sources', icon: '🎯' },
          { key: 'infrastructure', label: 'OpenStreetMap', icon: '🗺️' },
          { key: 'climate', label: 'Climate Data', icon: '🌡️' },
          { key: 'layers', label: 'Total Layers', icon: '📊' }
        ].map(item => {
          const isConnected = item.key === 'layers'
            ? Object.values(availableLayers).flat().length > 0
            : status[item.key]?.connected || status[item.key]?.available;

          const count = item.key === 'layers'
            ? Object.values(availableLayers).flat().length
            : status[item.key]?.layerCount || 0;

          return (
            <div
              key={item.key}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: isConnected ? '#E8F5E9' : '#FFF3E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#666' }}>{item.label}</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: isConnected ? '#2E7D32' : '#EF6C00'
                }}>
                  {item.key === 'layers' ? count : (isConnected ? '✓' : '○')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Sources Grid */}
      <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px' }}>
        External Data Sources
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {sources.filter(s => s.id !== 'GEE').map(source => (
          <DataSourceCard
            key={source.id}
            source={source}
            status={status[source.id.toLowerCase()]}
            onConnect={handleConnect}
            onRefresh={handleRefresh}
            isConnecting={connectingSource === source.id}
          />
        ))}
      </div>

      {/* GEE Panel */}
      <div style={{ marginBottom: '32px' }}>
        <GEEDatasetsPanel status={status.gee} />
      </div>

      {/* Available Layers by Category */}
      <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px' }}>
        Available Layers by Category
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        <LayerList
          title="Hazard Layers"
          layers={availableLayers.hazard}
          category="hazard"
          color="#F44336"
        />
        <LayerList
          title="Exposure Layers"
          layers={availableLayers.exposure}
          category="exposure"
          color="#2196F3"
        />
        <LayerList
          title="Vulnerability Layers"
          layers={availableLayers.vulnerability}
          category="vulnerability"
          color="#FF9800"
        />
        <LayerList
          title="Coping Capacity Layers"
          layers={availableLayers.coping}
          category="coping"
          color="#9C27B0"
        />
        <LayerList
          title="Infrastructure Layers"
          layers={availableLayers.infrastructure || []}
          category="infrastructure"
          color="#607D8B"
        />
        <LayerList
          title="Climate Datasets"
          layers={availableLayers.climate || []}
          category="climate"
          color="#00BCD4"
        />
      </div>

      {/* New Data Sources Panels */}
      <h2 style={{ fontSize: '20px', color: '#333', margin: '32px 0 16px 0' }}>
        Additional Data Sources
      </h2>

      {/* Risk Data Sources */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          Risk & Hazard Data Sources
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {Object.entries(RISK_DATA_SOURCES).map(([id, source]) => (
            <div key={id} style={{
              padding: '14px',
              background: '#FFF3E0',
              borderRadius: '10px',
              border: '1px solid #FFB74D'
            }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#E65100' }}>{source.name}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{source.description}</p>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
                Type: {source.type} | Layers: {Object.keys(source.layers || source.datasets || {}).length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exposure Data Sources */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🎯</span>
          Exposure Data Sources (Land Cover, Population, Agriculture)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {Object.entries(EXPOSURE_DATA_SOURCES).map(([id, source]) => (
            <div key={id} style={{
              padding: '14px',
              background: '#E3F2FD',
              borderRadius: '10px',
              border: '1px solid #64B5F6'
            }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#1565C0' }}>{source.name}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{source.description}</p>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
                {source.resolution && `Resolution: ${source.resolution} | `}
                Layers: {Object.keys(source.layers || source.datasets || {}).length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Infrastructure Data Sources */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🏗️</span>
          Infrastructure Data Sources (OpenStreetMap, World Bank)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {Object.entries(INFRASTRUCTURE_DATA_SOURCES).map(([id, source]) => (
            <div key={id} style={{
              padding: '14px',
              background: '#ECEFF1',
              borderRadius: '10px',
              border: '1px solid #90A4AE'
            }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#455A64' }}>{source.name}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{source.description}</p>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
                Type: {source.type} |
                {source.layers && ` Layers: ${Object.keys(source.layers).length}`}
                {source.indicators && ` Indicators: ${Object.keys(source.indicators).length}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Climate Data Sources */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🌡️</span>
          Climate Projection Data Sources
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {Object.entries(CLIMATE_DATA_SOURCES).map(([id, source]) => (
            <div key={id} style={{
              padding: '14px',
              background: '#E0F7FA',
              borderRadius: '10px',
              border: '1px solid #4DD0E1'
            }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#00838F' }}>{source.name}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{source.description}</p>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
                Type: {source.type} |
                Datasets: {Object.keys(source.datasets || source.variables || source.products || {}).length}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Guide */}
      <div style={{
        marginTop: '32px',
        padding: '24px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>
          Integration Reference
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ padding: '16px', background: '#F5F5F5', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1976D2' }}>TCVMP WMS/WFS</h4>
            <code style={{ fontSize: '11px', color: '#666', wordBreak: 'break-all' }}>
              https://tcvmp.pmo.go.tz/ows/?SERVICE=WFS&REQUEST=GetCapabilities
            </code>
          </div>
          <div style={{ padding: '16px', background: '#F5F5F5', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1976D2' }}>RCMRD GeoNode</h4>
            <code style={{ fontSize: '11px', color: '#666', wordBreak: 'break-all' }}>
              https://geoportal.rcmrd.org/api/v2/datasets/
            </code>
          </div>
          <div style={{ padding: '16px', background: '#F5F5F5', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1976D2' }}>Resilience Academy</h4>
            <code style={{ fontSize: '11px', color: '#666', wordBreak: 'break-all' }}>
              https://geonode.resilienceacademy.ac.tz/api/v2/datasets/
            </code>
          </div>
          <div style={{ padding: '16px', background: '#F5F5F5', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1976D2' }}>NBS Census Data</h4>
            <code style={{ fontSize: '11px', color: '#666', wordBreak: 'break-all' }}>
              https://sensa.nbs.go.tz
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagementDashboard;
