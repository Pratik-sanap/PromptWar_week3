import React, { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import type { Message } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
}

/**
 * MessageList component displays the scrollable container for the chat history,
 * including empty state message, loading/typing indicator, and system errors.
 *
 * @param props Contains list of messages, typing status, and optional error state.
 */
export const MessageList: React.FC<MessageListProps> = React.memo(
  ({ messages, isTyping, error }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (bottomRef.current?.scrollIntoView) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages, isTyping, error]);

    return (
      <div
        className="message-list-container"
        role="list"
        aria-label="Chat messages history"
      >
        {messages.length === 0 ? (
          <div className="empty-chat-state" role="status">
            <div className="empty-icon">⚽</div>
            <h3>Welcome to the FIFA 2026 Smart Concierge</h3>
            <p>
              Select your zone, specify accessibility needs, and ask any
              question about navigation, crowds, or transport around the
              stadium.
            </p>
          </div>
        ) : (
          messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div
            className="message-item-container assistant-item"
            role="status"
            aria-label="Assistant is typing"
          >
            <div className="message-wrapper">
              <div className="message-bubble assistant-bubble typing-bubble">
                <div className="typing-indicator" aria-label="typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inline Error Message */}
        {error && (
          <div className="chat-error-banner" role="alert" aria-live="assertive">
            <span className="error-icon">⚠</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';
