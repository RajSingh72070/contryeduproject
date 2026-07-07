import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit2,
  CheckCircle2,
  Clock,
  Key,
  Camera,
  Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSavedSuccess(false);

    try {
      const response = await authService.updateProfile(name, email);
      if (response.status === 'success') {
        updateUser(response.data);
        setIsEditing(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update profile information.');
    }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB for profile picture)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Profile picture must be under 5MB.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSavedSuccess(false);

    try {
      const response = await authService.uploadAvatar(file);
      if (response.status === 'success') {
        updateUser({ profilePicture: response.data.profilePicture });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  // Construct absolute avatar URL or display fallback initials
  const getAvatarUrl = () => {
    if (user?.profilePicture) {
      // If user profile picture starts with '/' or 'http'
      if (user.profilePicture.startsWith('http')) {
        return user.profilePicture;
      }
      // Point to our Vite proxy API path which forwards /uploads to server static folder
      return user.profilePicture;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Account Profile</h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage your personal operator identity details, permissions, and session privileges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card Summary */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl space-y-6 flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-brand-500/20 group-hover:border-brand-500/55 transition-all shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-650 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:from-brand-500 group-hover:to-indigo-500 transition-all">
                <span className="text-white font-extrabold text-3xl">
                  {name ? name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
            )}
            
            {/* Upload indicator Overlay */}
            <div className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {uploading ? (
                <Loader className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
            disabled={uploading}
          />

          <div className="text-center">
            <h3 className="text-lg font-bold text-white">{name || 'Operator'}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">{email}</p>
          </div>
          <div className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-xl text-xs font-semibold">
            <Shield className="w-4 h-4 shrink-0" />
            <span>Role Access: {user?.role ? user.role.toUpperCase() : 'USER'}</span>
          </div>
        </div>

        {/* Edit profile details */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-200">Operator Details</h3>
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setErrorMsg('');
              }}
              className="flex items-center space-x-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile details updated successfully.</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                className="mt-2 block w-full px-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="profile-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                className="mt-2 block w-full px-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                required
              />
            </div>

            {isEditing && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center space-x-2 py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 active:scale-[0.98] transition-all"
                >
                  <span>Apply Changes</span>
                </button>
              </div>
            )}
          </form>

          {/* Account statistics logs */}
          <div className="border-t border-slate-800 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-slate-950/40 border border-slate-805 rounded-xl">
              <Calendar className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Created</p>
                <p className="text-xs font-semibold text-slate-200">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-slate-950/40 border border-slate-805 rounded-xl">
              <Key className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Auth Session</p>
                <p className="text-xs font-semibold text-slate-200">JWT Token Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
