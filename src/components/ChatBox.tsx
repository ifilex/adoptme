import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Smile, ArrowLeftRight, ChevronUp, ChevronDown } from 'lucide-react';
import { soundFx } from '../services/audioService';
import { SupportedLanguage, getTranslation } from '../services/i18n';

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface ChatBoxProps {
  messages: ChatMessageItem[];
  onSendMessage: (text: string) => void;
  onRequestTradeWithPlayer: (playerName: string) => void;
  currentLanguage?: SupportedLanguage;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  onRequestTradeWithPlayer,
  currentLanguage = 'en',
}) => {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showEmotes, setShowEmotes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  const emotes = ['🐾', '💖', '🦄', '🐲', '✨', '🎉', '🍎', '🐶', '🐱', '🔥', '👑', '🌈'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExpanded]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    soundFx.playClick();
  };

  const handleAddEmote = (emote: string) => {
    setInputText((prev) => prev + emote);
    setShowEmotes(false);
  };

  return (
    <div className="absolute top-20 right-3 pointer-events-auto w-72 sm:w-80 flex flex-col z-20 font-sans select-none">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-t-2xl border-2 border-b-0 border-slate-700/80 cursor-pointer shadow-lg hover:bg-slate-800/90 transition"
      >
        <div className="flex items-center gap-2 text-xs font-black text-slate-200">
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t('chatPlaceholder').split('...')[0]}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </div>

      {isExpanded && (
        <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-slate-700/80 rounded-b-2xl shadow-2xl p-2.5 flex flex-col gap-2">
          {/* Message List */}
          <div className="h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-[11px] leading-tight p-1.5 rounded-xl ${
                  msg.isSystem
                    ? 'bg-amber-500/10 border border-amber-400/30 text-amber-300 font-medium'
                    : 'bg-slate-950/60 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    onClick={() => {
                      if (!msg.isSystem) onRequestTradeWithPlayer(msg.senderName);
                    }}
                    className={`font-black cursor-pointer hover:underline ${
                      msg.isSystem ? 'text-amber-300' : 'text-cyan-300'
                    }`}
                  >
                    {msg.senderName}:
                  </span>
                  {!msg.isSystem && (
                    <button
                      onClick={() => onRequestTradeWithPlayer(msg.senderName)}
                      className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 bg-emerald-500/10 px-1 py-0.5 rounded"
                      title="Trade with player"
                    >
                      <ArrowLeftRight className="w-2.5 h-2.5" />
                      <span>{t('trade')}</span>
                    </button>
                  )}
                </div>
                <p className="mt-0.5 font-medium break-words">{msg.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Emote Picker Popup */}
          {showEmotes && (
            <div className="grid grid-cols-6 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 animate-fadeIn">
              {emotes.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => handleAddEmote(e)}
                  className="text-lg hover:scale-125 transition text-center p-1"
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <form onSubmit={handleSend} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowEmotes(!showEmotes)}
              className="p-1.5 text-slate-400 hover:text-amber-300 transition"
            >
              <Smile className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('chatPlaceholder')}
              className="flex-1 bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 font-medium"
            />
            <button
              type="submit"
              className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
