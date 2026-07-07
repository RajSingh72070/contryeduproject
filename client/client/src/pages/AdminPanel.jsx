import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  FileText,
  Database,
  Search,
  Trash2,
  RefreshCw,
  UploadCloud,
  FileText as FileIcon,
  CheckCircle2,
  AlertTriangle,
  Play,
  Activity
} from 'lucide-react';
import adminService from '../services/adminService';

const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    indexedDocuments: 0,
    failedDocuments: 0,
    chromaStatus: 'checking',
    vectorCount: 0,
  });

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reindexing, setReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState('');

  // Upload States
  const [dragActive, setDragActive] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const fileInputRef = useRef(null);

  const fetchStatsAndDocs = async () => {
    setLoading(true);
    try {
      const statsRes = await adminService.getStats();
      if (statsRes.status === 'success') {
        setStats(statsRes.data);
      }

      const docsRes = await adminService.getDocuments(searchQuery);
      if (docsRes.status === 'success') {
        setDocuments(docsRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndDocs();
  }, [searchQuery]);

  const handleDelete = async (id) => {
    if (confirm('Delete this file and its vector store embeddings globally? (This cannot be undone)')) {
      try {
        const response = await adminService.deleteDocument(id);
        if (response.status === 'success') {
          setDocuments((prev) => prev.filter((d) => d._id !== id));
          // Refresh statistics
          const statsRes = await adminService.getStats();
          if (statsRes.status === 'success') setStats(statsRes.data);
        }
      } catch (err) {
        console.error('Failed to delete doc:', err);
        alert('Deletion failed: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    setReindexResult('Starting global vector reindexing...');
    try {
      const response = await adminService.reindex();
      if (response.status === 'success') {
        const { indexedCount, failedCount } = response.data;
        setReindexResult(`System reindexing successful! Generated embeddings for ${indexedCount} document(s). Failures: ${failedCount}.`);
        // Refresh values
        fetchStatsAndDocs();
      }
    } catch (err) {
      console.error('Failed to reindex:', err);
      setReindexResult('Reindexing failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setReindexing(false);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      addUploadFiles(e.target.files);
    }
  };

  const addUploadFiles = (selectedFiles) => {
    const validExtensions = ['PDF', 'DOCX', 'TXT'];
    const maxSizeBytes = 20 * 1024 * 1024; // 20MB
    const filesArray = Array.from(selectedFiles).map((file) => {
      const ext = file.name.split('.').pop().toUpperCase();
      let status = 'queued';
      let error = '';

      if (!validExtensions.includes(ext)) {
        status = 'failed';
        error = 'Unsupported file type. Use PDF, DOCX, or TXT.';
      } else if (file.size > maxSizeBytes) {
        status = 'failed';
        error = 'File exceeds maximum 20MB size limit.';
      }

      return {
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status,
        error,
      };
    });

    setUploadFiles((prev) => [...prev, ...filesArray]);
  };

  const removeUploadFile = (id) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const startUpload = async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    setUploadResults([]);

    const queued = uploadFiles.filter(f => f.status === 'queued' || f.status === 'failed');

    for (let i = 0; i < queued.length; i++) {
      const current = queued[i];
      if (current.status === 'failed') continue;

      setUploadFiles((prev) =>
        prev.map((f) => (f.id === current.id ? { ...f, status: 'uploading', error: '' } : f))
      );

      try {
        await adminService.uploadDocument(current.file, (percent) => {
          setUploadFiles((prev) =>
            prev.map((f) => (f.id === current.id ? { ...f, progress: percent } : f))
          );
        });

        setUploadFiles((prev) =>
          prev.map((f) => (f.id === current.id ? { ...f, status: 'completed', progress: 100 } : f))
        );
      } catch (err) {
        console.error('Admin upload failure:', err);
        const errMsg = err.response?.data?.message || 'Upload failed';
        setUploadFiles((prev) =>
          prev.map((f) => (f.id === current.id ? { ...f, status: 'failed', error: errMsg, progress: 0 } : f))
        );
      }
    }

    setUploading(false);
    fetchStatsAndDocs();
    setUploadResults(['Admin uploads sequence complete.', 'Knowledge Base synced successfully.']);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statsCards = [
    { name: 'Registered Users', value: stats.totalUsers.toString(), icon: Users, color: 'from-blue-500 to-cyan-500' },
    { name: 'Global Documents', value: stats.totalDocuments.toString(), icon: FileText, color: 'from-brand-500 to-indigo-500' },
    { name: 'Vector Store (RAG)', value: `${stats.vectorCount} nodes`, icon: Database, color: 'from-emerald-500 to-teal-500' },
    { name: 'ChromaDB Status', value: stats.chromaStatus, icon: Activity, color: stats.chromaStatus === 'connected' ? 'from-emerald-500 to-teal-500' : 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center">
            Admin Management Panel
            <span className="ml-2.5 px-2.5 py-0.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full">
              System Admin
            </span>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Monitor registered users, manage global repository uploads, and re-index ChromaDB vector databases.
          </p>
        </div>

        <button
          onClick={fetchStatsAndDocs}
          className="flex items-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700/60 transition-all shrink-0"
        >
          <RefreshCw className="w-4.5 h-4.5" />
          <span>Sync Dashboard</span>
        </button>
      </div>

      {/* Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center space-x-4 hover:border-slate-700/50 transition-all duration-300"
          >
            <div className={`p-3 rounded-xl bg-gradient-to-tr ${card.color} text-white shrink-0 shadow-md`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.name}</p>
              <h4 className="text-lg font-extrabold text-white mt-0.5">{card.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Core Controls: Upload & Vector Tuning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vector Tuning Box */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl space-y-4 lg:col-span-1">
          <div className="flex items-center space-x-2.5 text-brand-400">
            <Database className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vector Store Tuning</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Embedding documents slices extracted text content into overlapping chunks. Click below to re-evaluate unprocessed documents globally.
          </p>

          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-40 disabled:scale-100 transition-all shadow-md shadow-brand-500/10"
          >
            {reindexing ? (
              <RefreshCw className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <Play className="w-4.5 h-4.5 fill-current" />
            )}
            <span>{reindexing ? 'Reindexing Vectors...' : 'Trigger Global Reindex'}</span>
          </button>

          {reindexResult && (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 text-xs font-medium text-slate-400 leading-relaxed">
              {reindexResult}
            </div>
          )}
        </div>

        {/* File Drag Box */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <UploadCloud className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Admin File Injector</h3>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerSelect}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-brand-500 bg-brand-500/5'
                : 'border-slate-800 hover:border-slate-700/60 bg-slate-950/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.docx,.txt"
            />
            <UploadCloud className="w-10 h-10 text-slate-600 mx-auto mb-2.5 animate-pulse" />
            <p className="text-xs font-semibold text-slate-350">
              Drag & Drop files here, or <span className="text-brand-400 hover:underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-550 mt-1">Accepts PDF, DOCX, TXT (Max 20MB)</p>
          </div>

          {/* Files List Upload Queue */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Upload Queue ({uploadFiles.length})
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 scrollbar pr-1">
                {uploadFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850/80 gap-3"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <FileIcon className="w-4 h-4 text-brand-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-350 truncate max-w-[160px] sm:max-w-xs">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      {file.status === 'uploading' && (
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-brand-500 h-full transition-all duration-200" style={{ width: `${file.progress}%` }}></div>
                        </div>
                      )}
                      {file.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {file.status === 'failed' && (
                        <div className="flex items-center space-x-1 text-red-400 text-[10px] font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{file.error}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeUploadFile(file.id)}
                        disabled={uploading}
                        className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-red-500/20 text-slate-550 hover:text-red-400 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={startUpload}
                disabled={uploading || uploadFiles.filter(f => f.status === 'queued').length === 0}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-750 active:scale-[0.98] disabled:opacity-35 disabled:scale-100 transition-all border border-slate-750"
              >
                {uploading ? 'Processing Files...' : 'Inject Files to Knowledge Repository'}
              </button>
            </div>
          )}

          {uploadResults.length > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs font-medium text-emerald-400 leading-relaxed">
              {uploadResults.map((line, i) => <p key={i}>{line}</p>)}
            </div>
          )}
        </div>
      </div>

      {/* Global Catalog List */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
            Global Repository Catalog
            <span className="ml-2 w-2 h-2 bg-brand-500 rounded-full"></span>
          </h3>

          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 bg-slate-950/45 border border-slate-850 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 rounded-xl text-xs placeholder-slate-550 text-slate-200 transition-all duration-200"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-505 flex flex-col items-center">
            <div className="w-8 h-8 border-3 border-slate-850 border-t-brand-500 rounded-full animate-spin mb-2"></div>
            <p className="text-xs font-semibold">Retrieving global catalog...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-xs font-semibold">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/20 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  <th className="py-3.5 px-4">Document Name</th>
                  <th className="py-3.5 px-4">Owner Email</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                <AnimatePresence>
                  {documents.map((doc) => (
                    <motion.tr
                      key={doc._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="hover:bg-slate-800/10 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                        {doc.originalName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        {doc.user ? doc.user.email : 'System Admin'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        {formatFileSize(doc.size)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider text-[9px]">
                          {doc.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-wider ${
                          doc.status === 'indexed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : doc.status === 'processing'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            : doc.status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="p-1.5 rounded bg-slate-950/60 border border-slate-850 hover:border-red-500/20 text-slate-500 hover:text-red-400 transition-all duration-150"
                          title="Global delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
