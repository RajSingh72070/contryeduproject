import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Database,
  ArrowRight
} from 'lucide-react';
import documentService from '../services/documentService';
import knowledgeService from '../services/knowledgeService';

const UploadDocs = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (selectedFiles) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    const newFiles = selectedFiles
      .filter((file) => {
        // Size validation (Max 20MB)
        if (file.size > 20 * 1024 * 1024) {
          alert(`File too large: ${file.name}. Maximum size allowed is 20MB.`);
          return false;
        }

        const isValid = validTypes.includes(file.type) || file.name.endsWith('.docx') || file.name.endsWith('.pdf');
        if (!isValid) {
          alert(`File type not supported: ${file.name}. Only PDF, DOCX, and TXT files are accepted.`);
        }
        return isValid;
      })
      .map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        progress: 0,
        status: 'queued', // queued, uploading, completed, failed
        error: '',
      }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const triggerSelect = () => {
    fileInputRef.current.click();
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setResults([]);

    const queuedFiles = files.filter(f => f.status === 'queued' || f.status === 'failed');

    for (let i = 0; i < queuedFiles.length; i++) {
      const currentFile = queuedFiles[i];

      // Update state to uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === currentFile.id ? { ...f, status: 'uploading', error: '' } : f))
      );

      try {
        await documentService.uploadDocument(currentFile.file, (percent) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === currentFile.id ? { ...f, progress: percent } : f))
          );
        });

        // Finish upload successfully
        setFiles((prev) =>
          prev.map((f) =>
            f.id === currentFile.id ? { ...f, status: 'completed', progress: 100 } : f
          )
        );
      } catch (err) {
        console.error(`Upload failed for file ${currentFile.name}:`, err);
        const errMsg = err.response?.data?.message || 'Upload failed';
        setFiles((prev) =>
          prev.map((f) =>
            f.id === currentFile.id ? { ...f, status: 'failed', error: errMsg, progress: 0 } : f
          )
        );
      }
    }

    setUploading(false);
    const uploadedCount = files.filter(f => f.status === 'completed').length;
    
    setResults([
      'Document uploads completed.',
      `${uploadedCount} files successfully saved to the server uploads folder.`
    ]);

    // Automatically trigger vector store indexing for newly uploaded files
    try {
      setResults(prev => [...prev, 'Starting vector database indexing (embeddings generation)...']);
      const reindexRes = await knowledgeService.reindex();
      if (reindexRes.status === 'success') {
        const count = reindexRes.data.indexedCount;
        setResults(prev => [
          ...prev,
          `Vector store synchronized successfully. Generated embeddings for ${count} document(s).`
        ]);
      }
    } catch (reindexErr) {
      console.error('Failed to trigger automatic indexing:', reindexErr);
      const errMsg = reindexErr.response?.data?.message || reindexErr.message;
      setResults(prev => [
        ...prev,
        `Vector indexing failed: ${errMsg}. You can trigger reindexing in System Settings.`
      ]);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Upload Documents</h2>
        <p className="mt-1 text-sm text-slate-400">
          Inject unstructured documentation (PDF, DOCX, TXT) to automatically feed your AI custom knowledge.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerSelect}
        className="border-2 border-dashed border-slate-800 hover:border-brand-500/60 bg-slate-900/20 hover:bg-slate-900/40 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
        />
        <div className="p-4 rounded-full bg-slate-950/60 border border-slate-800 text-slate-400 group-hover:text-brand-400 group-hover:border-brand-500/20 group-hover:shadow-lg transition-all duration-300">
          <UploadCloud className="w-10 h-10" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">Drag and drop files here</h3>
        <p className="mt-2 text-sm text-slate-500 text-center max-w-sm">
          Select or drop PDF, DOCX, or plain text files. Max file size: 20MB.
        </p>
      </motion.div>

      {/* Upload Queue / Files List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
              <h4 className="font-bold text-white">Upload Queue ({files.length})</h4>
              <button
                onClick={() => setFiles([])}
                disabled={uploading}
                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors font-semibold"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1 mr-4">
                    <div className="p-2 rounded-lg bg-slate-900 text-brand-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-200 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{file.size}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Progress indicator */}
                    {file.status === 'uploading' && (
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand-500 h-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}

                    {file.status === 'completed' && (
                      <span className="flex items-center text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ready
                      </span>
                    )}

                    {file.status === 'queued' && (
                      <span className="text-xs text-slate-500 font-semibold">Queued</span>
                    )}

                    <button
                      onClick={() => removeFile(file.id)}
                      disabled={uploading}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 disabled:opacity-30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Launch processing */}
            <div className="flex justify-end pt-3">
              <button
                onClick={startUpload}
                disabled={uploading || files.every((f) => f.status === 'completed')}
                className="flex items-center space-x-2 py-3 px-6 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span>{uploading ? 'Uploading Documents...' : 'Upload to Server'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulator Embed outputs */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-slate-900/40 border border-emerald-500/20 p-6 rounded-2xl flex items-start space-x-4"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white">Uploads Complete</h4>
              <ul className="mt-2 space-y-1">
                {results.map((res, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    {res}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadDocs;
