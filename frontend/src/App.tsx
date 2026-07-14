import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageList } from './components/MessageList';
import type { Message } from './components/MessageItem';
import type { StructuredData } from './components/StructuredDataCard';

// Available Languages
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' }
];

// Available Stadium Zones
const ZONES = [
  { id: 'zone_a', label: 'Zone A - North Gate / Ramp access' },
  { id: 'zone_b', label: 'Zone B - East Seating' },
  { id: 'zone_c', label: 'Zone C - South Concourse' },
  { id: 'zone_d', label: 'Zone D - West Seating' },
  { id: 'zone_e', label: 'Zone E - Premium Suite' },
  { id: 'zone_f', label: 'Zone F - Press Box & Pitchside' }
];

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('en');
  const [zone, setZone] = useState('zone_a');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState({
    wheelchair: false,
    visual: false
  });
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false); // Default to false — use real backend; toggle on for offline demo

  const sessionIdRef = useRef<string>('');

  // Generate unique sessionId on mount
  useEffect(() => {
    sessionIdRef.current = 'session-' + Math.random().toString(36).substring(2, 11);
  }, []);

  // Handle Accessibility Needs toggle
  const handleAccessibilityToggle = (type: 'wheelchair' | 'visual') => {
    setAccessibilityNeeds(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Mock response helper for demonstration / fallback
  const getMockResponse = (text: string, lang: string, acc: typeof accessibilityNeeds, zoneId: string): { reply: string; structuredData?: StructuredData } => {
    const cleanText = text.toLowerCase();
    const zoneLabel = ZONES.find(z => z.id === zoneId)?.label || zoneId;

    if (cleanText.includes('gate') || cleanText.includes('entrance') || cleanText.includes('puerta') || cleanText.includes('porte') || cleanText.includes('بوابة')) {
      if (acc.wheelchair) {
        if (lang === 'es') {
          return {
            reply: `Según su solicitud de asistencia en silla de ruedas en ${zoneLabel}, le recomendamos la Puerta A1. Cuenta con una rampa accesible dedicada y el tiempo de espera de la cola es actualmente Bajo.`,
            structuredData: {
              type: 'gate_recommendation',
              data: { gateName: 'Gate A1', distance: '75m', queueStatus: 'Low', accessible: true }
            }
          };
        }
        if (lang === 'fr') {
          return {
            reply: `Selon vos besoins en fauteuil roulant à la ${zoneLabel}, nous vous recommandons la Porte A1. Elle dispose d'une rampe d'accès dédiée et le temps d'attente est actuellement Faible.`,
            structuredData: {
              type: 'gate_recommendation',
              data: { gateName: 'Gate A1', distance: '75m', queueStatus: 'Low', accessible: true }
            }
          };
        }
        if (lang === 'ar') {
          return {
            reply: `بناءً على طلبك للكراسي المتحركة في ${zoneLabel}، نوصي بالبوابة A1. تحتوي على منحدر مخصص لذوي الاحتياجات الخاصة ووقت الانتظار قصير جداً حالياً.`,
            structuredData: {
              type: 'gate_recommendation',
              data: { gateName: 'Gate A1', distance: '75m', queueStatus: 'Low', accessible: true }
            }
          };
        }
        return {
          reply: `Based on your wheelchair accessibility profile at ${zoneLabel}, I recommend Gate A1. It has a dedicated ramp and the queue is currently Low (under 3 min wait).`,
          structuredData: {
            type: 'gate_recommendation',
            data: { gateName: 'Gate A1', distance: '75m', queueStatus: 'Low', accessible: true }
          }
        };
      } else {
        // Standard gate recommendation
        if (lang === 'es') {
          return {
            reply: `La puerta más cercana a su zona (${zoneLabel}) es la Puerta B3. Hay una cola moderada con una espera estimada de 10 minutos.`,
            structuredData: {
              type: 'gate_recommendation',
              data: { gateName: 'Gate B3', distance: '130m', queueStatus: 'Medium', accessible: false }
            }
          };
        }
        if (lang === 'fr') {
          return {
            reply: `La porte la plus proche de votre zone (${zoneLabel}) est la Porte B3. Il y a une file d'attente modérée avec une attente estimée de 10 minutes.`,
            structuredData: {
              type: 'gate_recommendation',
              data: { gateName: 'Gate B3', distance: '130m', queueStatus: 'Medium', accessible: false }
            }
          };
        }
        if (lang === 'ar') {
          return {
            reply: `البوابة الأقرب إلى منطقتك (${zoneLabel}) هي البوابة B3. هناك طابور متوسط مع وقت انتظار يقدر بـ 10 دقائق.`,
            structuredData: {
              type: 'gate_recommendation',
              data: { gateName: 'Gate B3', distance: '130m', queueStatus: 'Medium', accessible: false }
            }
          };
        }
        return {
          reply: `The closest gate to your location in ${zoneLabel} is Gate B3. Note that queue wait time is Medium (approx. 10 mins).`,
          structuredData: {
            type: 'gate_recommendation',
            data: { gateName: 'Gate B3', distance: '130m', queueStatus: 'Medium', accessible: false }
          }
        };
      }
    }

    if (cleanText.includes('transport') || cleanText.includes('bus') || cleanText.includes('train') || cleanText.includes('shuttle') || cleanText.includes('metro') || cleanText.includes('قطار') || cleanText.includes('حافلة')) {
      const options = [
        { mode: 'train', line: 'Metro Line 1 (Stadium South)', eta: '3 mins' },
        { mode: 'bus', line: 'Express Shuttle 501', eta: '7 mins' }
      ];
      if (acc.wheelchair) {
        options.push({ mode: 'shuttle', line: 'ADA Cart Shuttle', eta: '4 mins' });
      }
      
      if (lang === 'es') {
        return {
          reply: `Aquí están las opciones de transporte disponibles desde ${zoneLabel}. El metro es el más rápido, y disponemos de un carrito de golf ADA si requiere asistencia directa.`,
          structuredData: { type: 'transport_options', data: { options } }
        };
      }
      if (lang === 'fr') {
        return {
          reply: `Voici les options de transport disponibles depuis la ${zoneLabel}. Le métro est le plus rapide, et une navette ADA est disponible si vous avez besoin d'assistance.`,
          structuredData: { type: 'transport_options', data: { options } }
        };
      }
      if (lang === 'ar') {
        return {
          reply: `إليك خيارات النقل المتاحة من ${zoneLabel}. المترو هو الأسرع، وهناك عربة جولف مخصصة لذوي الاحتياجات الخاصة متاحة عند الطلب.`,
          structuredData: { type: 'transport_options', data: { options } }
        };
      }
      return {
        reply: `Here are the transit lines servicing ${zoneLabel}. Metro Line 1 is the fastest option. Accessible shuttle carts are standing by.`,
        structuredData: { type: 'transport_options', data: { options } }
      };
    }

    if (cleanText.includes('crowd') || cleanText.includes('busy') || cleanText.includes('density') || cleanText.includes('people') || cleanText.includes('زدحام')) {
      const isHigh = zoneId === 'zone_c' || zoneId === 'zone_b';
      const density = isHigh ? '85%' : '40%';
      const status = isHigh ? 'Busy' : 'Normal';
      
      if (lang === 'es') {
        return {
          reply: `La densidad de público actual en la ${zoneLabel} es del ${density} (${status === 'Busy' ? 'Concurrido' : 'Normal'}). El flujo de personas es constante.`,
          structuredData: {
            type: 'crowd_density',
            data: { zone: zoneId, density, status: isHigh ? 'Busy' : 'Normal' }
          }
        };
      }
      if (lang === 'fr') {
        return {
          reply: `La densité de foule actuelle dans la ${zoneLabel} est de ${density} (${status === 'Busy' ? 'Bondé' : 'Normal'}). La circulation reste fluide.`,
          structuredData: {
            type: 'crowd_density',
            data: { zone: zoneId, density, status: isHigh ? 'Busy' : 'Normal' }
          }
        };
      }
      if (lang === 'ar') {
        return {
          reply: `كثافة الجمهور الحالية في ${zoneLabel} هي ${density} (${status === 'Busy' ? 'مزدحم' : 'طبيعي'}). تدفق الجمهور مستقر حتى الآن.`,
          structuredData: {
            type: 'crowd_density',
            data: { zone: zoneId, density, status: isHigh ? 'Busy' : 'Normal' }
          }
        };
      }
      return {
        reply: `Current crowd density in ${zoneLabel} is ${density} (${status}). Movement is fluid, but consider alternative corridors to avoid lines.`,
        structuredData: {
          type: 'crowd_density',
          data: { zone: zoneId, density, status }
        }
      };
    }

    // Default concierges
    if (lang === 'es') {
      return { reply: "¡Hola! Soy su asistente inteligente del estadio para el Mundial FIFA 2026. Pregúnteme sobre la puerta más cercana, el transporte o la densidad de público en su zona." };
    }
    if (lang === 'fr') {
      return { reply: "Bonjour! Je suis votre concierge intelligent de la Coupe du Monde de la FIFA 2026. N'hésitez pas à me demander des directions de portes, les transports ou la densité de foule." };
    }
    if (lang === 'ar') {
      return { reply: "مرحباً! أنا المساعد الذكي لكأس العالم لكرة القدم 2026. يمكنك الاستفسار عن أقرب بوابة، خيارات النقل، أو حالة الازدحام في منطقتك." };
    }
    return { reply: "Hello! I am your FIFA World Cup 2026 Smart Stadium Concierge. Ask me about gates, transportation, accessibility routes, or crowd density in your zone." };
  };

  // Submit chat message handler
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
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
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    if (mockMode) {
      // Simulate network delay for Mock Mode
      setTimeout(() => {
        const res = getMockResponse(userText, language, accessibilityNeeds, zone);
        const newAssistantMsg: Message = {
          id: `msg-${Date.now()}-assistant`,
          sender: 'assistant',
          text: res.reply,
          language,
          timestamp: new Date(),
          structuredData: res.structuredData
        };
        setMessages(prev => [...prev, newAssistantMsg]);
        setIsTyping(false);
      }, 1000);
    } else {
      // Live Mode API Call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

      try {
        // Build history from current messages for multi-turn context (API_CONTRACT.md)
        const historyForApi = messages.map(m => ({
          sender: m.sender === 'user' ? 'user' : 'assistant',
          text: m.text
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            language,
            sessionId: sessionIdRef.current,
            zone,
            accessibilityNeeds,
            history: historyForApi
          }),
          signal: controller.signal
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
            structuredData: data.structuredData
          };
          setMessages(prev => [...prev, newAssistantMsg]);
        } else if (response.body) {
          // Streamed response (e.g. text/event-stream or chunked text)
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');

          const assistantMsgId = `msg-${Date.now()}-assistant`;
          const initialAssistantMsg: Message = {
            id: assistantMsgId,
            sender: 'assistant',
            text: '',
            language,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, initialAssistantMsg]);

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
              const lines = chunk.split('\n');

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('data:')) {
                  const dataStr = trimmed.slice(5).trim();
                  if (dataStr === '[DONE]') {
                    continue;
                  }
                  try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.reply) {
                      accumulatedText += parsed.reply;
                    }
                    if (parsed.structuredData) {
                      structuredData = parsed.structuredData;
                    }
                  } catch {
                    accumulatedText += dataStr;
                  }
                } else {
                  try {
                    const parsed = JSON.parse(trimmed);
                    if (parsed.reply) {
                      accumulatedText += parsed.reply;
                    }
                    if (parsed.structuredData) {
                      structuredData = parsed.structuredData;
                    }
                  } catch {
                    accumulatedText += trimmed;
                  }
                }
              }

              setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                  ? { ...msg, text: accumulatedText, structuredData: structuredData || msg.structuredData }
                  : msg
              ));
            }
          }
        } else {
          throw new Error('Response body is not readable');
        }
      } catch (err: any) {
        console.error(err);
        if (err.name === 'AbortError') {
          setError('The request timed out. Please check your network connection and try again.');
        } else {
          setError('Failed to reach the live assistant. Ensure the backend server is running, or switch on Mock Mode.');
        }
      } finally {
        setIsTyping(false);
      }
    }
  }, [inputText, language, zone, accessibilityNeeds, mockMode]);

  return (
    <>
      {/* Sidebar Controls */}
      <aside className="sidebar" aria-label="Stadium Context Panel">
        <header className="brand-header">
          <span className="brand-logo" role="img" aria-label="Soccer ball logo">⚽</span>
          <div className="brand-title">
            <h1>FIFA 2026</h1>
            <p>Smart Stadium Concierge</p>
          </div>
        </header>

        <hr className="sidebar-divider" />

        <div className="control-section">
          {/* Language Selector */}
          <div className="control-group">
            <label htmlFor="lang-select" className="control-label">Preferred Language</label>
            <select 
              id="lang-select" 
              className="select-control"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Select language for conversation"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          {/* Zone Selector */}
          <div className="control-group">
            <label htmlFor="zone-select" className="control-label">Your Stadium Zone</label>
            <select 
              id="zone-select" 
              className="select-control"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              aria-label="Select your current stadium zone"
            >
              {ZONES.map(z => (
                <option key={z.id} value={z.id}>{z.label}</option>
              ))}
            </select>
          </div>

          {/* Accessibility Settings */}
          <div className="control-group">
            <span className="control-label">Accessibility Settings</span>
            
            {/* Wheelchair toggle */}
            <button 
              type="button"
              className={`toggle-card ${accessibilityNeeds.wheelchair ? 'active' : ''}`}
              onClick={() => handleAccessibilityToggle('wheelchair')}
              aria-pressed={accessibilityNeeds.wheelchair}
              aria-label="Toggle Wheelchair or Ramp assistance routes"
            >
              <div className="toggle-info">
                <span className="toggle-title">Wheelchair Access</span>
                <span className="toggle-desc">Ramps, elevators, flat paths</span>
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
              className={`toggle-card ${accessibilityNeeds.visual ? 'active' : ''}`}
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
        <MessageList 
          messages={messages} 
          isTyping={isTyping} 
          error={error} 
        />

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
              <svg className="send-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
          <span className="input-footer-hint">
            FIFA Smart Stadium Concierge | Simulated Live feeds | Language: {LANGUAGES.find(l => l.code === language)?.label}
          </span>
        </div>
      </main>
    </>
  );
};

export default App;
