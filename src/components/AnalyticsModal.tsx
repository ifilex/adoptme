import React from 'react';
import { PlayerData } from '../types/game';
import { X, BarChart3, TrendingUp, Users, Heart, Sparkles, Trophy } from 'lucide-react';
import { SupportedLanguage, getTranslation } from '../services/i18n';

interface AnalyticsModalProps {
  playerData: PlayerData;
  onClose: () => void;
  currentLanguage?: SupportedLanguage;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  playerData,
  onClose,
  currentLanguage = 'en',
}) => {
  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  const stats = [
    { label: t('statBucksEarned'), value: `$${playerData.stats.totalBucksEarned.toLocaleString()}`, icon: '💰', color: 'from-amber-400 to-orange-500' },
    { label: t('statNeedsFulfilled'), value: playerData.stats.needsFulfilled.toLocaleString(), icon: '🌟', color: 'from-pink-400 to-rose-500' },
    { label: t('statPetsHatched'), value: playerData.stats.petsHatched.toLocaleString(), icon: '🐣', color: 'from-purple-400 to-indigo-500' },
    { label: t('statNeonFused'), value: playerData.stats.neonFused.toLocaleString(), icon: '✨', color: 'from-cyan-400 to-blue-500' },
    { label: t('statTradesCompleted'), value: playerData.stats.tradesCompleted.toLocaleString(), icon: '🤝', color: 'from-emerald-400 to-teal-500' },
    { label: t('statTotalPlaytime'), value: `${Math.round(playerData.stats.totalPlayTimeMinutes)}m`, icon: '⏱️', color: 'from-blue-400 to-sky-500' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-400/80 w-full max-w-2xl rounded-3xl shadow-2xl shadow-emerald-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-2xl shadow-lg border border-emerald-300">
              📊
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{t('analyticsTitle')}</h2>
              <p className="text-xs text-emerald-200/80 font-medium">{t('analyticsDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col items-start justify-between gap-2 shadow-inner"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl">
                  {stat.icon}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">{stat.label}</span>
                  <span className="text-lg font-black text-white tracking-tight mt-0.5">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Player Retention & Network Analytics Card */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Adopt Me! Craft Live Server Telemetry</span>
              </h4>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-black px-2 py-0.5 rounded-full">
                60 FPS / Low Latency
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Server Tickrate</span>
                <span className="font-black text-emerald-400">60 Hz</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">GPU Instancing</span>
                <span className="font-black text-cyan-400">Active</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Raycasting</span>
                <span className="font-black text-amber-400">Fast DDA</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Data Sync</span>
                <span className="font-black text-purple-400">Auto-Save</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
