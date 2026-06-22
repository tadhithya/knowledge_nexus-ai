import { BrowserRouter as Router, Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import Chat from './pages/Chat';
import Admin from './pages/Admin';

function AppContent() {
  const location = useLocation();
  const isChat = location.pathname === '/chat' || location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center px-4 mx-auto justify-between" style={{ maxWidth: '1200px' }}>
          
          <div className="flex items-center space-x-2">
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🧠</div>
            <span className="font-bold sm:inline-block hidden">Knowledge Nexus</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.05)', padding: '0.25rem', borderRadius: '2rem', display: 'flex', gap: '0.25rem' }}>
            <Link to="/chat" style={{ padding: '0.5rem 1.5rem', borderRadius: '1.5rem', background: isChat ? 'white' : 'transparent', color: isChat ? '#0f172a' : '#64748b', fontWeight: isChat ? 600 : 500, boxShadow: isChat ? '0 2px 10px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', textDecoration: 'none' }}>
              💬 <span className="hidden sm:inline">AI Chat</span>
            </Link>
            <Link to="/admin" style={{ padding: '0.5rem 1.5rem', borderRadius: '1.5rem', background: !isChat ? 'white' : 'transparent', color: !isChat ? '#0f172a' : '#64748b', fontWeight: !isChat ? 600 : 500, boxShadow: !isChat ? '0 2px 10px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', textDecoration: 'none' }}>
              📂 <span className="hidden sm:inline">Knowledge Data</span>
            </Link>
          </div>

          <div style={{ width: '100px' }}></div> {/* Spacer to center the toggle */}
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6" style={{ maxWidth: '1200px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <Chat />
            </div>
          } />
          <Route path="/admin" element={
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <Admin />
            </div>
          } />
        </Routes>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
