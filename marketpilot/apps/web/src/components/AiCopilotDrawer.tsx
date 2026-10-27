import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User as UserIcon, 
  Trash2, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2
} from 'lucide-react';
import { api } from '../lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  domainBlocked?: boolean;
  model?: string;
  source?: string;
}

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const STARTER_SUGGESTIONS = [
  { label: '📊 NIFTY 50 Outlook', prompt: 'NIFTY 50 ka live outlook aur key support & resistance levels kya hain?' },
  { label: '⚡ Bank Nifty Setup', prompt: 'BANK NIFTY me trade plan aur critical breakout levels batao' },
  { label: '🚀 Breakout Screening', prompt: 'Aaj ke top movers aur momentum breakout stocks ka analysis do' },
  { label: '⚖️ 1% Risk Formula', prompt: 'Trading me 1% risk rule aur position sizing formula samjhao' },
  { label: '🛡️ Stop Loss Rules', prompt: 'Hard Stop Loss aur 1:2 Risk to Reward maintain karne ke rules batao' }
];

const CHAT_STORAGE_KEY = 'marketpilot_ai_copilot_chat';

const DEFAULT_WELCOME_MSG: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Namaste! 👋 Main MarketPilot ka **AI Trading Co-Pilot** hoon.\n\nNIFTY 50, Bank Nifty, stock levels ya risk management ke baare me kuch bhi puchein!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  domainBlocked: false
};

