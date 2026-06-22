import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', content: '👋 Hello! I am **Knowledge Nexus AI**. I have been upgraded to the cloud using Google Gemini! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Voice Interface State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    // Strip markdown before speaking
    const cleanText = text.replace(/[*#`_~>]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    // Optionally set a specific voice if desired
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setLoading(true);

    const userMsg: Message = { id: Date.now(), role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Server error');
      }

      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.answer }]);
      speakText(data.answer);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `❌ Error: ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 8rem)', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🧠</div>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>Knowledge Nexus AI</h2>
            <p style={{ margin: 0, color: '#a5b4fc', fontSize: '0.8rem' }}>Powered by Google Gemini API · Cloud Deployed</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }}></div>
            <span style={{ color: '#86efac', fontSize: '0.75rem', fontWeight: 600 }}>Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map(msg => (
          <motion.div 
            key={msg.id} 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            {msg.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', marginRight: '0.6rem', flexShrink: 0, alignSelf: 'flex-end' }}>🧠</div>
            )}
            <div style={{
              maxWidth: '75%',
              padding: '0.85rem 1.1rem',
              borderRadius: msg.role === 'user' ? '1.2rem 1.2rem 0.3rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.3rem',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(255,255,255,0.07)',
              color: 'white',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none',
              backdropFilter: 'blur(10px)',
              overflowX: 'auto',
            }} className="markdown-body">
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
            {msg.role === 'user' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', marginLeft: '0.6rem', flexShrink: 0, alignSelf: 'flex-end' }}>👤</div>
            )}
          </motion.div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🧠</div>
            <div style={{ padding: '0.85rem 1.1rem', background: 'rgba(255,255,255,0.07)', borderRadius: '1.2rem 1.2rem 1.2rem 0.3rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', animation: `bounce 1.2s ${i * 0.2}s infinite` }}></div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(255,255,255,0.07)', borderRadius: '0.875rem', padding: '0.4rem 0.4rem 0.4rem 1.1rem', border: '1px solid rgba(255,255,255,0.12)' }}>
          <button
            onClick={toggleListen}
            style={{
              background: isListening ? '#ef4444' : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: '50%', width: '38px', height: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.2rem'
            }}
            title={isListening ? 'Stop listening' : 'Start speaking'}
          >
            {isListening ? '🔴' : '🎤'}
          </button>
          <input
            type="text"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '0.95rem', lineHeight: 1.5 }}
            placeholder={isListening ? 'Listening...' : 'Ask anything...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={loading}
          />
          <button
            id="send-btn"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: '0.625rem', padding: '0.6rem 1.2rem', color: 'white', fontWeight: 600,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontSize: '0.9rem', transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '...' : '➤ Send'}
          </button>
        </div>
        <p style={{ margin: '0.5rem 0 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
          Knowledge Nexus AI · Google Gemini API · Cloud Ready
        </p>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      `}</style>
    </div>
  );
}
