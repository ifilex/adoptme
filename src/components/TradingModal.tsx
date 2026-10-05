import React, { useState } from 'react';
import { PlayerData, TradeSession, PetInstance, EggInstance } from '../types/game';
import { PET_SPECIES_LIST, EGG_CATALOG } from '../data/gameData';
import { X, ArrowLeftRight, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { soundFx } from '../services/audioService';
import { SupportedLanguage, getTranslation } from '../services/i18n';

interface TradingModalProps {
  playerData: PlayerData;
  tradeSession: TradeSession;
  onClose: () => void;
  onUpdateMyOffer: (pets: PetInstance[], eggs: EggInstance[], bucks: number) => void;
  onToggleAccept: () => void;
  onConfirmFinalTrade: () => void;
  currentLanguage?: SupportedLanguage;
}

export const TradingModal: React.FC<TradingModalProps> = ({
  playerData,
  tradeSession,
  onClose,
  onUpdateMyOffer,
  onToggleAccept,
  onConfirmFinalTrade,
  currentLanguage = 'en',
}) => {
  const [selectedTab, setSelectedTab] = useState<'pets' | 'eggs'>('pets');
  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  const handleTogglePetOffer = (pet: PetInstance) => {
    const exists = tradeSession.myOffer.pets.some((p) => p.id === pet.id);
    const updatedPets = exists
      ? tradeSession.myOffer.pets.filter((p) => p.id !== pet.id)
      : [...tradeSession.myOffer.pets, pet];

    onUpdateMyOffer(updatedPets, tradeSession.myOffer.eggs, tradeSession.myOffer.bucks);
    soundFx.playClick();
  };

  const handleToggleEggOffer = (egg: EggInstance) => {
    const exists = tradeSession.myOffer.eggs.some((e) => e.id === egg.id);
    const updatedEggs = exists
      ? tradeSession.myOffer.eggs.filter((e) => e.id !== egg.id)
      : [...tradeSession.myOffer.eggs, egg];

    onUpdateMyOffer(tradeSession.myOffer.pets, updatedEggs, tradeSession.myOffer.bucks);
    soundFx.playClick();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-400/80 w-full max-w-3xl rounded-3xl shadow-2xl shadow-emerald-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-2xl shadow-lg border border-emerald-300">
              🤝
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{t('tradeTitle')}</h2>
              <p className="text-xs text-emerald-200/80 font-medium">
                {t('tradingWith')}: <strong className="text-emerald-300 font-black">{tradeSession.partnerName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Trade Window */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
          {/* Left Column: My Offer */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase text-amber-400">{t('yourOffer')} ({playerData.username})</h4>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    tradeSession.myOffer.accepted
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tradeSession.myOffer.accepted ? t('accepted') : t('waitingAccept')}
                </span>
              </div>

              {/* Offered Items List */}
              <div className="grid grid-cols-3 gap-2 min-h-[140px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                {tradeSession.myOffer.pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-center flex flex-col items-center justify-center"
                  >
                    <span className="text-xl">🐾</span>
                    <span className="text-[10px] font-black text-white truncate max-w-full">{pet.customName}</span>
                    <span className="text-[8px] text-amber-300 font-bold">{pet.rarity}</span>
                  </div>
                ))}
                {tradeSession.myOffer.eggs.map((egg) => {
                  const def = EGG_CATALOG.find((e) => e.id === egg.eggTypeId);
                  return (
                    <div
                      key={egg.id}
                      className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-center flex flex-col items-center justify-center"
                    >
                      <span className="text-xl">🐣</span>
                      <span className="text-[10px] font-black text-white truncate max-w-full">{def?.name}</span>
                    </div>
                  );
                })}
                {tradeSession.myOffer.pets.length === 0 && tradeSession.myOffer.eggs.length === 0 && (
                  <div className="col-span-3 flex items-center justify-center text-slate-600 text-xs font-bold">
                    {t('noTradeItems')}
                  </div>
                )}
              </div>
            </div>

            {/* Accept Button (Stage 1) */}
            <div className="mt-4">
              <button
                onClick={onToggleAccept}
                className={`w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                  tradeSession.myOffer.accepted
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{tradeSession.myOffer.accepted ? t('cancelTrade') : t('acceptOffer')}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Partner Offer */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase text-cyan-400">{tradeSession.partnerName}'s Offer</h4>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    tradeSession.partnerOffer.accepted
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tradeSession.partnerOffer.accepted ? t('accepted') : t('waitingAccept')}
                </span>
              </div>

              {/* Partner Items List */}
              <div className="grid grid-cols-3 gap-2 min-h-[140px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                {tradeSession.partnerOffer.pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-center flex flex-col items-center justify-center"
                  >
                    <span className="text-xl">🐾</span>
                    <span className="text-[10px] font-black text-white truncate max-w-full">{pet.customName}</span>
                    <span className="text-[8px] text-amber-300 font-bold">{pet.rarity}</span>
                  </div>
                ))}
                {tradeSession.partnerOffer.eggs.map((egg) => {
                  const def = EGG_CATALOG.find((e) => e.id === egg.eggTypeId);
                  return (
                    <div
                      key={egg.id}
                      className="bg-slate-800 p-2 rounded-xl border border-slate-700 text-center flex flex-col items-center justify-center"
                    >
                      <span className="text-xl">🐣</span>
                      <span className="text-[10px] font-black text-white truncate max-w-full">{def?.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Confirmation Countdown Stage */}
            {tradeSession.status === 'reviewing' && (
              <div className="mt-4 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-[10px] text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-400/30">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{t('safeTradeNote')}</span>
                </div>

                <button
                  onClick={onConfirmFinalTrade}
                  disabled={tradeSession.countdown > 0}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {tradeSession.countdown > 0
                      ? `${t('countdownConfirm')} (${tradeSession.countdown}s)`
                      : t('confirmTrade')}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Drawer: Add items to offer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTab('pets')}
                className={`text-xs font-black px-3 py-1 rounded-xl transition ${
                  selectedTab === 'pets' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {t('tabPets')}
              </button>
              <button
                onClick={() => setSelectedTab('eggs')}
                className={`text-xs font-black px-3 py-1 rounded-xl transition ${
                  selectedTab === 'eggs' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {t('tabEggs')}
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">{t('addTradeHint')}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {selectedTab === 'pets' &&
              playerData.pets.map((pet) => {
                const isSelected = tradeSession.myOffer.pets.some((p) => p.id === pet.id);
                return (
                  <button
                    key={pet.id}
                    onClick={() => handleTogglePetOffer(pet)}
                    className={`p-2 rounded-xl border text-center shrink-0 w-24 transition ${
                      isSelected ? 'bg-amber-950/80 border-amber-400' : 'bg-slate-800/80 border-slate-700'
                    }`}
                  >
                    <span className="text-xl">🐾</span>
                    <span className="text-[10px] font-black text-white truncate block">{pet.customName}</span>
                    {isSelected && <span className="text-[8px] text-emerald-400 font-bold block">✓ {t('added')}</span>}
                  </button>
                );
              })}

            {selectedTab === 'eggs' &&
              playerData.eggs.map((egg) => {
                const isSelected = tradeSession.myOffer.eggs.some((e) => e.id === egg.id);
                const def = EGG_CATALOG.find((e) => e.id === egg.eggTypeId);
                return (
                  <button
                    key={egg.id}
                    onClick={() => handleToggleEggOffer(egg)}
                    className={`p-2 rounded-xl border text-center shrink-0 w-24 transition ${
                      isSelected ? 'bg-amber-950/80 border-amber-400' : 'bg-slate-800/80 border-slate-700'
                    }`}
                  >
                    <span className="text-xl">🐣</span>
                    <span className="text-[10px] font-black text-white truncate block">{def?.name}</span>
                    {isSelected && <span className="text-[8px] text-emerald-400 font-bold block">✓ {t('added')}</span>}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
