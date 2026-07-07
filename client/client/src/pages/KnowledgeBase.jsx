import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Search,
  Trash2,
  ExternalLink,
  MessageSquare,
  FileText,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import documentService from '../services/documentService';

const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const response = await documentService.getDocuments();
      if (response.status === 'success') {
        setDocuments(response.data);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this document from the server?')) {
      try {
        const response = await documentService.deleteDocument(id);
        if (response.status === 'success') {
          setDocuments((prev) => prev.filter((doc) => doc._id !== id));
        }
      } catch (err) {
        console.error('Failed to delete document:', err);
        alert('Failed to delete document: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePreview = (name) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://contryeduproject.onrender.com';
    window.open(`${baseUrl}/api/uploads/${name}`, '_blank');
  };

  const filteredDocs = documents.filter((doc) =>
    doc.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Knowledge Base</h2>
          <p className="mt-1 text-sm text-slate-400">
            View, preview, and manage source documents loaded in the local uploads directory.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Refresh button */}
          <button
            onClick={fetchDocs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/60 backdrop-blur-md border border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 rounded-xl text-sm placeholder-slate-500 text-slate-200 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Docs Grid */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
            <p className="text-sm font-semibold">Loading documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Database className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
            <p className="text-sm font-semibold">No documents found</p>
            <p className="text-xs text-slate-600 mt-1">Try uploading PDF, DOCX, or TXT documents to the repository.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/20 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="py-4 px-6">Document Name</th>
                  <th className="py-4 px-6">File Size</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Uploaded Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                <AnimatePresence>
                  {filteredDocs.map((doc) => (
                    <motion.tr
                      key={doc._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-slate-800/20 transition-colors group"
                    >
                      <td className="py-4 px-6 font-semibold text-slate-200">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-slate-950/60 border border-slate-800 shrink-0 text-brand-400 group-hover:border-brand-500/20 transition-all duration-300`}>
                            <FileText className={`w-4 h-4 ${doc.type === 'PDF' ? 'text-red-400' : doc.type === 'DOCX' ? 'text-blue-400' : 'text-slate-400'}`} />
                          </div>
                          <span className="truncate max-w-[200px] sm:max-w-xs">{doc.originalName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-medium">{formatFileSize(doc.size)}</td>
                      <td className="py-4 px-6">
                        <span className="flex items-center text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 w-fit">
                          {doc.type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          doc.status === 'indexed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : doc.status === 'processing'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-medium">
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handlePreview(doc.name)}
                            title="Preview File"
                            className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700/60 hover:bg-slate-800 transition-all duration-200"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc._id)}
                            title="Delete"
                            className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

export default KnowledgeBase;
