import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from '../../App';

describe('App Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders Sidebar controls and Chat Area', () => {
    render(<App />);

    // Header checks
    expect(screen.getByText('FIFA 2026')).toBeInTheDocument();
    expect(screen.getByText('Smart Stadium Concierge')).toBeInTheDocument();

    // Dropdown checks
    expect(screen.getByLabelText('Select language for conversation')).toBeInTheDocument();
    expect(screen.getByLabelText('Select your current stadium zone')).toBeInTheDocument();

    // Accessibility buttons checks
    expect(screen.getByLabelText('Toggle Wheelchair or Ramp assistance routes')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle Visual Assistance high contrast or audio descriptions')).toBeInTheDocument();

    // Chat empty state message checks
    expect(screen.getByText('Welcome to the FIFA 2026 Smart Concierge')).toBeInTheDocument();
  });

  it('handles message typing and submission in mock mode', async () => {
    render(<App />);

    const input = screen.getByPlaceholderText('Ask about gates, crowds, or metro lines...');
    const sendBtn = screen.getByLabelText('Send message');

    // Type a message
    fireEvent.change(input, { target: { value: 'tell me about the gate' } });
    expect(input).toHaveValue('tell me about the gate');

    // Submit the message
    fireEvent.click(sendBtn);

    // Input should clear immediately
    expect(input).toHaveValue('');

    // User message should appear immediately
    expect(screen.getByText('tell me about the gate')).toBeInTheDocument();

    // Typing indicator should appear
    expect(screen.getByLabelText('Assistant is typing')).toBeInTheDocument();

    // Fast-forward fake timers (1000ms delay in App.tsx)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Typing indicator should disappear
    expect(screen.queryByLabelText('Assistant is typing')).not.toBeInTheDocument();

    // Assistant response with Gate Recommendation card should appear
    expect(screen.getByTestId('gate-card')).toBeInTheDocument();
    expect(screen.getByText('Gate B3')).toBeInTheDocument();
  });

  it('handles accessibility toggle state and changes mock response', async () => {
    render(<App />);

    const wheelchairBtn = screen.getByLabelText('Toggle Wheelchair or Ramp assistance routes');
    
    // Toggle wheelchair assistance
    fireEvent.click(wheelchairBtn);
    expect(wheelchairBtn).toHaveClass('active');

    const input = screen.getByPlaceholderText('Ask about gates, crowds, or metro lines...');
    const sendBtn = screen.getByLabelText('Send message');

    // Send gate request
    fireEvent.change(input, { target: { value: 'where is the gate' } });
    fireEvent.click(sendBtn);

    // Fast-forward timers
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Accessible gate (Gate A1) should be recommended
    expect(screen.getByTestId('gate-card')).toBeInTheDocument();
    expect(screen.getByText('Gate A1')).toBeInTheDocument();
    expect(screen.getByText('♿ Accessible')).toBeInTheDocument();
  });

  describe('Live Mode API Integration', () => {
    let mockFetch: any;

    beforeEach(() => {
      vi.useRealTimers();
      mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    });

    it('handles successful JSON response in live mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          reply: 'Live assistant JSON response here.',
          structuredData: {
            type: 'gate_recommendation',
            data: { gateName: 'Gate A1', distance: '50m', queueStatus: 'Low', accessible: true }
          }
        })
      });

      render(<App />);

      // Turn off mock mode
      const mockToggle = screen.getByLabelText('Toggle mock responses vs backend live API');
      fireEvent.click(mockToggle);

      const input = screen.getByPlaceholderText('Ask about gates, crowds, or metro lines...');
      const sendBtn = screen.getByLabelText('Send message');

      fireEvent.change(input, { target: { value: 'where is the gate?' } });
      fireEvent.click(sendBtn);

      // Verify that fetch was called
      expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.any(Object));

      // Wait for assistant response
      const responseText = await screen.findByText('Live assistant JSON response here.');
      expect(responseText).toBeInTheDocument();
      expect(screen.getByText('Gate A1')).toBeInTheDocument();
    });

    it('handles successful streamed response in live mode', async () => {
      const streamChunks = [
        'data: {"reply": "Hello "}\n',
        'data: {"reply": "from "}\n',
        'data: {"reply": "streamed "}\n',
        'data: {"reply": "live response.", "structuredData": {"type": "crowd_density", "data": {"zone": "zone_a", "density": "12%", "status": "Normal"}}}\n',
        'data: [DONE]\n'
      ];

      let chunkIdx = 0;
      const reader = {
        read: vi.fn().mockImplementation(async () => {
          if (chunkIdx < streamChunks.length) {
            const val = new TextEncoder().encode(streamChunks[chunkIdx++]);
            return { value: val, done: false };
          }
          return { value: undefined, done: true };
        })
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'text/event-stream' }),
        body: {
          getReader: () => reader
        }
      });

      render(<App />);

      // Turn off mock mode
      const mockToggle = screen.getByLabelText('Toggle mock responses vs backend live API');
      fireEvent.click(mockToggle);

      const input = screen.getByPlaceholderText('Ask about gates, crowds, or metro lines...');
      const sendBtn = screen.getByLabelText('Send message');

      fireEvent.change(input, { target: { value: 'how busy is zone a?' } });
      fireEvent.click(sendBtn);

      // Wait for stream to finish and update text
      const finalMsg = await screen.findByText('Hello from streamed live response.');
      expect(finalMsg).toBeInTheDocument();
      expect(screen.getByText('Density: 12% capacity')).toBeInTheDocument();
    });

    it('handles request timeout in live mode', async () => {
      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      render(<App />);

      // Turn off mock mode
      const mockToggle = screen.getByLabelText('Toggle mock responses vs backend live API');
      fireEvent.click(mockToggle);

      const input = screen.getByPlaceholderText('Ask about gates, crowds, or metro lines...');
      const sendBtn = screen.getByLabelText('Send message');

      fireEvent.change(input, { target: { value: 'test timeout' } });
      fireEvent.click(sendBtn);

      // Verify timeout error message is displayed
      const errorText = await screen.findByText('The request timed out. Please check your network connection and try again.');
      expect(errorText).toBeInTheDocument();
    });

    it('handles server failure in live mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers()
      });

      render(<App />);

      // Turn off mock mode
      const mockToggle = screen.getByLabelText('Toggle mock responses vs backend live API');
      fireEvent.click(mockToggle);

      const input = screen.getByPlaceholderText('Ask about gates, crowds, or metro lines...');
      const sendBtn = screen.getByLabelText('Send message');

      fireEvent.change(input, { target: { value: 'test server failure' } });
      fireEvent.click(sendBtn);

      // Verify generic error message is displayed
      const errorText = await screen.findByText('Failed to reach the live assistant. Ensure the backend server is running, or switch on Mock Mode.');
      expect(errorText).toBeInTheDocument();
    });
  });
});
