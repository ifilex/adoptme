import React, { useState } from 'react';
import { PlayerData, HousePlot, FurnitureItem } from '../types/game';
import { VOXEL_BLOCKS, FURNITURE_CATALOG } from '../data/gameData';
import { X, Hammer, Home, Sparkles, Trash2, Check } from 'lucide-react';
import { soundFx } from '../services/audioService';
import { SupportedLanguage, getTranslation } from '../services/i18n';

interface BuildCatalogModalProps {
  playerData: PlayerData;
  housePlots: HousePlot[];
  onClose: () => void;
  onClaimPlot: (plotId: string) => void;
  onSelectBlock: (blockId: number) => void;
  selectedBlockId: number;
  onBuyFurniture: (furniture: FurnitureItem) => void;
  onClearPlot: (plotId: string) => void;
  currentLanguage?: SupportedLanguage;
}

export const BuildCatalogModal: React.FC<BuildCatalogModalProps> = ({
  playerData,
  housePlots,
  onClose,
  onClaimPlot,
  onSelectBlock,
  selectedBlockId,
  onBuyFurniture,
  onClearPlot,
  currentLanguage = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'blocks' | 'furniture' | 'plots'>('blocks');
  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-blue-400/80 w-full max-w-3xl rounded-3xl shadow-2xl shadow-blue-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-cyan-500/30 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-2xl shadow-lg border border-blue-300">
              🔨
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{t('buildTitle')}</h2>
              <p className="text-xs text-blue-200/80 font-medium">{t('buildDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-950/80 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
              activeTab === 'blocks'
                ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            🧱 {t('tabBlocks')}
          </button>
          <button
            onClick={() => setActiveTab('furniture')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
              activeTab === 'furniture'
                ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            🛋️ {t('furniture')}
          </button>
          <button
            onClick={() => setActiveTab('plots')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
              activeTab === 'plots'
                ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            🏡 {t('housePlots')}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* BLOCKS */}
          {activeTab === 'blocks' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {VOXEL_BLOCKS.map((block) => {
                const isSelected = selectedBlockId === block.id;
                return (
                  <button
                    key={block.id}
                    onClick={() => {
                      onSelectBlock(block.id);
                      soundFx.playClick();
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-blue-950/80 border-cyan-400 shadow-lg scale-105'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-3xl">{block.icon}</div>
                    <span className="text-xs font-black text-white truncate max-w-full">{block.name}</span>
                    <span className="text-[10px] text-blue-300 font-semibold uppercase">{block.category}</span>
                    {isSelected && (
                      <span className="text-[9px] text-emerald-400 font-black">✓ {t('claimed')}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* FURNITURE */}
          {activeTab === 'furniture' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {FURNITURE_CATALOG.map((item) => {
                const canAfford = playerData.bucks >= item.cost;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-black text-xs text-white">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{item.category}</p>
                        <p className="text-xs font-bold text-amber-300">${item.cost} Bucks</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onBuyFurniture(item)}
                      disabled={!canAfford}
                      className="bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-300 hover:to-indigo-400 disabled:opacity-40 text-slate-950 font-black text-xs px-3 py-2 rounded-xl shadow-md transition active:scale-95"
                    >
                      {t('buyFurniture')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* PLOTS */}
          {activeTab === 'plots' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {housePlots.map((plot) => {
                  const isMine = plot.ownerId === playerData.id;
                  const isClaimed = !!plot.ownerId;

                  return (
                    <div
                      key={plot.id}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                        isMine
                          ? 'bg-blue-950/60 border-cyan-400 shadow-lg'
                          : 'bg-slate-800/60 border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                            <Home className="w-4 h-4 text-cyan-400" />
                            <span>{plot.name}</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            {t('owner')}: <strong className="text-slate-200">{plot.ownerName || t('unclaimed')}</strong>
                          </p>
                          <p className="text-[11px] text-cyan-300 font-semibold mt-0.5">
                            {t('placedBlocks')}: {plot.blocks.length}
                          </p>
                        </div>

                        {isMine && (
                          <span className="text-[10px] font-black px-2.5 py-0.5 bg-cyan-400 text-slate-950 rounded-full">
                            {t('yourHome')}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        {!isClaimed ? (
                          <button
                            onClick={() => onClaimPlot(plot.id)}
                            className="flex-1 py-2 bg-gradient-to-r from-blue-400 to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-md"
                          >
                            {t('claimPlot')}
                          </button>
                        ) : isMine ? (
                          <button
                            onClick={() => onClearPlot(plot.id)}
                            className="py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t('clearHouse')}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
