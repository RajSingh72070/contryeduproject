import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  MessageSquare,
  Search,
  ChevronRight,
  Calendar,
  Layers,
  ArrowUpRight,
  Trash2,
  Cpu,
  RefreshCw
} from 'lucide-react';
import chatService from '../services/chatService';

const ChatHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await chatService.getHistory();
      if (response.status === 'success') {
        setSessions(response.data);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this chat session log?')) {
      try {
        await chatService.deleteSession(id);
        setSessions((prev) => prev.filter((sess) => sess.id !== id));
      } catch (err) {
        console.error('Failed to delete session:', err);
        alert('Failed to delete session: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to permanently clear all conversation history sessions?')) {
      try {
        await chatService.clearHistory();
        setSessions([]);
      } catch (err) {
        console.error('Failed to clear history:', err);
        alert('Failed to clear history: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const filteredSessions = sessions.filter(
    (sess) =>
      sess.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sess.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Chat History</h2>
          <p className="mt-1 text-sm text-slate-400">
            Access previous AI chat support sessions to review operator interactions and query answers.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Refresh button */}
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh history"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Clear All button */}
          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition-all shrink-0"
              title="Clear all sessions logs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          )}

          {/* Search */}
          <div className="relative flex-1 sm:w-64 text-slate-400">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/60 backdrop-blur-md border border-slate-805 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 rounded-xl text-sm placeholder-slate-500 text-slate-200 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* History Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
            <p className="text-sm font-semibold">Loading histories...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-12 text-center text-slate-500 flex flex-col items-center rounded-2xl shadow-xl">
            <History className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-semibold">No historical sessions found</p>
            <p className="text-xs text-slate-600 mt-1">
              {searchQuery ? 'Try matching a different keyword query.' : 'Chat history list is empty. Start a conversation in the AI Chat tab.'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/60 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-default transition-all duration-300 group"
              >
                <div className="flex items-start space-x-4 min-w-0 flex-1">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-brand-400 group-hover:border-brand-500/20 group-hover:shadow-md transition-all shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                      {session.topic}
                    </h4>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {session.date}
                      </span>
                      <span className="flex items-center">
                        <Layers className="w-3.5 h-3.5 mr-1 text-slate-600" />
                        {session.messages} logs
                      </span>
                      <span className="flex items-center">
                        <Cpu className="w-3.5 h-3.5 mr-1 text-slate-605" />
                        {session.model}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-center">
                  <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {session.category}
                  </span>

                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-2 rounded-lg bg-slate-950/60 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-500 hover:text-red-400 transition-all duration-200"
                    title="Delete session log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
