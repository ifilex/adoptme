import React from 'react';
import { PetNeed, PetInstance, EggInstance, InventoryFood } from '../types/game';
import { MAP_LANDMARKS } from '../data/gameData';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '../services/audioService';
import { SupportedLanguage, getTranslation } from '../services/i18n';

interface PetNeedsOverlayProps {
  activePet: PetInstance | null;
  activeEgg: EggInstance | null;
  foodInventory: InventoryFood[];
  currentLocationId: string;
  currentLanguage: SupportedLanguage;
  onFulfillNeed: (needId: string, needType: string, bucksReward: number, xpReward: number) => void;
  onTeleportTo: (coords: [number, number, number]) => void;
}

export const PetNeedsOverlay: React.FC<PetNeedsOverlayProps> = ({
  activePet,
  activeEgg,
  foodInventory,
  currentLocationId,
  currentLanguage,
  onFulfillNeed,
  onTeleportTo,
}) => {
  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);
  const needs: PetNeed[] = activePet ? activePet.activeNeeds : activeEgg ? activeEgg.activeNeeds : [];

  if (needs.length === 0) return null;

  const handleAction = (need: PetNeed) => {
    let canInstantlyFulfill = false;

    if (need.type === 'hungry') {
      const food = foodInventory.find((f) => f.restores === 'hungry' && f.quantity > 0);
      if (food || currentLocationId === 'pizza') canInstantlyFulfill = true;
    } else if (need.type === 'thirsty') {
      const drink = foodInventory.find((f) => f.restores === 'thirsty' && f.quantity > 0);
      if (drink || currentLocationId === 'hotsprings') canInstantlyFulfill = true;
    } else if (need.type === 'school' && currentLocationId === 'school') {
      canInstantlyFulfill = true;
    } else if (need.type === 'hospital' && currentLocationId === 'hospital') {
      canInstantlyFulfill = true;
    } else if (need.type === 'playground' && currentLocationId === 'playground') {
      canInstantlyFulfill = true;
    } else if (need.type === 'hotsprings' && currentLocationId === 'hotsprings') {
      canInstantlyFulfill = true;
    } else if (need.type === 'camping' && currentLocationId === 'campsite') {
      canInstantlyFulfill = true;
    } else if (need.type === 'sleepy' || need.type === 'dirty') {
      canInstantlyFulfill = true;
    }

    if (canInstantlyFulfill) {
      soundFx.playNeedComplete();
      soundFx.playCoin();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#ec4899', '#38bdf8', '#10b981'],
      });
      onFulfillNeed(need.id, need.type, need.rewardBucks, need.rewardXp);
    } else {
      const landmark = MAP_LANDMARKS.find((l) => {
        if (need.type === 'school') return l.id === 'school';
        if (need.type === 'hospital') return l.id === 'hospital';
        if (need.type === 'playground') return l.id === 'playground';
        if (need.type === 'hotsprings') return l.id === 'hotsprings';
        if (need.type === 'camping') return l.id === 'campsite';
        if (need.type === 'pizza' || need.type === 'hungry') return l.id === 'pizza';
        return false;
      });

      if (landmark) {
        onTeleportTo([landmark.x, landmark.y, landmark.z]);
        soundFx.playJump();
      } else {
        soundFx.playNeedComplete();
        onFulfillNeed(need.id, need.type, need.rewardBucks, need.rewardXp);
      }
    }
  };

  return (
    <div className="absolute top-20 left-3 flex flex-col gap-2 pointer-events-auto max-w-xs z-20">
      <div className="font-pixel text-[9px] uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 px-3 py-1 rounded-full shadow-lg inline-flex items-center gap-1.5 self-start border border-amber-300">
        <Sparkles className="w-3 h-3" />
        {t('questsTitle').split('&')[0]} ({needs.length})
      </div>

      {needs.map((need) => {
        const localizedLabel = t(`need_${need.type}`, need.label);
        const localizedDesc = t(`needDesc_${need.type}`, 'Fulfill need for rewards');

        return (
          <div
            key={need.id}
            className="group relative bg-slate-900/95 backdrop-blur-xl text-white p-3 rounded-2xl pixel-box-amber flex items-center justify-between gap-2.5 transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-400 flex items-center justify-center text-xl shadow-lg border border-amber-300/60 shrink-0">
                {need.icon}
              </div>
              <div>
                <div className="font-pixel-heading font-bold text-sm text-amber-300 tracking-tight">{localizedLabel}</div>
                <div className="text-[11px] text-slate-300 font-medium line-clamp-1">{localizedDesc}</div>
                <div className="font-pixel text-[9px] text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                  <span>+${need.rewardBucks}</span>
                  <span className="text-pink-300">+{need.rewardXp} XP</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleAction(need)}
              className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-black text-xs px-3 py-2 rounded-xl shadow-md border border-amber-200 flex items-center gap-1 transition-transform active:scale-90 shrink-0"
            >
              <span>{t('fulfillNeed')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
