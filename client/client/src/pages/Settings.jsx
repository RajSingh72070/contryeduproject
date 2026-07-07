import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Cpu,
  Database,
  Key,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  Sliders,
  Sun,
  Moon,
  Lock
} from 'lucide-react';
import authService from '../services/authService';

const SettingsPage = () => {
  // LLM Config
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Theme Config
  const [theme, setTheme] = useState('dark');

  // Change Password Config
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // UI Toast States
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'

  // Load configs from local storage on mount
  useEffect(() => {
    const savedModel = localStorage.getItem('settings_model');
    const savedTemp = localStorage.getItem('settings_temp');
    const savedChunkSize = localStorage.getItem('settings_chunk_size');
    const savedChunkOverlap = localStorage.getItem('settings_chunk_overlap');
    const savedApiKey = localStorage.getItem('settings_api_key');
    const savedTheme = localStorage.getItem('settings_theme') || 'dark';

    if (savedModel) setModel(savedModel);
    if (savedTemp) setTemperature(parseFloat(savedTemp));
    if (savedChunkSize) setChunkSize(parseInt(savedChunkSize));
    if (savedChunkOverlap) setChunkOverlap(parseInt(savedChunkOverlap));
    if (savedApiKey) setApiKey(savedApiKey);
    
    setTheme(savedTheme);
    applyThemeClass(savedTheme);
  }, []);

  const applyThemeClass = (targetTheme) => {
    if (targetTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const handleSaveConfigs = (e) => {
    e.preventDefault();
    localStorage.setItem('settings_model', model);
    localStorage.setItem('settings_temp', temperature.toString());
    localStorage.setItem('settings_chunk_size', chunkSize.toString());
    localStorage.setItem('settings_chunk_overlap', chunkOverlap.toString());
    localStorage.setItem('settings_api_key', apiKey);
    localStorage.setItem('settings_theme', theme);

    applyThemeClass(theme);
    showToast('System settings saved successfully!');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill out all password fields.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setPwdLoading(true);
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      if (response.status === 'success') {
        showToast('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Password change failure:', err);
      showToast(err.response?.data?.message || 'Incorrect current password.', 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  const toggleThemeState = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    // Realtime toggle preview
    applyThemeClass(nextTheme);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed top-20 right-6 p-4 rounded-xl shadow-2xl flex items-center space-x-3 z-50 backdrop-blur-md border ${
            toastType === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-450'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </motion.div>
      )}

      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">System Settings</h2>
        <p className="mt-1 text-sm text-slate-400">
          Configure model options, parameters for chunking text files, theme modes, and change account passwords.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Core RAG & LLM Configurations */}
        <form onSubmit={handleSaveConfigs} className="space-y-6">
          {/* Theme Mode Toggle Card */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-200">Interface Theme Mode</h3>
              <p className="text-xs text-slate-500 mt-1">
                Toggle between dark mode (default) and standard light mode parameters.
              </p>
            </div>
            
            <button
              type="button"
              onClick={toggleThemeState}
              className="flex items-center space-x-2 py-2 px-4 rounded-xl text-xs font-bold text-slate-350 hover:text-white bg-slate-950/65 border border-slate-800/80 hover:border-slate-700 transition-all select-none"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-450" />
                  <span>Switch to Light Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-brand-400" />
                  <span>Switch to Dark Theme</span>
                </>
              )}
            </button>
          </div>

          {/* AI Model Configuration Card */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <Cpu className="w-5 h-5 text-brand-400" />
              <h3 className="text-base font-bold text-slate-200">AI Model Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Model Select */}
              <div>
                <label htmlFor="model-select" className="block text-sm font-semibold text-slate-350">
                  Large Language Model
                </label>
                <select
                  id="model-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 text-sm animate-fade-in"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Default - Recommended)</option>
                  <option value="gpt-4o">GPT-4o (High Reasoning)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
                </select>
              </div>

              {/* Temperature Slider */}
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="temp-slider" className="block text-sm font-semibold text-slate-350">
                    Temperature
                  </label>
                  <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                    {temperature}
                  </span>
                </div>
                <input
                  id="temp-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="mt-4 block w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-650 mt-2">
                  <span>Deterministic</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>
          </div>

          {/* RAG Chunk parameters */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <Database className="w-5 h-5 text-brand-400" />
              <h3 className="text-base font-bold text-slate-200">Text Chunking Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chunk Size */}
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="chunk-size-slider" className="block text-sm font-semibold text-slate-350">
                    Chunk Size (Tokens)
                  </label>
                  <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                    {chunkSize}
                  </span>
                </div>
                <input
                  id="chunk-size-slider"
                  type="range"
                  min="100"
                  max="1500"
                  step="50"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value))}
                  className="mt-4 block w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
                />
              </div>

              {/* Chunk Overlap */}
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="chunk-overlap-slider" className="block text-sm font-semibold text-slate-350">
                    Chunk Overlap (Tokens)
                  </label>
                  <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                    {chunkOverlap}
                  </span>
                </div>
                <input
                  id="chunk-overlap-slider"
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                  className="mt-4 block w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* API Credentials */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <Key className="w-5 h-5 text-brand-400" />
              <h3 className="text-base font-bold text-slate-200">API Access Credentials</h3>
            </div>

            <div>
              <label htmlFor="api-key-input" className="block text-sm font-semibold text-slate-350">
                OpenAI API Key
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <input
                  id="api-key-input"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="block w-full pr-10 py-3 pl-4 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors animate-fade-in"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Your API Key is kept secure and used only locally to execute queries on models.
              </p>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Configurations</span>
            </button>
          </div>
        </form>

        {/* Change Account Password Form */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <Lock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-200">Change Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="curr-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Current Password
              </label>
              <input
                id="curr-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 block w-full px-4 py-3 bg-slate-950/85 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="•••••••• (Min 6 characters)"
                className="mt-2 block w-full px-4 py-3 bg-slate-950/85 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 block w-full px-4 py-3 bg-slate-950/85 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={pwdLoading}
                className="flex items-center space-x-2 py-3 px-6 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-750 active:scale-[0.98] transition-all border border-slate-750"
              >
                <span>{pwdLoading ? 'Saving Password...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
