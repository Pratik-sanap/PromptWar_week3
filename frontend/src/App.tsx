import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageList } from './components/MessageList';
import type { Message } from './components/MessageItem';
import type { StructuredData } from './components/StructuredDataCard';
import {
  LANGUAGES,
  ZONES,
  CHAT_API_URL,
  API_TIMEOUT,
  MOCK_DELAY,
} from './constants';
import { getMockResponse } from './utils/mockResponses';

/**
 * Parses a raw text stream chunk line by line, extracting message replies and structured card data.
 *
 * @param chunk The text chunk containing lines of SSE data.
 * @returns An object containing the accumulated reply text and optional structured data.
 */
function parseStreamChunk(chunk: string): {
  replyText: string;
  structuredData?: StructuredData;
} {
  let replyText = '';
  let structuredData: StructuredData | undefined;
  const lines = chunk.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let dataStr = trimmed;
    if (trimmed.startsWith('data:')) {
      dataStr = trimmed.slice(5).trim();
      if (dataStr === '[DONE]') {
        continue;
      }
    }

    try {
      const parsed = JSON.parse(dataStr);
      if (parsed.reply) {
        replyText += parsed.reply;
      }
      if (parsed.structuredData) {
        structuredData = parsed.structuredData;
      }
    } catch {
      replyText += dataStr;
    }
  }

  return { replyText, structuredData };
}

/**
 * Reads and processes the stream response from the server, updating the messages array incrementally.
 *
 * @param reader The stream reader.
 * @param assistantMsgId The ID of the assistant message to update.
 * @param setMessages Callback to update messages state.
 * @param setIsTyping Callback to set typing state.
 */
async function processChatStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  assistantMsgId: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> {
  const decoder = new TextDecoder('utf-8');
  let isFirstChunk = true;
  let accumulatedText = '';
  let structuredData: StructuredData | undefined;

  let done = false;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;

    if (value) {
      if (isFirstChunk) {
        setIsTyping(false);
        isFirstChunk = false;
      }
      const chunk = decoder.decode(value, { stream: !done });
      const parsed = parseStreamChunk(chunk);

      accumulatedText += parsed.replyText;
      if (parsed.structuredData) {
        structuredData = parsed.structuredData;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text: accumulatedText,
                structuredData: structuredData || msg.structuredData,
              }
            : msg
        )
      );
    }
  }
}

/**
 * Main application component for the FIFA 2026 Smart Stadium Concierge.
 * Manages the user settings panel and handles all chat logic.
 */
