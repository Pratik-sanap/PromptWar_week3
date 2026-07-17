import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageItem } from '../MessageItem';
import type { Message } from '../MessageItem';

describe('MessageItem', () => {
  it('renders a user message correctly', () => {
    const userMsg: Message = {
      id: '1',
      sender: 'user',
      text: 'Hello concierge',
      timestamp: new Date('2026-07-14T12:00:00'),
    };

    render(<MessageItem message={userMsg} />);

    expect(screen.getByText('Hello concierge')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('user-item');
    expect(screen.getByText(/12:00/)).toBeInTheDocument();
  });

  it('renders an assistant message with a structured card above the text bubble', () => {
    const assistantMsg: Message = {
      id: '2',
      sender: 'assistant',
      text: 'Here is the gate recommendation.',
      timestamp: new Date('2026-07-14T12:05:00'),
      structuredData: {
        type: 'gate_recommendation',
        data: {
          gateName: 'Gate B3',
          distance: '130m',
          queueStatus: 'Medium',
          accessible: false,
        },
      },
    };

    render(<MessageItem message={assistantMsg} />);

    // Checks structured data card is rendered
    expect(screen.getByTestId('gate-card')).toBeInTheDocument();
    expect(screen.getByText('Gate B3')).toBeInTheDocument();

    // Checks assistant chat bubble is rendered
    expect(
      screen.getByText('Here is the gate recommendation.')
    ).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('assistant-item');
  });
});
