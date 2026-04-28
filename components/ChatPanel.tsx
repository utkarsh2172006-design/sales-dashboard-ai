'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageCircle, X } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const SUGGESTED = [
  'Which product has the highest revenue?',
  'Which region is underperforming?',
  'What is the current profit margin?',
  'Who is the top salesperson?',
];

export default function ChatPanel({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your AI Sales Analyst. Ask me anything about your sales data — trends, top performers, risks, opportunities.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const q = text || input.trim();
    if (!q) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title-row">
          <Bot size={16} style={{ color: '#6366f1' }} />
          <span>AI Sales Analyst</span>
          <span className="gemini-badge">Gemini</span>
        </div>
        <button className="chat-close" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            <div className="chat-avatar">
              {m.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className="chat-bubble">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <div className="chat-avatar"><Bot size={14} /></div>
            <div className="chat-bubble typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="chat-suggestions">
          {SUGGESTED.map((s, i) => (
            <button key={i} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Ask about your sales data…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={loading}
        />
        <button className="chat-send" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
          {loading ? <Loader2 size={14} className="spinning" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}
