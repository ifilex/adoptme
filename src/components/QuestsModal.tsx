import React from 'react';
import { PlayerData, GameQuest } from '../types/game';
import { X, ScrollText, CheckCircle2, Gift, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '../services/audioService';
import { SupportedLanguage, getTranslation } from '../services/i18n';

interface QuestsModalProps {
  playerData: PlayerData;
  quests: GameQuest[];
  onClaimQuest: (questId: string, rewardBucks: number) => void;
  onClose: () => void;
  currentLanguage?: SupportedLanguage;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({
  playerData,
  quests,
  onClaimQuest,
  onClose,
  currentLanguage = 'en',
}) => {
  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-amber-400/80 w-full max-w-2xl rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-yellow-500/30 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg border border-amber-300">
              📜
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{t('questsTitle')}</h2>
              <p className="text-xs text-amber-200/80 font-medium">{t('questsDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quests List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {quests.map((quest) => {
            const isFinished = quest.progress >= quest.totalRequired;
            const canClaim = isFinished && !quest.completed;

            return (
              <div
                key={quest.id}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                  quest.completed
                    ? 'bg-slate-950/40 border-slate-800 opacity-60'
                    : canClaim
                    ? 'bg-gradient-to-r from-amber-950/40 to-emerald-950/40 border-amber-400 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/60 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                    {quest.completed ? '✅' : '🎯'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-xs text-white">{quest.title}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{quest.description}</p>

                    {/* Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-950 rounded-full h-2 p-0.5 border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (quest.progress / quest.totalRequired) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-300 font-bold">
                        {quest.progress}/{quest.totalRequired}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-xs font-black text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-xl">
                    +${quest.rewardBucks} Bucks
                  </span>

                  {quest.completed ? (
                    <span className="text-[10px] text-slate-500 font-bold">{t('claimed')}</span>
                  ) : canClaim ? (
                    <button
                      onClick={() => {
                        onClaimQuest(quest.id, quest.rewardBucks);
                        soundFx.playCoin();
                        confetti({ particleCount: 40, spread: 60 });
                      }}
                      className="bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-md transition active:scale-95 flex items-center gap-1"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>{t('claimReward')}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold">{t('inProgress')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
