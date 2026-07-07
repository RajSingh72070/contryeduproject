import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  History,
  UploadCloud,
  Database,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Shield
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('settings_theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  const baseNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare },
    { name: 'Chat History', path: '/chat-history', icon: History },
    { name: 'Upload Documents', path: '/upload', icon: UploadCloud },
    { name: 'Knowledge Base', path: '/knowledge-base', icon: Database },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const navItems = user?.role === 'admin'
    ? [...baseNavItems, { name: 'Admin Panel', path: '/dashboard/admin', icon: Shield }]
    : baseNavItems;

  const getPageTitle = () => {
    const current = navItems.find((item) => item.path === location.pathname);
    return current ? current.name : 'Dashboard';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* 1. Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* 2. Sidebar Component */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/80 z-50 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-sm">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Support<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">GPT</span>
            </span>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 group ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-brand-600/20 to-indigo-600/10 border border-brand-500/20 shadow-md shadow-brand-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-6 bg-brand-500 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Profile Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
          <div className="flex items-center space-x-3 p-2 rounded-xl border border-transparent">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || 'User Name'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'user@email.com'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 3. Main Workspace Shell */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-30">
          <div className="flex items-center space-x-4">
            {/* Hamburger Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-white font-sans">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications Alert Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border border-slate-900 animate-pulse"></span>
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 space-y-3"
                    >
                      <h4 className="font-semibold text-slate-200 border-b border-slate-800 pb-2">Notifications</h4>
                      <div className="space-y-2">
                        <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50 hover:bg-slate-950/60 transition-colors">
                          <p className="text-xs font-semibold text-brand-400">System Ready</p>
                          <p className="text-xs text-slate-400 mt-0.5">Your support agent workspace is operational.</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50 hover:bg-slate-950/60 transition-colors">
                          <p className="text-xs font-semibold text-indigo-400">Knowledge Base Update</p>
                          <p className="text-xs text-slate-400 mt-0.5">Upload new PDF documents to start chat context.</p>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 transition-all text-slate-200"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="User Profile"
                    className="w-7 h-7 rounded-lg object-cover border border-slate-800"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-sm font-semibold max-w-[100px] truncate hidden sm:inline">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:inline" />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl py-2 shadow-2xl z-50"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-800">
                        <p className="text-sm font-semibold text-slate-200">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/40 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/40 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>Settings</span>
                        </Link>
                      </div>
                      <div className="border-t border-slate-800 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Outlet Panel */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
