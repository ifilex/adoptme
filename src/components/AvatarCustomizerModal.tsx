import React, { useState } from 'react';
import { AvatarCustomization } from '../types/game';
import { X, Shirt, Sparkles, Check } from 'lucide-react';
import { soundFx } from '../services/audioService';
import { SupportedLanguage, getTranslation } from '../services/i18n';

interface AvatarCustomizerModalProps {
  avatar: AvatarCustomization;
  onUpdateAvatar: (avatar: AvatarCustomization) => void;
  onClose: () => void;
  currentLanguage?: SupportedLanguage;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  avatar,
  onUpdateAvatar,
  onClose,
  currentLanguage = 'en',
}) => {
  const [current, setCurrent] = useState<AvatarCustomization>(avatar);
  const t = (key: string, fallback?: string) => getTranslation(currentLanguage, key, fallback);

  const skinColors = ['#fbcfe8', '#fed7aa', '#fde047', '#d4a373', '#8d5b4c', '#582f0e', '#c4b5fd', '#6ee7b7'];
  const hairColors = ['#1e293b', '#b45309', '#f59e0b', '#dc2626', '#3b82f6', '#ec4899', '#10b981', '#ffffff'];
  const shirtColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#1e293b'];
  const pantsColors = ['#1e293b', '#1e3a8a', '#047857', '#6b21a8', '#374151', '#78350f', '#0f172a'];
  const hats = [
    { id: 'none', label: 'None' },
    { id: 'cap', label: 'Baseball Cap' },
    { id: 'crown', label: 'Golden Crown' },
    { id: 'horns', label: 'Neon Horns' },
  ];
  const wings = [
    { id: 'none', label: 'None' },
    { id: 'angel', label: 'Angel Wings' },
    { id: 'dragon', label: 'Dragon Wings' },
    { id: 'butterfly', label: 'Fairy Wings' },
  ];

  const handleSave = () => {
    onUpdateAvatar(current);
    soundFx.playCoin();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-cyan-400/80 w-full max-w-xl rounded-3xl shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl shadow-lg border border-cyan-300">
              👔
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">{t('avatarTitle')}</h2>
              <p className="text-xs text-cyan-200/80 font-medium">{t('avatarDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Skin Color */}
          <div>
            <label className="text-xs font-black uppercase text-slate-300 tracking-wider block mb-2">{t('skinColor')}</label>
            <div className="flex items-center gap-2 flex-wrap">
              {skinColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrent({ ...current, skinColor: color })}
                  className={`w-9 h-9 rounded-xl border-2 transition ${
                    current.skinColor === color ? 'border-cyan-400 scale-110 shadow-lg' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Hair Color */}
          <div>
            <label className="text-xs font-black uppercase text-slate-300 tracking-wider block mb-2">{t('hairColor')}</label>
            <div className="flex items-center gap-2 flex-wrap">
              {hairColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrent({ ...current, hairColor: color })}
                  className={`w-9 h-9 rounded-xl border-2 transition ${
                    current.hairColor === color ? 'border-cyan-400 scale-110 shadow-lg' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Shirt Color */}
          <div>
            <label className="text-xs font-black uppercase text-slate-300 tracking-wider block mb-2">{t('shirtColor')}</label>
            <div className="flex items-center gap-2 flex-wrap">
              {shirtColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrent({ ...current, shirtColor: color })}
                  className={`w-9 h-9 rounded-xl border-2 transition ${
                    current.shirtColor === color ? 'border-cyan-400 scale-110 shadow-lg' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Pants Color */}
          <div>
            <label className="text-xs font-black uppercase text-slate-300 tracking-wider block mb-2">{t('pantsColor')}</label>
            <div className="flex items-center gap-2 flex-wrap">
              {pantsColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrent({ ...current, pantsColor: color })}
                  className={`w-9 h-9 rounded-xl border-2 transition ${
                    current.pantsColor === color ? 'border-cyan-400 scale-110 shadow-lg' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Hat Choice */}
          <div>
            <label className="text-xs font-black uppercase text-slate-300 tracking-wider block mb-2">{t('hat')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {hats.map((hat) => (
                <button
                  key={hat.id}
                  onClick={() => setCurrent({ ...current, hat: hat.id as any })}
                  className={`py-2 px-3 rounded-xl border text-xs font-black transition ${
                    current.hat === hat.id ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  {hat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wings Choice */}
          <div>
            <label className="text-xs font-black uppercase text-slate-300 tracking-wider block mb-2">{t('wings')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {wings.map((wing) => (
                <button
                  key={wing.id}
                  onClick={() => setCurrent({ ...current, wings: wing.id as any })}
                  className={`py-2 px-3 rounded-xl border text-xs font-black transition ${
                    current.wings === wing.id ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  {wing.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-cyan-500/20 border-2 border-cyan-300 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{t('saveOutfit')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
