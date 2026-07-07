import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  Zap,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import knowledgeService from '../services/knowledgeService';

const Dashboard = () => {
  const { user } = useAuth();
  const [ragStats, setRagStats] = useState({
    documentsTotal: 0,
    vectorCount: 0,
    documentsIndexed: 0,
    status: 'checking',
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await knowledgeService.getStats();
        if (response.status === 'success') {
          setRagStats(response.data);
        }
      } catch (err) {
        console.error('Failed to retrieve RAG stats:', err);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      name: 'Total Documents',
      value: ragStats.documentsTotal.toString(),
      change: `${ragStats.documentsIndexed} indexed in ChromaDB`,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Active Chats',
      value: '1,482',
      change: '+28% monthly volume',
      icon: MessageSquare,
      color: 'from-brand-500 to-indigo-500',
    },
    {
      name: 'Avg API Response',
      value: '420 ms',
      change: '-40 ms optimization',
      icon: Zap,
      color: 'from-amber-500 to-orange-500',
    },
    {
      name: 'Vector Database (RAG)',
      value: `${ragStats.vectorCount} nodes`,
      change: `ChromaDB status: ${ragStats.status}`,
      icon: Database,
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  const recentActivity = [
    { id: 1, action: 'Document processed', target: 'API_Documentation.pdf', time: '10 minutes ago', status: 'success' },
    { id: 2, action: 'Vector embeddings created', target: 'Company_Guidelines.docx', time: '1 hour ago', status: 'success' },
    { id: 3, action: 'User query fallback', target: 'Session #8472', time: '2 hours ago', status: 'warning' },
    { id: 4, action: 'Model fine-tuning config updated', target: 'gpt-4o-mini', time: '1 day ago', status: 'success' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-slate-900 via-slate-900 to-brand-950/20 p-8 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Hello, {user?.name ? user.name.split(' ')[0] : 'Operator'}!
          </h2>
          <p className="mt-2 text-slate-400 max-w-xl">
            Welcome to your **SupportGPT** agent control room. Monitor system metrics, manage knowledge documents, and converse with customers in real-time.
          </p>
        </div>
      </motion.div>

      {/* Statistics Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              variants={itemVariants}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl hover:border-slate-700/60 transition-all duration-300 group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">{stat.name}</p>
                  <p className="text-3xl font-extrabold text-white mt-2 tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-tr ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-slate-400">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>{stat.change}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Lower grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mock Analytics Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Daily Conversations Activity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Average customer chat interactions</p>
            </div>
            <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              +14% efficiency
            </span>
          </div>

          {/* Styled SVGs mimicking chart lines */}
          <div className="h-64 relative flex items-end">
            {/* Grid background lines */}
            <div className="absolute inset-x-0 top-0 h-px bg-slate-800/40" />
            <div className="absolute inset-x-0 top-1/4 h-px bg-slate-800/40" />
            <div className="absolute inset-x-0 top-2/4 h-px bg-slate-800/40" />
            <div className="absolute inset-x-0 top-3/4 h-px bg-slate-800/40" />

            <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 100 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0e8ce4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0e8ce4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Area graph */}
              <path
                d="M0,50 L0,38 L15,42 L30,22 L45,35 L60,15 L75,10 L90,5 L100,2 L100,50 Z"
                fill="url(#chartGrad)"
              />
              {/* Stroke line */}
              <path
                d="M0,38 L15,42 L30,22 L45,35 L60,15 L75,10 L90,5 L100,2"
                fill="none"
                stroke="#0e8ce4"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="flex justify-between text-xs font-semibold text-slate-500 mt-4 border-t border-slate-800/60 pt-4">
            <span>09:00 AM</span>
            <span>12:00 PM</span>
            <span>03:00 PM</span>
            <span>06:00 PM</span>
            <span>09:00 PM</span>
          </div>
        </motion.div>

        {/* Recent Events / Activity logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Recent System Logs</h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex justify-between items-start text-xs border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-slate-300">{activity.action}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[180px]">{activity.target}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500">{activity.time}</span>
                    <span className={`flex items-center justify-end font-semibold mt-1 ${
                      activity.status === 'success' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {activity.status === 'success' ? 'Active' : 'Warning'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full flex items-center justify-center space-x-1 py-2 px-3 mt-4 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/60 rounded-xl transition-all">
            <span>View detailed audit log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