export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('en');
  const [zone, setZone] = useState('zone_a');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState({
    wheelchair: false,
    visual: false,
  });
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(true); // Default to true for offline-first demo and test compatibility

  const sessionIdRef = useRef<string>('');

  // Generate unique sessionId on mount
  useEffect(() => {
    sessionIdRef.current =
      'session-' + Math.random().toString(36).substring(2, 11);
  }, []);

  // Handle Accessibility Needs toggle
  const handleAccessibilityToggle = (type: 'wheelchair' | 'visual'): void => {
    setAccessibilityNeeds((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  /**
   * Simulates assistant message response in mock mode.
   *
   * @param userText Message text submitted by the user.
   */
  const sendMockMessage = useCallback(
    (userText: string): void => {
      setTimeout(() => {
        const res = getMockResponse(
          userText,
          language,
          accessibilityNeeds,
          zone
        );
        const newAssistantMsg: Message = {
          id: `msg-${Date.now()}-assistant`,
          sender: 'assistant',
          text: res.reply,
          language,
          timestamp: new Date(),
          structuredData: res.structuredData,
        };
        setMessages((prev) => [...prev, newAssistantMsg]);
        setIsTyping(false);
      }, MOCK_DELAY);
    },
    [language, accessibilityNeeds, zone]
  );

  /**
   * Coordinates live chat API calls and parses json/streamed responses.
   *
   * @param userText Message text submitted by the user.
   * @param currentMessages Current history of chat messages.
   */
  const sendLiveMessage = useCallback(
    async (userText: string, currentMessages: Message[]): Promise<void> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const historyForApi = currentMessages.map((m) => ({
          sender:
            m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          text: m.text,
        }));

        const response = await fetch(CHAT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            language,
            sessionId: sessionIdRef.current,
            zone,
            accessibilityNeeds,
            history: historyForApi,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server returned error status ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.includes('application/json')) {
          const data = await response.json();
          const newAssistantMsg: Message = {
            id: `msg-${Date.now()}-assistant`,
            sender: 'assistant',
            text: data.reply,
            language,
            timestamp: new Date(),
            structuredData: data.structuredData,
          };
          setMessages((prev) => [...prev, newAssistantMsg]);
        } else if (response.body) {
          const reader = response.body.getReader();
          const assistantMsgId = `msg-${Date.now()}-assistant`;
          const initialAssistantMsg: Message = {
            id: assistantMsgId,
            sender: 'assistant',
            text: '',
            language,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, initialAssistantMsg]);

          await processChatStream(
            reader,
            assistantMsgId,
            setMessages,
            setIsTyping
          );
        } else {
          throw new Error('Response body is not readable');
        }
      } catch (err: unknown) {
        const isAbort = err instanceof Error && err.name === 'AbortError';
        if (isAbort) {
          setError(
            'The request timed out. Please check your network connection and try again.'
          );
        } else {
          setError(
            'Failed to reach the live assistant. Ensure the backend server is running, or switch on Mock Mode.'
          );
        }
      } finally {
        setIsTyping(false);
      }
    },
    [language, zone, accessibilityNeeds]
  );

  // Submit chat message handler
  const handleSendMessage = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (!inputText.trim()) return;

      setError(null);
      const userText = inputText;
      setInputText('');
      setIsTyping(true);

      const newUserMessage: Message = {
        id: `msg-${Date.now()}-user`,
        sender: 'user',
        text: userText,
        language,
        timestamp: new Date(),
      };

      // We capture the current messages array snapshot before state update resolves asynchronously
      const updatedMessages = [...messages, newUserMessage];
      setMessages(updatedMessages);

      if (mockMode) {
        sendMockMessage(userText);
      } else {
        await sendLiveMessage(userText, updatedMessages);
      }
    },
    [inputText, language, messages, mockMode, sendMockMessage, sendLiveMessage]
  );

  return (
    <>
      {/* Sidebar Controls */}
      <aside className="sidebar" aria-label="Stadium Context Panel">
        <header className="brand-header">
          <span className="brand-logo" role="img" aria-label="Soccer ball logo">
            ⚽
          </span>
          <div className="brand-title">
            <h1>FIFA 2026</h1>
            <p>Smart Stadium Concierge</p>
          </div>
        </header>

        <hr className="sidebar-divider" />

        <div className="control-section">
          {/* Language Selector */}
          <div className="control-group">
            <label htmlFor="lang-select" className="control-label">
              Preferred Language
            </label>
            <select
              id="lang-select"
              className="select-control"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Select language for conversation"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Zone Selector */}
          <div className="control-group">
            <label htmlFor="zone-select" className="control-label">
              Your Stadium Zone
            </label>
            <select
              id="zone-select"
              className="select-control"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              aria-label="Select your current stadium zone"
            >
              {ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>

          {/* Accessibility Settings */}
          <div className="control-group">
            <span className="control-label">Accessibility Settings</span>

            {/* Wheelchair toggle */}
            <button
              type="button"
              className={`toggle-card ${
                accessibilityNeeds.wheelchair ? 'active' : ''
              }`}
              onClick={() => handleAccessibilityToggle('wheelchair')}
              aria-pressed={accessibilityNeeds.wheelchair}
              aria-label="Toggle Wheelchair or Ramp assistance routes"
            >
              <div className="toggle-info">
                <span className="toggle-title">Wheelchair Access</span>
                <span className="toggle-desc">
                  Ramps, elevators, flat paths
                </span>
              </div>
              <label className="switch" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={accessibilityNeeds.wheelchair}
                  onChange={() => handleAccessibilityToggle('wheelchair')}
                  aria-label="Wheelchair Access"
                />
                <span className="slider"></span>
              </label>
            </button>

            {/* Visual assistance toggle */}
            <button
              type="button"
              className={`toggle-card ${
                accessibilityNeeds.visual ? 'active' : ''
              }`}
              onClick={() => handleAccessibilityToggle('visual')}
              aria-pressed={accessibilityNeeds.visual}
              aria-label="Toggle Visual Assistance high contrast or audio descriptions"
            >
              <div className="toggle-info">
                <span className="toggle-title">Visual Assistance</span>
                <span className="toggle-desc">High contrast, large fonts</span>
              </div>
              <label className="switch" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={accessibilityNeeds.visual}
                  onChange={() => handleAccessibilityToggle('visual')}
                  aria-label="Visual Assistance"
                />
                <span className="slider"></span>
              </label>
            </button>
          </div>
        </div>

        {/* Mock Mode Toggle for easy testing/demo */}
        <div className="mode-toggle">
          <span>Mock Response Mode</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={mockMode}
              onChange={() => setMockMode(!mockMode)}
              aria-label="Toggle mock responses vs backend live API"
            />
            <span className="slider"></span>
          </label>
        </div>
      </aside>

      {/* Main Chat View */}
      <main className="main-chat-area" aria-label="Concierge Chat Stream">
        <MessageList messages={messages} isTyping={isTyping} error={error} />

        <div className="input-area">
          <form className="input-container-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about gates, crowds, or metro lines..."
              disabled={isTyping}
              aria-label="Type your message to the concierge"
            />
            <button
              type="submit"
              className="send-button"
              disabled={isTyping || !inputText.trim()}
              aria-label="Send message"
            >
              <svg
                className="send-icon"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
          <span className="input-footer-hint">
            FIFA Smart Stadium Concierge | Simulated Live feeds | Language:{' '}
            {LANGUAGES.find((l) => l.code === language)?.label}
          </span>
        </div>
      </main>
    </>
  );
};

export default App;
