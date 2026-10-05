import React, { useState } from 'react';
import { PlayerData, PetInstance, EggInstance } from '../types/game';
import { PET_SPECIES_LIST, EGG_CATALOG, MAP_LANDMARKS } from '../data/gameData';
import { 
  Coins, 
  Sparkles, 
  Backpack, 
  ArrowLeftRight, 
  Hammer, 
  Egg, 
  Shirt, 
  ScrollText, 
  BarChart3, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Heart,
  Compass,
  Globe,
  Zap,
  Tv
} from 'lucide-react';
import { soundFx } from '../services/audioService';
import { SupportedLanguage, SUPPORTED_LANGUAGES, getTranslation } from '../services/i18n';
import { GraphicsQuality } from './GameCanvas';

interface HUDProps {
  playerData: PlayerData;
  activePet: PetInstance | null;
  activeEgg: EggInstance | null;
  currentLocationName: string;
  onlineCount: number;
  isMuted: boolean;
  currentLanguage: SupportedLanguage;
  graphicsQuality: GraphicsQuality;
  retroFilterActive?: boolean;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  onToggleGraphics: () => void;
  onToggleRetroFilter?: () => void;
  onToggleMute: () => void;
  onOpenInventory: () => void;
  onOpenTrade: () => void;
  onOpenBuild: () => void;
  onOpenNursery: () => void;
  onOpenNeonCave: () => void;
  onOpenAvatar: () => void;
  onOpenQuests: () => void;
  onOpenAnalytics: () => void;
  onTeleportTo: (coords: [number, number, number]) => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerData,
  activePet,
  activeEgg,
  currentLocationName,
  onlineCount,
  isMuted,
  currentLanguage,
  graphicsQuality,
  retroFilterActive = true,
  onChangeLanguage,
  onToggleGraphics,
  onToggleRetroFilter,
  onToggleMute,
  onOpenInventory,
  onOpenTrade,
  onOpenBuild,
  onOpenNursery,
  onOpenNeonCave,
  onOpenAvatar,
  onOpenQuests,
  onOpenAnalytics,
  onTeleportTo,
}) => {
  const [showTeleportMenu, setShowTeleportMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  const activeSpecies = activePet ? PET_SPECIES_LIST.find((s) => s.id === activePet.speciesId) : null;
  const activeEggDef = activeEgg ? EGG_CATALOG.find((e) => e.id === activeEgg.eggTypeId) : null;

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none font-sans">
      {/* Top Header Bar */}
      <div className="w-full flex items-start justify-between gap-2">
        {/* Left: Player Bucks & Active Pet Status Card */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Bucks Pill with 8-Bit Pixel Styling */}
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 px-4 py-2 rounded-2xl pixel-box-amber transform hover:scale-105 transition-all">
            <div className="w-7 h-7 rounded-xl bg-white/40 flex items-center justify-center shadow-inner">
              <Coins className="w-4 h-4 text-slate-950 animate-bounce" />
            </div>
            <span className="font-pixel text-xs tracking-tight text-slate-950 font-black">${playerData.bucks.toLocaleString()}</span>
            <span className="text-[10px] bg-slate-950/25 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase ml-0.5 tracking-wider">{t('bucks')}</span>
          </div>

          {/* Equipped Pet / Egg Info Card */}
          {activePet && activeSpecies ? (
            <div className="bg-slate-900/95 backdrop-blur-xl text-white p-3.5 rounded-2xl pixel-box-pink max-w-xs transition-all hover:shadow-pink-500/30">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-xl drop-shadow">🐾</span>
                  <span className="font-pixel-heading font-bold text-base truncate text-pink-300">{activePet.customName}</span>
                  {activePet.isNeon && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-400 to-emerald-400 text-[9px] font-pixel text-slate-950 rounded-md shadow-sm">
                      {t('neonGlow')}
                    </span>
                  )}
                  {activePet.isMegaNeon && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400 text-[9px] font-pixel text-slate-950 rounded-md shadow-sm animate-pulse">
                      {t('megaGlow')}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm ${
                  activePet.rarity === 'Legendary' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black' :
                  activePet.rarity === 'Ultra-Rare' ? 'bg-gradient-to-r from-purple-400 to-fuchsia-500 text-white' :
                  activePet.rarity === 'Rare' ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950' :
                  'bg-slate-700 text-slate-200'
                }`}>
                  {t(`rarity_${activePet.rarity.replace('-', '')}`, activePet.rarity)}
                </span>
              </div>

              {/* Age Stage & XP Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-200 font-medium">
                  <span>{t('age')}: <strong className="text-amber-300 font-bold">{t(`age_${activePet.ageStage.replace('-', '').replace(' ', '')}`, activePet.ageStage)}</strong></span>
                  <span className="font-pixel text-[9px] text-pink-300">{activePet.xp}/{activePet.maxXp} {t('xp')}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 overflow-hidden border border-slate-700">
                  <div 
                    className="bg-gradient-to-r from-pink-500 via-purple-500 to-amber-400 h-full rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${Math.min(100, (activePet.xp / activePet.maxXp) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Friendship & Abilities */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300 font-medium">
                <div className="flex items-center gap-1 text-rose-400 font-bold">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                  <span>{t('friendship')} Lv.{activePet.friendshipLevel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {activePet.canRide && (
                    <span title="Rideable Pet" className="text-[10px] bg-emerald-500/20 border border-emerald-400/50 px-2 py-0.5 rounded-md text-emerald-300 font-bold">🐎 {t('ride')}</span>
                  )}
                  {activePet.canFly && (
                    <span title="Flyable Pet" className="text-[10px] bg-cyan-500/20 border border-cyan-400/50 px-2 py-0.5 rounded-md text-cyan-300 font-bold">🪽 {t('fly')}</span>
                  )}
                </div>
              </div>
            </div>
          ) : activeEgg && activeEggDef ? (
            <div className="bg-slate-900/95 backdrop-blur-xl text-white p-3.5 rounded-2xl pixel-box-amber max-w-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">🐣</span>
                  <span className="font-pixel-heading font-bold text-base text-amber-300">{activeEggDef.name}</span>
                </div>
                <span className="text-[9px] font-pixel bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 px-2 py-1 rounded-md shadow-sm">
                  {t('hatching')}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-200 font-medium">
                  <span>{t('needsToHatch')}:</span>
                  <span className="font-pixel text-[10px] text-amber-300">{activeEgg.needsCompleted}/{activeEgg.totalNeedsRequired}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 overflow-hidden border border-slate-700">
                  <div 
                    className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${Math.min(100, (activeEgg.needsCompleted / activeEgg.totalNeedsRequired) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Center: Current Location HUD */}
        <div className="hidden sm:flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl pixel-box-cyan">
          <div className="w-6 h-6 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <span className="font-pixel-heading font-bold text-sm text-slate-100">{currentLocationName}</span>
          <div className="flex items-center gap-1.5 ml-2 pl-2.5 border-l border-slate-700 text-xs font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{onlineCount} {t('online')}</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons & Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end pointer-events-auto max-w-[60%]">
          {/* Multi-Language Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowTeleportMenu(false);
              }}
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-indigo-400/50 shadow-lg shadow-indigo-500/15 transition-all hover:scale-105 active:scale-95"
              title={t('language')}
            >
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="text-base leading-none">{currentLangObj.flag}</span>
              <span className="hidden md:inline uppercase text-[11px] font-black">{currentLangObj.code}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border-2 border-indigo-400/60 rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-1">
                <div className="text-[10px] font-black text-indigo-300 uppercase px-2.5 py-1 border-b border-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t('language')}</span>
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onChangeLanguage(lang.code);
                      setShowLangMenu(false);
                      soundFx.playClick();
                    }}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition ${
                      currentLanguage === lang.code
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-400/40'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                    {currentLanguage === lang.code && <span className="text-emerald-400 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 8-Bit CRT Retro Filter Toggle */}
          <button
            onClick={onToggleRetroFilter}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
              retroFilterActive
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border-pink-300 shadow-lg shadow-pink-500/25'
                : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={retroFilterActive ? t('retroFilterActive') : t('retroFilterInactive')}
          >
            <Tv className="w-4 h-4" />
            <span className="font-pixel text-[9px] uppercase hidden sm:inline">
              {t('retroFilter')}
            </span>
          </button>

          {/* Graphics Quality Booster */}
          <button
            onClick={onToggleGraphics}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border shadow-lg transition-all hover:scale-105 active:scale-95 ${
              graphicsQuality === 'performance'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 border-emerald-300 shadow-emerald-500/20'
                : graphicsQuality === 'balanced'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-300 shadow-cyan-500/20'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-pink-300 shadow-purple-500/20'
            }`}
            title={`${t('graphics')}: ${graphicsQuality === 'performance' ? t('perfMode') : graphicsQuality === 'balanced' ? t('balancedMode') : t('ultraMode')}`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase hidden sm:inline">
              {graphicsQuality === 'performance' ? '60 FPS' : graphicsQuality === 'balanced' ? 'BAL' : 'ULTRA'}
            </span>
          </button>

          {/* Teleport / Map Quick Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTeleportMenu(!showTeleportMenu);
                setShowLangMenu(false);
              }}
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-cyan-400/50 shadow-lg shadow-cyan-500/15 transition-all hover:scale-105 active:scale-95"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline font-bold">{t('map')}</span>
            </button>

            {showTeleportMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-slate-900/95 backdrop-blur-xl border-2 border-cyan-400/60 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1">
                <div className="text-[10px] font-black text-cyan-300 uppercase px-3 py-1.5 border-b border-slate-800">{t('teleportTitle')}</div>
                {MAP_LANDMARKS.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      onTeleportTo([loc.x, loc.y, loc.z]);
                      setShowTeleportMenu(false);
                      soundFx.playJump();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-left font-bold text-slate-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-teal-500/20 hover:text-cyan-300 rounded-xl transition"
                  >
                    <span className="text-base">{loc.icon}</span>
                    <span className="truncate">{t(loc.id, loc.name)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bag Button */}
          <button
            onClick={onOpenInventory}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-amber-500/25 border border-amber-300 transition-transform hover:scale-105 active:scale-95"
            title={t('bag')}
          >
            <Backpack className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">{t('bag')}</span>
          </button>

          {/* Trade Button */}
          <button
            onClick={onOpenTrade}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-500/25 border border-emerald-300 transition-transform hover:scale-105 active:scale-95"
            title={t('trade')}
          >
            <ArrowLeftRight className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">{t('trade')}</span>
          </button>

          {/* Build Button */}
          <button
            onClick={onOpenBuild}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-blue-500/25 border border-blue-300 transition-transform hover:scale-105 active:scale-95"
            title={t('build')}
          >
            <Hammer className="w-4 h-4" />
            <span className="hidden sm:inline">{t('build')}</span>
          </button>

          {/* Eggs Button */}
          <button
            onClick={onOpenNursery}
            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-pink-500/25 border border-pink-300 transition-transform hover:scale-105 active:scale-95"
            title={t('eggs')}
          >
            <Egg className="w-4 h-4" />
            <span className="hidden sm:inline">{t('eggs')}</span>
          </button>

          {/* Neon Cave Button */}
          <button
            onClick={onOpenNeonCave}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-purple-500/25 border border-purple-300 transition-transform hover:scale-105 active:scale-95"
            title={t('neon')}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">{t('neon')}</span>
          </button>

          {/* Avatar Studio */}
          <button
            onClick={onOpenAvatar}
            className="bg-slate-900/90 hover:bg-slate-800 text-white p-2 rounded-xl border border-cyan-400/50 shadow-lg transition-transform hover:scale-105 active:scale-95"
            title={t('avatar')}
          >
            <Shirt className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Quests Button */}
          <button
            onClick={onOpenQuests}
            className="bg-slate-900/90 hover:bg-slate-800 text-white p-2 rounded-xl border border-amber-400/50 shadow-lg transition-transform hover:scale-105 active:scale-95"
            title={t('quests')}
          >
            <ScrollText className="w-4 h-4 text-amber-400" />
          </button>

          {/* Analytics Button */}
          <button
            onClick={onOpenAnalytics}
            className="bg-slate-900/90 hover:bg-slate-800 text-white p-2 rounded-xl border border-emerald-400/50 shadow-lg transition-transform hover:scale-105 active:scale-95"
            title={t('analytics')}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="bg-slate-900/90 hover:bg-slate-800 text-white p-2 rounded-xl border border-slate-700 shadow-lg transition-transform hover:scale-105 active:scale-95"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
          </button>
        </div>
      </div>
    </div>
  );
};
