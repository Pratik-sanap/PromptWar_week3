import React from 'react';

export interface GateData {
  gateName: string;
  distance: string;
  queueStatus: 'Low' | 'Medium' | 'High';
  accessible: boolean;
}

export interface TransportOption {
  mode: string;
  line: string;
  eta: string;
}

export interface CrowdData {
  density: string;
  status: string;
  zone: string;
}

export interface StructuredData {
  type: 'gate_recommendation' | 'transport_options' | 'crowd_density';
  data: GateData | { options: TransportOption[] } | CrowdData;
}

interface StructuredDataCardProps {
  structured: StructuredData;
}

/**
 * StructuredDataCard component parses and renders visually rich widgets
 * for specific structured responses (e.g. gates, crowds, transit options).
 *
 * @param props Contains structured data type and structured details payload.
 */
export const StructuredDataCard: React.FC<StructuredDataCardProps> = ({
  structured,
}) => {
  const { type, data } = structured;

  if (type === 'gate_recommendation') {
    const gate = data as GateData;
    const queueClass = `queue-${gate.queueStatus.toLowerCase()}`;
    return (
      <div className="structured-card gate-card" data-testid="gate-card">
        <div className="card-header">
          <span className="card-tag">Recommended Gate</span>
          {gate.accessible && (
            <span
              className="accessible-badge"
              title="Accessible Route Available"
            >
              ♿ Accessible
            </span>
          )}
        </div>
        <div className="card-body">
          <div className="gate-number">{gate.gateName}</div>
          <div className="gate-details">
            <div className="detail-item">
              <span className="detail-label">Distance</span>
              <span className="detail-value">{gate.distance}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Queue</span>
              <span className={`detail-value status-badge ${queueClass}`}>
                {gate.queueStatus} Wait
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'transport_options') {
    const transport = data as { options: TransportOption[] };
    return (
      <div
        className="structured-card transport-card"
        data-testid="transport-card"
      >
        <div className="card-header">
          <span className="card-tag">Transport Options</span>
        </div>
        <div className="card-body">
          <div className="transport-list">
            {transport.options.map((opt, idx) => (
              <div key={idx} className="transport-item">
                <div className="transport-icon-wrapper">
                  {opt.mode.toLowerCase() === 'bus' && '🚌'}
                  {opt.mode.toLowerCase() === 'train' && '🚇'}
                  {opt.mode.toLowerCase() === 'shuttle' && '🚐'}
                  {opt.mode.toLowerCase() !== 'bus' &&
                    opt.mode.toLowerCase() !== 'train' &&
                    opt.mode.toLowerCase() !== 'shuttle' &&
                    '🚶'}
                </div>
                <div className="transport-info">
                  <div className="transport-line">{opt.line}</div>
                  <div className="transport-mode">{opt.mode}</div>
                </div>
                <div className="transport-eta">{opt.eta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'crowd_density') {
    const crowd = data as CrowdData;
    const statusClass = `density-${crowd.status.toLowerCase()}`;
    return (
      <div className="structured-card crowd-card" data-testid="crowd-card">
        <div className="card-header">
          <span className="card-tag">Crowd Density Status</span>
        </div>
        <div className="card-body">
          <div className="crowd-main">
            <span className="crowd-zone">
              {crowd.zone.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`status-badge ${statusClass}`}>
              {crowd.status}
            </span>
          </div>
          <div className="crowd-bar-container">
            <div
              className={`crowd-bar ${statusClass}`}
              style={{ width: crowd.density }}
            ></div>
          </div>
          <div className="crowd-footer">
            <span>Density: {crowd.density} capacity</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
