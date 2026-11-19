import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  Clock,
  X,
} from 'lucide-react';
import api from '../../services/api';

/**
 * MessageThread — In-Gig Workroom Chat Popup Modal
 *
 * Allows client owner and hired freelancer to exchange updates,
 * setup instructions, and feedback directly within a focused modal dialog.
 * Auto-polls every 8 seconds while modal is open and tracks read state in localStorage.
 */
export default function MessageThread({
  jobId,
  currentUserId,
  jobTitle,
  otherPartyName,
  isOpen,
  onClose,
  onMessagesChange,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesEndRef = useRef(null);
  const isFirstLoad = useRef(true);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  const markAsSeen = (msgs) => {
    if (msgs && msgs.length > 0) {
      const maxId = Math.max(...msgs.map((m) => m.id));
      localStorage.setItem(`giggle_chat_seen_${jobId}`, String(maxId));
    }
  };

  const fetchMessages = async (silent = false) => {
    if (!silent) {
      setIsRefreshing(true);
    }
    try {
      const res = await api.get(`/jobs/${jobId}/messages`);
      const fetched = res.data.messages || [];
      setMessages(fetched);
      setError('');
      markAsSeen(fetched);
      if (onMessagesChange) {
        onMessagesChange(fetched);
      }
      if (isFirstLoad.current) {
        setTimeout(() => scrollToBottom(false), 100);
        isFirstLoad.current = false;
      }
    } catch (err) {
      if (!silent) {
        setError(
          err.response?.data?.message || 'Failed to load workroom messages.'
        );
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Close on Escape key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Initial load and auto-polling every 8 seconds while modal is open
  useEffect(() => {
    if (!isOpen) return;

    isFirstLoad.current = true;
    fetchMessages(false);

    const interval = setInterval(() => {
      fetchMessages(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [jobId, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    const trimmed = content.trim();
    setSending(true);
    setError('');

    try {
      const res = await api.post(`/jobs/${jobId}/messages`, {
        content: trimmed,
      });

      if (res.data.message) {
        const updated = [...messages, res.data.message];
        setMessages(updated);
        setContent('');
        markAsSeen(updated);
        if (onMessagesChange) {
          onMessagesChange(updated);
        }
        setTimeout(() => scrollToBottom(true), 50);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to send message. Please retry.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTimestamp = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-paper border-4 border-ink shadow-brutal-lg rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Workroom Chat Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-white border-b-3 border-ink flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-finn border-2 border-ink shadow-brutal-sm flex items-center justify-center font-bold text-ink flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-ink" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg sm:text-xl text-ink leading-tight truncate">
                  WORKROOM CHAT
                </h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-ink text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-xs text-gray-600 font-medium truncate">
                {otherPartyName
                  ? `Direct thread with ${otherPartyName}`
                  : jobTitle
                  ? `Gig: ${jobTitle}`
                  : 'Private coordination channel'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => fetchMessages(false)}
              disabled={isRefreshing}
              title="Refresh messages"
              className="brutal-btn bg-paper text-ink text-xs font-bold py-1.5 px-2.5 shadow-brutal-sm flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={onClose}
              title="Close chat (Esc)"
              className="w-9 h-9 rounded-xl border-2 border-ink bg-bubblegum text-ink font-black shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="m-4 mb-0 p-3 bg-bubblegum border-2 border-ink rounded-lg text-xs font-bold text-ink">
            {error}
          </div>
        )}

        {/* Message History Window */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-paper/60 min-h-[300px] max-h-[55vh]">
          {loading ? (
            <div className="h-64 flex items-center justify-center gap-2 text-ink text-sm font-bold">
              <Loader2 className="w-5 h-5 animate-spin text-finn" />
              Loading workroom conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <MessageSquare className="w-10 h-10 text-gray-400 mb-2 stroke-[1.5]" />
              <p className="font-heading font-black text-ink text-sm">
                No messages in this workroom yet
              </p>
              <p className="text-xs text-gray-600 max-w-sm mt-1">
                Start the discussion! Share repository branches, ask questions, or provide progress updates.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender?.id === currentUserId;
              const isClient = msg.sender?.role === 'CLIENT';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                    isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  {/* Sender Metadata Bar */}
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="font-heading font-black text-[11px] text-ink">
                      {isMe ? 'You' : msg.sender?.name || 'User'}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded border border-ink shadow-brutal-xs uppercase ${
                        isClient
                          ? 'bg-finn text-ink'
                          : msg.sender?.role === 'ADMIN'
                          ? 'bg-bubblegum text-ink'
                          : 'bg-jake text-ink'
                      }`}
                    >
                      {msg.sender?.role || 'MEMBER'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono flex items-center gap-0.5 ml-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimestamp(msg.createdAt)}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-3 rounded-xl border-2 border-ink shadow-brutal-sm text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line break-words ${
                      isMe
                        ? 'bg-finn/30 text-ink rounded-tr-none'
                        : 'bg-white text-ink rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input & Send Form */}
        <div className="p-3 sm:p-4 bg-white border-t-3 border-ink flex-shrink-0">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <textarea
                  rows={2}
                  required
                  maxLength={2000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message or share an update... (Enter to send, Shift+Enter for new line)"
                  className="brutal-input text-xs sm:text-sm resize-none w-full"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="brutal-btn bg-jake text-ink font-heading font-black text-xs sm:text-sm px-4 sm:px-5 py-3 shadow-brutal-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>SEND</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 font-mono">
              Press <kbd className="bg-paper px-1 py-0.5 rounded border border-ink">Enter</kbd> to send, <kbd className="bg-paper px-1 py-0.5 rounded border border-ink">Shift + Enter</kbd> for a new line. Max 2000 chars.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
