import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StructuredDataCard } from '../StructuredDataCard';
import type { StructuredData } from '../StructuredDataCard';

describe('StructuredDataCard', () => {
  it('renders a gate recommendation card with accessibility badge and correct queue status', () => {
    const gateStructured: StructuredData = {
      type: 'gate_recommendation',
      data: {
        gateName: 'Gate A1',
        distance: '85m',
        queueStatus: 'Low',
        accessible: true,
      },
    };

    render(<StructuredDataCard structured={gateStructured} />);

    expect(screen.getByTestId('gate-card')).toBeInTheDocument();
    expect(screen.getByText('Gate A1')).toBeInTheDocument();
    expect(screen.getByText('85m')).toBeInTheDocument();
    expect(screen.getByText('Low Wait')).toBeInTheDocument();
    expect(screen.getByText('♿ Accessible')).toBeInTheDocument();
  });

  it('renders a gate recommendation card without accessibility badge when accessible is false', () => {
    const gateStructured: StructuredData = {
      type: 'gate_recommendation',
      data: {
        gateName: 'Gate B3',
        distance: '130m',
        queueStatus: 'Medium',
        accessible: false,
      },
    };

    render(<StructuredDataCard structured={gateStructured} />);

    expect(screen.getByTestId('gate-card')).toBeInTheDocument();
    expect(screen.queryByText('♿ Accessible')).not.toBeInTheDocument();
    expect(screen.getByText('Medium Wait')).toBeInTheDocument();
  });

  it('renders transport options correctly', () => {
    const transportStructured: StructuredData = {
      type: 'transport_options',
      data: {
        options: [
          { mode: 'train', line: 'Metro Line 1', eta: '3 mins' },
          { mode: 'bus', line: 'Express Shuttle 102', eta: '8 mins' },
        ],
      },
    };

    render(<StructuredDataCard structured={transportStructured} />);

    expect(screen.getByTestId('transport-card')).toBeInTheDocument();
    expect(screen.getByText('Metro Line 1')).toBeInTheDocument();
    expect(screen.getByText('Express Shuttle 102')).toBeInTheDocument();
    expect(screen.getByText('3 mins')).toBeInTheDocument();
    expect(screen.getByText('8 mins')).toBeInTheDocument();
  });

  it('renders crowd density information correctly', () => {
    const crowdStructured: StructuredData = {
      type: 'crowd_density',
      data: {
        zone: 'zone_c',
        density: '85%',
        status: 'Busy',
      },
    };

    render(<StructuredDataCard structured={crowdStructured} />);

    expect(screen.getByTestId('crowd-card')).toBeInTheDocument();
    expect(screen.getByText('ZONE C')).toBeInTheDocument();
    expect(screen.getByText('Busy')).toBeInTheDocument();
    expect(screen.getByText('Density: 85% capacity')).toBeInTheDocument();
  });
});
