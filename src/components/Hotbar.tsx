import React from 'react';
import { VoxelBlockType } from '../types/game';
import { VOXEL_BLOCKS } from '../data/gameData';
import { Pickaxe, Sparkles, Heart, Footprints } from 'lucide-react';
import { soundFx } from '../services/audioService';
import { SupportedLanguage, getTranslation } from '../services/i18n';

interface HotbarProps {
  selectedSlot: number;
  onSelectSlot: (slot: number) => void;
  selectedBlockId: number;
  onSelectBlockId: (id: number) => void;
  isRiding: boolean;
  onToggleRide: () => void;
  isFlying: boolean;
  onToggleFly: () => void;
  onPetLove: () => void;
  hasPet: boolean;
  canRidePet: boolean;
  canFlyPet: boolean;
  currentLanguage?: SupportedLanguage;
}

export const Hotbar: React.FC<HotbarProps> = ({
  selectedSlot,
  onSelectSlot,
  selectedBlockId,
  onSelectBlockId,
  isRiding,
  onToggleRide,
  isFlying,
  onToggleFly,
  onPetLove,
  hasPet,
  canRidePet,
  canFlyPet,
  currentLanguage = 'en',
}) => {
  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);
  const selectedBlock = VOXEL_BLOCKS.find((b) => b.id === selectedBlockId) || VOXEL_BLOCKS[0];

  const slots = [
    { id: 1, label: t('leftClickAction').split(':')[0] || 'Tool', icon: <Pickaxe className="w-5 h-5 text-amber-400" /> },
    { id: 2, label: selectedBlock.name, icon: <span className="text-2xl">{selectedBlock.icon}</span> },
    { id: 3, label: 'Apple', icon: <span className="text-2xl">🍎</span> },
    { id: 4, label: 'Water', icon: <span className="text-2xl">💧</span> },
    { 
      id: 5, 
      label: isRiding ? t('ridingHint').split(':')[0] || 'Dismount' : t('ride'), 
      icon: <span className="text-2xl">🐎</span>,
      active: isRiding,
      disabled: !hasPet || !canRidePet,
    },
    { 
      id: 6, 
      label: isFlying ? t('flyModeHint').split(':')[0] || 'Land' : t('fly'), 
      icon: <span className="text-2xl">🪽</span>,
      active: isFlying,
      disabled: !hasPet || !canFlyPet,
    },
    { id: 7, label: t('friendship'), icon: <Heart className="w-5 h-5 text-rose-400 fill-rose-400 animate-pulse" /> },
    { id: 8, label: 'Joy', icon: <Footprints className="w-5 h-5 text-cyan-400" /> },
  ];

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 bg-slate-900/95 backdrop-blur-xl p-2 rounded-3xl pixel-box-cyan z-20 max-w-[95vw] overflow-x-auto">
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.id;
        return (
          <button
            key={slot.id}
            onClick={() => {
              onSelectSlot(slot.id);
              if (slot.id === 5) onToggleRide();
              if (slot.id === 6) onToggleFly();
              if (slot.id === 7) onPetLove();
              soundFx.playCoin();
            }}
            disabled={slot.disabled}
            className={`relative flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-2xl transition-all ${
              isSelected
                ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 pixel-box-amber scale-105 font-black'
                : 'bg-slate-800/90 border border-slate-700 text-white hover:bg-slate-700 hover:border-cyan-400/60'
            } ${slot.active ? 'ring-2 ring-emerald-400 bg-emerald-950/60 border-emerald-400' : ''} ${
              slot.disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            {/* Slot Number Badge */}
            <span className={`absolute top-0.5 left-1.5 font-pixel text-[8px] ${isSelected ? 'text-slate-950/70 font-bold' : 'text-slate-400'}`}>
              {slot.id}
            </span>

            {/* Icon */}
            <div className="mt-1">{slot.icon}</div>

            {/* Label */}
            <span className={`text-[8px] font-bold truncate max-w-[92%] mt-0.5 ${isSelected ? 'text-slate-950 font-black' : 'text-slate-200'}`}>
              {slot.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
