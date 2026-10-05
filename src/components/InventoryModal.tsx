import React, { useState } from 'react';
import { PlayerData, PetInstance, EggInstance, InventoryFood, PetAccessory } from '../types/game';
import { PET_SPECIES_LIST, EGG_CATALOG, VOXEL_BLOCKS, PET_ACCESSORIES, INITIAL_FOOD_CATALOG } from '../data/gameData';
import { X, Sparkles, Heart, Check, Plus, Edit2, Shield, Flame } from 'lucide-react';
import { soundFx } from '../services/audioService';
import { SupportedLanguage, getTranslation } from '../services/i18n';

interface InventoryModalProps {
  playerData: PlayerData;
  onClose: () => void;
  onEquipPet: (petId: string | null) => void;
  onEquipEgg: (eggId: string | null) => void;
  onRenamePet: (petId: string, newName: string) => void;
  onApplyPotion: (petId: string, potionType: 'ride' | 'fly' | 'age') => void;
  onToggleAccessory: (petId: string, accId: string) => void;
  onBuyFood: (food: InventoryFood) => void;
  onFeedPet: (food: InventoryFood) => void;
  onSelectBlock: (blockId: number) => void;
  selectedBlockId: number;
  currentLanguage?: SupportedLanguage;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  playerData,
  onClose,
  onEquipPet,
  onEquipEgg,
  onRenamePet,
  onApplyPotion,
  onToggleAccessory,
  onBuyFood,
  onFeedPet,
  onSelectBlock,
  selectedBlockId,
  currentLanguage = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'pets' | 'eggs' | 'food' | 'blocks' | 'accessories'>('pets');
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');

  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-amber-400/80 w-full max-w-3xl rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-pink-500/30 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg border border-amber-300">
              🎒
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{t('inventoryTitle')}</h2>
              <p className="text-xs text-amber-200/80 font-medium">{t('inventoryDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
          {[
            { id: 'pets', label: `${t('tabPets')} (${playerData.pets.length})` },
            { id: 'eggs', label: `${t('tabEggs')} (${playerData.eggs.length})` },
            { id: 'food', label: t('tabFood') },
            { id: 'blocks', label: t('tabBlocks') },
            { id: 'accessories', label: '👒 ' + t('avatar') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 border-2 border-amber-300'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* PETS TAB */}
          {activeTab === 'pets' && (
            <div className="space-y-4">
              {playerData.pets.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-4xl mb-2">🐾</p>
                  <p className="font-bold">{t('noPets')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {playerData.pets.map((pet) => {
                    const species = PET_SPECIES_LIST.find((s) => s.id === pet.speciesId);
                    const isEquipped = playerData.equippedPetId === pet.id;
                    const isFullGrown = pet.ageStage === 'Full Grown';

                    return (
                      <div
                        key={pet.id}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                          isEquipped
                            ? 'bg-pink-950/40 border-pink-400 shadow-xl shadow-pink-500/10'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center text-3xl shadow-inner">
                              🐾
                            </div>
                            <div>
                              {editingPetId === pet.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    className="bg-slate-900 text-white text-xs px-2 py-1 rounded border border-cyan-400 font-bold max-w-[110px]"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      if (nameInput.trim()) onRenamePet(pet.id, nameInput.trim());
                                      setEditingPetId(null);
                                    }}
                                    className="bg-emerald-500 text-slate-950 px-2 py-1 rounded text-xs font-black"
                                  >
                                    ✓
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-sm text-white">{pet.customName}</span>
                                  <button
                                    onClick={() => {
                                      setEditingPetId(pet.id);
                                      setNameInput(pet.customName);
                                    }}
                                    className="text-slate-400 hover:text-cyan-300"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              <p className="text-[11px] text-slate-400 font-medium">{species?.name}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-700 text-slate-200">
                              {t(`rarity_${pet.rarity.replace('-', '')}`, pet.rarity)}
                            </span>
                            {pet.isNeon && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 uppercase shadow-sm">
                                {t('neonGlow')}
                              </span>
                            )}
                            {pet.isMegaNeon && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-400 text-slate-950 uppercase animate-pulse shadow-sm">
                                {t('megaGlow')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Age & Status */}
                        <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">{t('age')}:</span>
                            <span className="font-bold text-amber-300">{t(`age_${pet.ageStage.replace('-', '').replace(' ', '')}`, pet.ageStage)}</span>
                          </div>
                          {isFullGrown && (
                            <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-400/30 text-center">
                              {t('petLevelMax')}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-slate-300">
                            {pet.canRide ? <span className="text-emerald-400 font-bold">✓ {t('ride')}</span> : <span className="text-slate-500">✗ {t('ride')}</span>}
                            {pet.canFly ? <span className="text-cyan-400 font-bold">✓ {t('fly')}</span> : <span className="text-slate-500">✗ {t('fly')}</span>}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => onEquipPet(isEquipped ? null : pet.id)}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition ${
                              isEquipped
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white shadow-md'
                            }`}
                          >
                            {isEquipped ? t('unequipPet') : t('equipPet')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* EGGS TAB */}
          {activeTab === 'eggs' && (
            <div className="space-y-4">
              {playerData.eggs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-4xl mb-2">🥚</p>
                  <p className="font-bold">{t('noEggs')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {playerData.eggs.map((egg) => {
                    const eggDef = EGG_CATALOG.find((e) => e.id === egg.eggTypeId);
                    const isEquipped = playerData.equippedEggId === egg.id;

                    return (
                      <div
                        key={egg.id}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                          isEquipped
                            ? 'bg-amber-950/40 border-amber-400 shadow-xl shadow-amber-500/10'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-3xl">
                            🐣
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-white">{eggDef?.name}</h4>
                            <p className="text-[11px] text-amber-300/80 font-medium">
                              {egg.needsCompleted}/{egg.totalNeedsRequired} {t('needsRequired')}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <button
                            onClick={() => onEquipEgg(isEquipped ? null : egg.id)}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition ${
                              isEquipped
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md font-black'
                            }`}
                          >
                            {isEquipped ? t('unequipPet') : t('hatchEgg')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FOOD & POTIONS TAB */}
          {activeTab === 'food' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {playerData.foodInventory.map((food) => {
                  const isPotion = food.type === 'potion';
                  return (
                    <div
                      key={food.id}
                      className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-center justify-between gap-3 hover:border-slate-500 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl">
                          {food.icon}
                        </div>
                        <div>
                          <h4 className="font-black text-xs text-white">{food.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">Qty: x{food.quantity}</p>
                          <p className="text-[10px] text-amber-400 font-bold">${food.cost} Bucks</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onBuyFood(food)}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-black border border-slate-600"
                        >
                          + {t('buyFurniture')}
                        </button>
                        {isPotion ? (
                          <button
                            onClick={() => {
                              if (food.quantity > 0 && playerData.equippedPetId) {
                                if (food.id === 'pot_ride') onApplyPotion(playerData.equippedPetId, 'ride');
                                if (food.id === 'pot_fly') onApplyPotion(playerData.equippedPetId, 'fly');
                                if (food.id === 'pot_age') onApplyPotion(playerData.equippedPetId, 'age');
                                onFeedPet(food);
                              }
                            }}
                            disabled={food.quantity <= 0 || !playerData.equippedPetId}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-40 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-md"
                          >
                            {t('usePotion')}
                          </button>
                        ) : (
                          <button
                            onClick={() => onFeedPet(food)}
                            disabled={food.quantity <= 0 || !playerData.equippedPetId}
                            className="bg-gradient-to-r from-amber-400 to-orange-500 disabled:opacity-40 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black shadow-md"
                          >
                            {t('feedPet')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BLOCKS TAB */}
          {activeTab === 'blocks' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {VOXEL_BLOCKS.map((block) => {
                  const isSelected = selectedBlockId === block.id;
                  return (
                    <button
                      key={block.id}
                      onClick={() => onSelectBlock(block.id)}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-xl shadow-cyan-500/20 scale-105'
                          : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-3xl">{block.icon}</div>
                      <span className="text-xs font-black text-white truncate max-w-full">{block.name}</span>
                      {isSelected && (
                        <span className="text-[10px] text-cyan-300 font-bold bg-cyan-500/20 px-2 py-0.5 rounded-full">
                          {t('activeBlock')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACCESSORIES TAB */}
          {activeTab === 'accessories' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PET_ACCESSORIES.map((acc) => {
                  const activeEquipped = playerData.pets
                    .find((p) => p.id === playerData.equippedPetId)
                    ?.equippedAccessories.includes(acc.id);

                  return (
                    <div
                      key={acc.id}
                      className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl">
                          {acc.icon}
                        </div>
                        <div>
                          <h4 className="font-black text-xs text-white">{acc.name}</h4>
                          <p className="text-[10px] text-cyan-300 font-semibold uppercase">{acc.type}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (playerData.equippedPetId) {
                            onToggleAccessory(playerData.equippedPetId, acc.id);
                            soundFx.playClick();
                          }
                        }}
                        disabled={!playerData.equippedPetId}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition disabled:opacity-40 ${
                          activeEquipped
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md'
                        }`}
                      >
                        {activeEquipped ? t('unequipPet') : t('equipPet')}
                      </button>
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
