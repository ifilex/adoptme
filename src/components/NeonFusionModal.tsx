import React, { useState } from 'react';
import { PlayerData, PetInstance } from '../types/game';
import { PET_SPECIES_LIST } from '../data/gameData';
import { X, Sparkles, Flame, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '../services/audioService';
import { SupportedLanguage, getTranslation } from '../services/i18n';

interface NeonFusionModalProps {
  playerData: PlayerData;
  onClose: () => void;
  onFuseNeonPet: (petIds: string[], isMega: boolean) => void;
  currentLanguage?: SupportedLanguage;
}

export const NeonFusionModal: React.FC<NeonFusionModalProps> = ({
  playerData,
  onClose,
  onFuseNeonPet,
  currentLanguage = 'en',
}) => {
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [isFusing, setIsFusing] = useState(false);

  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  // Group pets by species and neon status
  const eligiblePets = playerData.pets.filter((p) => p.ageStage === 'Full Grown');

  const handleToggleSelect = (petId: string) => {
    if (selectedPetIds.includes(petId)) {
      setSelectedPetIds(selectedPetIds.filter((id) => id !== petId));
    } else {
      if (selectedPetIds.length < 4) {
        // Must be same species
        const candidate = playerData.pets.find((p) => p.id === petId);
        if (selectedPetIds.length > 0) {
          const first = playerData.pets.find((p) => p.id === selectedPetIds[0]);
          if (candidate?.speciesId !== first?.speciesId) return;
          if (candidate?.isNeon !== first?.isNeon) return;
        }
        setSelectedPetIds([...selectedPetIds, petId]);
        soundFx.playClick();
      }
    }
  };

  const handleFuse = () => {
    if (selectedPetIds.length !== 4) return;

    setIsFusing(true);
    soundFx.playNeonCave();

    setTimeout(() => {
      const firstPet = playerData.pets.find((p) => p.id === selectedPetIds[0]);
      const isMega = !!firstPet?.isNeon;

      setIsFusing(false);
      onFuseNeonPet(selectedPetIds, isMega);

      soundFx.playHatchFanfare();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#06b6d4', '#ec4899', '#f59e0b', '#8b5cf6'],
      });
    }, 2200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-purple-400/80 w-full max-w-2xl rounded-3xl shadow-2xl shadow-purple-500/20 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-500/30 via-fuchsia-500/30 to-cyan-500/30 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center text-2xl shadow-lg border border-purple-300">
              ✨
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{t('neonCaveTitle')}</h2>
              <p className="text-xs text-purple-200/80 font-medium">{t('neonCaveDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Neon Fusion Pedestals */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-4 gap-3 bg-slate-950/80 p-4 rounded-3xl border border-purple-500/30 shadow-inner">
            {[0, 1, 2, 3].map((slotIdx) => {
              const petId = selectedPetIds[slotIdx];
              const pet = petId ? playerData.pets.find((p) => p.id === petId) : null;

              return (
                <div
                  key={slotIdx}
                  className={`h-28 rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center transition-all ${
                    pet
                      ? 'bg-gradient-to-b from-purple-950/80 to-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900/60 border-dashed border-slate-700'
                  }`}
                >
                  {pet ? (
                    <>
                      <div className="text-3xl animate-bounce">🐾</div>
                      <span className="text-xs font-black text-white truncate max-w-full mt-1">
                        {pet.customName}
                      </span>
                      <span className="text-[9px] text-amber-300 font-bold">{pet.ageStage}</span>
                    </>
                  ) : (
                    <div className="text-slate-600 text-xs font-black flex flex-col items-center gap-1">
                      <Sparkles className="w-4 h-4 text-purple-500/40" />
                      <span>{t('neonSlot')} {slotIdx + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Fusion Button */}
          <button
            onClick={handleFuse}
            disabled={selectedPetIds.length !== 4 || isFusing}
            className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 hover:from-purple-400 hover:to-cyan-300 disabled:opacity-30 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-purple-500/30 border-2 border-purple-200 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-5 h-5 ${isFusing ? 'animate-spin' : ''}`} />
            <span>{isFusing ? t('fuseNeon') + '...' : t('fuseNeon')}</span>
          </button>

          {/* Available Full Grown Pets for Fusion */}
          <div>
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
              {t('petLevelMax')} ({eligiblePets.length})
            </h4>

            {eligiblePets.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-semibold bg-slate-950/40 rounded-2xl border border-slate-800">
                {t('neonHint')}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {eligiblePets.map((pet) => {
                  const isSelected = selectedPetIds.includes(pet.id);
                  return (
                    <button
                      key={pet.id}
                      onClick={() => handleToggleSelect(pet.id)}
                      className={`p-2.5 rounded-2xl border-2 flex flex-col items-center gap-1 transition ${
                        isSelected
                          ? 'bg-purple-950/80 border-purple-400 shadow-md scale-105'
                          : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-2xl">🐾</span>
                      <span className="text-xs font-black text-white truncate max-w-full">{pet.customName}</span>
                      <span className="text-[9px] text-purple-300 font-bold">{pet.rarity}</span>
                      {isSelected && <span className="text-[9px] text-emerald-400 font-black">✓ {t('claimed')}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
