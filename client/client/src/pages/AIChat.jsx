import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  RefreshCw,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  Mic,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import chatService from '../services/chatService';

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your SupportGPT AI Assistant. I can reference any documents in the active Knowledge Base to resolve user inquiries. What would you like to know today?",
      source: null,
      confidence: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeModel, setActiveModel] = useState('gpt-4o-mini');
  const [sessionId, setSessionId] = useState('');
  const [expandedCitation, setExpandedCitation] = useState(null);
  
  // Voice & Speech States
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const suggestPills = [
    { text: 'What is our refund window?', target: 'refund' },
    { text: 'How do I authenticate API calls?', target: 'auth' },
    { text: 'Summarize Product Catalog', target: 'catalog' },
  ];

  // Retrieve active settings model name on mount
  useEffect(() => {
    const savedModel = localStorage.getItem('settings_model');
    if (savedModel) {
      setActiveModel(savedModel);
    }
    setSessionId(`SESS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

    // Bootstrap Web Speech API SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + ' ' + text : text));
      };

      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Clean up synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const toggleCitation = (key) => {
    setExpandedCitation((prev) => (prev === key ? null : key));
  };

  const handleSend = async (textToSend) => {
    const queryText = textToSend.trim();
    if (!queryText) return;

    // Append User Message
    const userMsg = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: queryText,
      source: null,
      confidence: null,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Cancel active Speech synthesis
    window.speechSynthesis?.cancel();
    setSpeakingId(null);

    // Get Settings Parameters from localStorage
    const savedModel = localStorage.getItem('settings_model') || 'gpt-4o-mini';
    const savedTemp = localStorage.getItem('settings_temp') 
      ? parseFloat(localStorage.getItem('settings_temp')) 
      : 0.0;

    // Initialize bot placeholder message
    const botMsg = {
      id: Math.random().toString(36).substring(7),
      role: 'assistant',
      content: '',
      source: null,
      confidence: null,
      userQuery: queryText // track for regeneration triggers
    };

    try {
      const response = await chatService.query(queryText, {
        modelName: savedModel,
        temperature: savedTemp,
        sessionId: sessionId,
      });

      const { answer, sources, confidence } = response.data;

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      // Stream text word-by-word with typewriter animation
      const words = answer.split(' ');
      let currentText = '';
      for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsg.id
              ? {
                  ...msg,
                  content: currentText,
                  source: sources,
                  confidence: confidence,
                }
              : msg
          )
        );
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    } catch (err) {
      console.error('Chat error:', err);
      setIsTyping(false);
      
      const errMsg = err.response?.data?.message || err.message;
      const errorBotMsg = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: `Error: Failed to fetch AI Chat operator response. (${errMsg}). Please make sure your OpenAI API key is configured correctly in the settings.`,
        source: null,
        confidence: 0,
      };
      setMessages((prev) => [...prev, errorBotMsg]);
    }
  };

  const clearChat = () => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "New chat session started. Context cleared. What can I help you with?",
        source: null,
        confidence: null,
      },
    ]);
    setSessionId(`SESS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    setExpandedCitation(null);
  };

  // voice dictate toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your current browser. Try using Google Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // speech output speak
  const handleSpeak = (msgId, text) => {
    if (!window.speechSynthesis) {
      alert('Text-to-speech is not supported by your current browser.');
      return;
    }

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Strip HTML markers / tags if any
    const cleanText = text.replace(/\*\*|`|-/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // copy to clipboard helper
  const handleCopy = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // markdown parser renderer
  const renderMarkdown = (text) => {
    if (!text) return '';
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        // Check if first line states coding language
        const hasLang = lines[0].length < 15 && !lines[0].includes(' ') && lines[0] !== '';
        const lang = hasLang ? lines[0] : '';
        const code = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div key={index} className="my-3 border border-slate-800/80 rounded-xl overflow-hidden shadow-md">
            {lang && (
              <div className="bg-slate-900 px-4 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/80">
                {lang}
              </div>
            )}
            <pre className="bg-slate-950 p-4 overflow-x-auto font-mono text-xs text-brand-300 select-text leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      const paragraphs = part.split('\n');
      return paragraphs.map((para, paraIdx) => {
        let cleanPara = para.trim();
        if (!cleanPara) return null;

        // Parse bold elements **text**
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const segments = [];
        let lastIdx = 0;
        let match;

        while ((match = boldRegex.exec(para)) !== null) {
          if (match.index > lastIdx) {
            segments.push(para.substring(lastIdx, match.index));
          }
          segments.push(<strong key={match.index} className="font-extrabold text-white">{match[1]}</strong>);
          lastIdx = boldRegex.lastIndex;
        }
        if (lastIdx < para.length) {
          segments.push(para.substring(lastIdx));
        }

        const formattedText = segments.length > 0 ? segments : para;

        // Check if paragraph is list item
        if (cleanPara.startsWith('- ')) {
          return (
            <li key={paraIdx} className="ml-4 list-disc text-sm py-0.5 text-slate-300">
              {formattedText}
            </li>
          );
        }

        return (
          <p key={paraIdx} className="text-sm py-0.5 text-slate-300">
            {formattedText}
          </p>
        );
      });
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col justify-between">
      {/* Top action bar */}
      <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-md border border-slate-800/80 px-4 py-3 rounded-2xl shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center">
              AI Support Operator
              <span className="ml-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Model: {activeModel}</p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="flex items-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/60 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Message Feed Display */}
      <div className="flex-1 my-4 bg-slate-900/10 border border-slate-850 rounded-2xl p-6 overflow-y-auto space-y-6 scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-4 max-w-3xl ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {/* Profile Avatar */}
            <div className={`p-2 rounded-xl shrink-0 border ${
              msg.role === 'user'
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message bubble */}
            <div className="space-y-3 max-w-xl">
              <div className={`p-4 rounded-2xl text-sm leading-relaxed border group relative ${
                msg.role === 'user'
                  ? 'bg-indigo-600/10 text-indigo-200 border-indigo-500/10 rounded-tr-none'
                  : 'bg-slate-900/60 text-slate-200 border-slate-800 rounded-tl-none'
              }`}>
                {/* Text render block */}
                <div className="space-y-2 select-text">
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-line">{msg.content}</p>
                  ) : (
                    renderMarkdown(msg.content)
                  )}
                </div>

                {/* Bubble action tooltips for assistant */}
                {msg.role === 'assistant' && msg.content && (
                  <div className="absolute right-3.5 top-3 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur border border-slate-800/80 py-1 px-1.5 rounded-lg shadow">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                      title="Read aloud"
                    >
                      {speakingId === msg.id ? <VolumeX className="w-3.5 h-3.5 text-brand-405" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    {msg.userQuery && (
                      <button
                        onClick={() => handleSend(msg.userQuery)}
                        className="p-1 rounded text-slate-500 hover:text-white transition-colors"
                        title="Regenerate answer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* RAG Source Citation Badge & Confidence */}
              {msg.confidence !== null && msg.confidence !== undefined && msg.confidence > 0 && (
                <div className={`flex items-center space-x-1 text-[11px] font-semibold py-1 px-2.5 rounded-lg border w-fit ${
                  msg.confidence > 75
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : msg.confidence > 50
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{msg.confidence}% Overall Confidence</span>
                </div>
              )}

              {/* Collapsible rich source citations cards (ChatGPT Style) */}
              {msg.source && Array.isArray(msg.source) && msg.source.length > 0 && (
                <div className="space-y-2 mt-2 w-full max-w-xl">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Source References ({msg.source.length})
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {msg.source.map((cit, idx) => {
                      const citationKey = `${msg.id}-${idx}`;
                      const isExpanded = expandedCitation === citationKey;

                      return (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md overflow-hidden transition-all duration-300"
                        >
                          {/* Header / Click Trigger */}
                          <button
                            type="button"
                            onClick={() => toggleCitation(citationKey)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-850/30 transition-colors"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <BookOpen className="w-4 h-4 text-brand-400 shrink-0" />
                              <span className="text-xs font-semibold text-slate-350 truncate max-w-[180px] sm:max-w-xs">
                                {cit.documentName}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 shrink-0 uppercase tracking-wider">
                                Chunk #{cit.chunkNumber}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-3 shrink-0">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                cit.similarityScore > 75
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : cit.similarityScore > 50
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {cit.similarityScore}% similarity (confidence: {cit.confidenceScore}%)
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {/* Collapsible Accordion Box */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-slate-800/50 bg-slate-950/20"
                              >
                                <div className="p-3 text-[11px] leading-relaxed text-slate-400 whitespace-pre-line border-l-2 border-brand-500 bg-brand-500/5 max-h-48 overflow-y-auto font-mono">
                                  <div className="flex items-center space-x-1.5 text-slate-500 mb-2">
                                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span>
                                    <span className="text-[9px] uppercase font-bold tracking-wider">Retrieved Text Segment</span>
                                  </div>
                                  <p className="italic text-slate-300">
                                    "{cit.text}"
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing bubble / Loading Skeleton */}
        {isTyping && (
          <div className="flex items-start space-x-4 max-w-lg animate-pulse">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl rounded-tl-none space-y-2 flex-1 min-w-[200px]">
              <div className="h-3 bg-slate-850 rounded w-5/6"></div>
              <div className="h-3 bg-slate-850 rounded w-4/6"></div>
              <div className="h-3 bg-slate-850 rounded w-2/6"></div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Prompts suggestions & input container */}
      <div className="space-y-4 shrink-0">
        {/* Suggestion pills */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestPills.map((pill) => (
              <button
                key={pill.target}
                onClick={() => handleSend(pill.text)}
                className="flex items-center space-x-1 py-1.5 px-3 rounded-full text-xs font-semibold text-slate-400 hover:text-brand-400 bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/20 transition-all duration-200"
              >
                <span>{pill.text}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="relative flex items-center rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all overflow-hidden"
        >
          {/* Voice Input Toggle Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`pl-4 pr-2.5 py-4 text-slate-500 hover:text-white transition-colors shrink-0 ${
              isListening ? 'text-red-400 animate-pulse' : ''
            }`}
            title="Speech recognition dictation"
          >
            <Mic className={`w-5 h-5 ${isListening ? 'scale-110 text-red-400' : ''}`} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening dictation...' : 'Type your support inquiry...'}
            className="flex-1 bg-transparent py-4 pr-4 outline-none placeholder-slate-500 text-slate-200 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="mr-3 p-2.5 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white hover:from-brand-500 hover:to-indigo-500 active:scale-[0.96] disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-500/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