export function AiCopilotDrawer({ isOpen, onClose, onOpen }: AiCopilotDrawerProps) {
  // Load past conversation from localStorage if available
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load chat history from localStorage', err);
    }
    return [DEFAULT_WELCOME_MSG];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to save chat to localStorage', err);
    }
  }, [messages]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  // Listen for automated AI analysis events from Scanner or other pages
  useEffect(() => {
    const handleAiAnalyze = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt: string }>;
      if (customEvent.detail && customEvent.detail.prompt) {
        onOpen();
        sendMessage(customEvent.detail.prompt);
      }
    };
    window.addEventListener('marketpilot:ai-analyze', handleAiAnalyze);
    return () => window.removeEventListener('marketpilot:ai-analyze', handleAiAnalyze);
  }, [messages, loading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    const resetMsg: ChatMessage = {
      id: `welcome_${Date.now()}`,
      role: 'assistant',
      content: `Chat history cleared. Stock levels, NIFTY 50 ya setups ke baare me puchein! 📈`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      domainBlocked: false
    };
    setMessages([resetMsg]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {}
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build lightweight message history for backend
      const historyPayload = messages.slice(-5).map(m => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content
      }));

      const res = await api<{
        success: boolean;
        reply: string;
        domainBlocked: boolean;
        source: string;
        model: string;
        contextUsed?: string;
      }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          history: historyPayload
        })
      });

      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: res.reply || 'No response received from AI engine.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        domainBlocked: res.domainBlocked,
        model: res.model,
        source: res.source
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Error**\n\nAI service connect karne me dikkat aayi. Kripya dobara koshish karein.\n\n*Details:* ${err?.message || 'Server did not respond'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        domainBlocked: false
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render markdown-like formatting cleanly without heavy dependencies
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="ai-markdown-container">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Horizontal rule
          if (trimmed === '---') {
            return <hr key={idx} className="ai-hr" />;
          }

          // Headers
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className="ai-h3">
                {formatInline(trimmed.replace('### ', ''))}
              </h3>
            );
          }
          if (trimmed.startsWith('#### ')) {
            return (
              <h4 key={idx} className="ai-h4">
                {formatInline(trimmed.replace('#### ', ''))}
              </h4>
            );
          }

          // Blockquote / Disclaimer
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={idx} className="ai-blockquote">
                {formatInline(trimmed.replace('> ', ''))}
              </blockquote>
            );
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const bulletText = trimmed.replace(/^[-*]\s+/, '');
            return (
              <div key={idx} className="ai-bullet-item">
                <span className="ai-bullet-dot">›</span>
                <span className="ai-bullet-text">{formatInline(bulletText)}</span>
              </div>
            );
          }

          // Numbered list
          if (/^\d+\.\s+/.test(trimmed)) {
            const numMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
            if (numMatch) {
              return (
                <div key={idx} className="ai-numbered-item">
                  <span className="ai-numbered-tag">{numMatch[1]}</span>
                  <span className="ai-numbered-text">{formatInline(numMatch[2])}</span>
                </div>
              );
            }
          }

          // Empty line
          if (!trimmed) {
            return <div key={idx} className="ai-spacer" />;
          }

          // Regular paragraph
          return (
            <p key={idx} className="ai-paragraph">
              {formatInline(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Inline formatting helper for **bold**, `code`, prices, and percentages
  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return <strong key={i} className="ai-bold">{inner}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const inner = part.slice(1, -1);
        return <code key={i} className="ai-inline-code">{inner}</code>;
      }

      // Highlight Indian Rupee values and percentages
      return part;
    });
  };

  return (
    <>
      {/* Floating Circular Bot Button (Bottom Right) */}
      {!isOpen && (
        <button
          className="ai-copilot-launcher-btn"
          onClick={onOpen}
          aria-label="Open MarketPilot AI Co-Pilot"
          title="MarketPilot AI Co-Pilot"
        >
          <Bot size={24} className="ai-launcher-bot-icon" />
          <span className="ai-live-pulse-indicator" />
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className={`ai-copilot-drawer ${isExpanded ? 'expanded' : ''}`}>
          {/* Header */}
          <div className="ai-drawer-header">
            <div className="ai-header-left">
              <div className="ai-avatar-badge">
                <Bot size={20} className="ai-avatar-icon" />
                <span className="ai-status-dot-active" />
              </div>
              <div className="ai-header-info">
                <div className="ai-title-row">
                  <span className="ai-header-title">MarketPilot AI</span>
                </div>
                <div className="ai-header-subtitle">
                  <span className="ai-pulse-dot" />
                  Live Indian Market Intelligence
                </div>
              </div>
            </div>

            <div className="ai-header-actions">
              <button
                className="ai-action-icon-btn"
                onClick={handleClearChat}
                title="Clear Conversation"
                aria-label="Clear Conversation"
              >
                <Trash2 size={16} />
              </button>

              <button
                className="ai-action-icon-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse' : 'Expand'}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                className="ai-action-icon-btn close-btn"
                onClick={onClose}
                title="Close AI Co-Pilot"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Starter Chips */}
          <div className="ai-starter-chips-container">
            {STARTER_SUGGESTIONS.map(s => (
              <button
                key={s.label}
                className="ai-starter-chip"
                onClick={() => sendMessage(s.prompt)}
                disabled={loading}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="ai-drawer-body">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`ai-message-row ${msg.role === 'user' ? 'user-row' : 'assistant-row'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="ai-msg-avatar">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`ai-message-bubble ${
                    msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'
                  }`}
                >
                  {/* Bubble Content */}
                  <div className="ai-bubble-content">
                    {msg.role === 'user' ? (
                      <p className="ai-user-text">{msg.content}</p>
                    ) : (
                      renderFormattedContent(msg.content)
                    )}
                  </div>

                  {/* Bubble Footer */}
                  <div className="ai-bubble-footer">
                    <span className="ai-timestamp">{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <button
                        className="ai-copy-btn"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="ai-msg-avatar user-avatar">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="ai-message-row assistant-row">
                <div className="ai-msg-avatar">
                  <Bot size={16} />
                </div>
                <div className="ai-message-bubble assistant-bubble ai-loading-bubble">
                  <div className="ai-loading-dots">
                    <span className="dot dot-1" />
                    <span className="dot dot-2" />
                    <span className="dot dot-3" />
                  </div>
                  <span className="ai-loading-text">
                    Analyzing live exchange market structure & key levels...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="ai-drawer-footer">
            <form
              className="ai-input-form"
              onSubmit={e => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className="ai-chat-input"
                placeholder="Poochhein (e.g. Reliance support, Nifty trend, 1% risk)..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="ai-send-btn"
                disabled={!input.trim() || loading}
                title="Send Message"
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </form>
            <div className="ai-input-disclaimer">
              <span>MarketPilot AI can make mistakes. Always verify with your risk management rules.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
