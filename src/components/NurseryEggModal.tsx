import React, { useState } from 'react';
import { PlayerData, EggItem, PetInstance } from '../types/game';
import { EGG_CATALOG, PET_SPECIES_LIST } from '../data/gameData';
import { X, Sparkles, Egg, Star, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '../services/audioService';
import { SupportedLanguage, getTranslation } from '../services/i18n';

interface NurseryEggModalProps {
  playerData: PlayerData;
  onClose: () => void;
  onBuyEgg: (egg: EggItem) => void;
  onEggHatchedImmediate: (pet: PetInstance) => void;
  currentLanguage?: SupportedLanguage;
}

export const NurseryEggModal: React.FC<NurseryEggModalProps> = ({
  playerData,
  onClose,
  onBuyEgg,
  onEggHatchedImmediate,
  currentLanguage = 'en',
}) => {
  const [selectedEgg, setSelectedEgg] = useState<EggItem>(EGG_CATALOG[0]);
  const [isHatching, setIsHatching] = useState(false);
  const [hatchedPet, setHatchedPet] = useState<PetInstance | null>(null);

  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  const handleHatchInstant = () => {
    if (playerData.bucks < selectedEgg.cost) return;

    setIsHatching(true);
    soundFx.playEggCrack();

    setTimeout(() => {
      // Pick random species from pool
      const rawSpecies =
        selectedEgg.possiblePets[Math.floor(Math.random() * selectedEgg.possiblePets.length)];
      const speciesId = typeof rawSpecies === 'string' ? rawSpecies : rawSpecies?.speciesId || 'dog';
      const species = PET_SPECIES_LIST.find((s) => s.id === speciesId) || PET_SPECIES_LIST[0];

      const newPet: PetInstance = {
        id: 'pet_' + Date.now() + Math.random().toString(36).substr(2, 4),
        speciesId: species.id,
        customName: species.name,
        ageStage: 'Newborn',
        xp: 0,
        maxXp: 100,
        friendshipLevel: 1,
        rarity: species.rarity,
        isNeon: false,
        isMegaNeon: false,
        canFly: false,
        canRide: false,
        equippedAccessories: [],
        activeNeeds: [],
        createdAt: Date.now(),
      };

      setIsHatching(false);
      setHatchedPet(newPet);
      onBuyEgg(selectedEgg);
      onEggHatchedImmediate(newPet);

      soundFx.playHatchFanfare();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#f59e0b', '#38bdf8', '#a855f7'],
      });
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-pink-400/80 w-full max-w-2xl rounded-3xl shadow-2xl shadow-pink-500/20 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-amber-500/30 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-2xl shadow-lg border border-pink-300">
              🥚
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{t('nurseryTitle')}</h2>
              <p className="text-xs text-pink-200/80 font-medium">{t('nurseryDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {hatchedPet ? (
            <div className="text-center py-6 space-y-4 animate-scaleUp">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400 p-1 shadow-2xl shadow-pink-500/30">
                <div className="w-full h-full bg-slate-900 rounded-3xl flex items-center justify-center text-5xl">
                  🐾
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-amber-300 to-cyan-300">
                  {t('congratsHatched')}
                </h3>
                <p className="text-xl font-bold text-white mt-1">{hatchedPet.customName}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 uppercase shadow-md">
                  {t(`rarity_${hatchedPet.rarity.replace('-', '')}`, hatchedPet.rarity)}
                </span>
              </div>

              <button
                onClick={() => setHatchedPet(null)}
                className="mt-4 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-pink-500/25 border-2 border-pink-300 transition active:scale-95"
              >
                {t('claimReward')}
              </button>
            </div>
          ) : (
            <>
              {/* Egg Catalog Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EGG_CATALOG.map((egg) => {
                  const isSelected = selectedEgg.id === egg.id;
                  const canAfford = playerData.bucks >= egg.cost;

                  return (
                    <button
                      key={egg.id}
                      onClick={() => {
                        setSelectedEgg(egg);
                        soundFx.playClick();
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                        isSelected
                          ? 'bg-gradient-to-b from-pink-950/60 to-purple-950/60 border-pink-400 shadow-xl shadow-pink-500/25 scale-105'
                          : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
                        {egg.icon || '🥚'}
                      </div>
                      <span className="font-black text-xs text-white truncate max-w-full">{egg.name}</span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          canAfford ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'text-rose-400'
                        }`}
                      >
                        ${egg.cost}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Egg Details & Probability Info */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-pink-300 flex items-center gap-2">
                    <span>{selectedEgg.icon || '🥚'}</span>
                    <span>{selectedEgg.name}</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-semibold">
                    {selectedEgg.hatchNeedsRequired} {t('needsRequired')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">{selectedEgg.description}</p>

                {/* Drop Rates */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                  {Object.entries(selectedEgg.rarityWeights).map(([rarity, rate]) => (
                    <div key={rarity} className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">{rarity}</span>
                      <span className="text-xs font-black text-amber-300">{rate}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buy & Hatch Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (playerData.bucks >= selectedEgg.cost) {
                      onBuyEgg(selectedEgg);
                      onClose();
                    }
                  }}
                  disabled={playerData.bucks < selectedEgg.cost}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-amber-500/20 border-2 border-amber-300 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Egg className="w-4 h-4" />
                  <span>{t('buyEgg')} (${selectedEgg.cost})</span>
                </button>

                <button
                  onClick={handleHatchInstant}
                  disabled={playerData.bucks < selectedEgg.cost || isHatching}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 disabled:opacity-40 text-white font-black text-xs rounded-2xl shadow-xl shadow-pink-500/25 border-2 border-pink-300 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className={`w-4 h-4 ${isHatching ? 'animate-spin' : ''}`} />
                  <span>{isHatching ? t('hatching') : t('instantHatch')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
