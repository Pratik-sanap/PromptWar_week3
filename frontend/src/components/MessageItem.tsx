import React from 'react';
import { StructuredDataCard } from './StructuredDataCard';
import type { StructuredData } from './StructuredDataCard';

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  language?: string;
  timestamp: Date;
  structuredData?: StructuredData;
}

interface MessageItemProps {
  message: Message;
}

/**
 * MessageItem component renders a single chat message bubble,
 * displaying the sender (user or assistant), text, timestamp,
 * and any optional structured data card.
 *
 * @param props Contains the message object to display.
 */
export const MessageItem: React.FC<MessageItemProps> = React.memo(
  ({ message }) => {
    const isUser = message.sender === 'user';

    const timeStr = message.timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div
        className={`message-item-container ${isUser ? 'user-item' : 'assistant-item'}`}
        role="listitem"
        aria-label={`${isUser ? 'User' : 'Assistant'} message sent at ${timeStr}`}
      >
        <div className="message-wrapper">
          {/* Render structured card above the assistant chat bubble if it exists */}
          {!isUser && message.structuredData && (
            <StructuredDataCard structured={message.structuredData} />
          )}

          {/* Message bubble */}
          {message.text && (
            <div
              className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}
            >
              <p className="message-text">{message.text}</p>
              <span className="message-time" aria-hidden="true">
                {timeStr}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

MessageItem.displayName = 'MessageItem';
