import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayerData, 
  HousePlot, 
  GameQuest, 
  PetInstance, 
  EggInstance, 
  EggItem, 
  InventoryFood, 
  FurnitureItem, 
  TradeSession, 
  NetworkPlayer, 
  AvatarCustomization 
} from './types/game';
import { INITIAL_PLAYER_DATA, DEFAULT_PLOTS, StorageService } from './services/storageService';
import { INITIAL_QUESTS, PET_SPECIES_LIST, EGG_CATALOG, VOXEL_BLOCKS } from './data/gameData';
import { multiplayer } from './services/multiplayerService';
import { soundFx } from './services/audioService';
import { SupportedLanguage } from './services/i18n';

import { GameCanvas, GraphicsQuality } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { PetNeedsOverlay } from './components/PetNeedsOverlay';
import { Hotbar } from './components/Hotbar';
import { InventoryModal } from './components/InventoryModal';
import { TradingModal } from './components/TradingModal';
import { NurseryEggModal } from './components/NurseryEggModal';
import { NeonFusionModal } from './components/NeonFusionModal';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { BuildCatalogModal } from './components/BuildCatalogModal';
import { ChatBox, ChatMessageItem } from './components/ChatBox';
import { AnalyticsModal } from './components/AnalyticsModal';
import { QuestsModal } from './components/QuestsModal';
import { MobileControls } from './components/MobileControls';
import confetti from 'canvas-confetti';

export default function App() {
  // Core Persistent State
  const [playerData, setPlayerData] = useState<PlayerData>(() => StorageService.loadPlayerData());
  const [housePlots, setHousePlots] = useState<HousePlot[]>(() => StorageService.loadHousePlots());
  const [quests, setQuests] = useState<GameQuest[]>(INITIAL_QUESTS);

  // Multi-Language & Graphics Quality Settings
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('adopt_me_lang');
      if (saved && ['en', 'es', 'de', 'fr', 'it', 'pt'].includes(saved)) {
        return saved as SupportedLanguage;
      }
      const navLang = navigator.language.slice(0, 2);
      if (['es', 'de', 'fr', 'it', 'pt'].includes(navLang)) {
        return navLang as SupportedLanguage;
      }
    } catch (e) {}
    return 'en';
  });

  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(() => {
    try {
      const saved = localStorage.getItem('adopt_me_gfx');
      if (saved && ['performance', 'balanced', 'ultra'].includes(saved)) {
        return saved as GraphicsQuality;
      }
    } catch (e) {}
    return 'performance';
  });

  const [retroFilterActive, setRetroFilterActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('adopt_me_retro');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch (e) {}
    return true;
  });

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    try {
      localStorage.setItem('adopt_me_lang', lang);
    } catch (e) {}
  };

  const handleToggleGraphics = () => {
    setGraphicsQuality((prev) => {
      const next: GraphicsQuality = prev === 'performance' ? 'balanced' : prev === 'balanced' ? 'ultra' : 'performance';
      try {
        localStorage.setItem('adopt_me_gfx', next);
      } catch (e) {}
      return next;
    });
  };

  const handleToggleRetroFilter = () => {
    setRetroFilterActive((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('adopt_me_retro', String(next));
      } catch (e) {}
      soundFx.playClick();
      return next;
    });
  };

  // Active Equips
  const activePet = playerData.equippedPetId
    ? playerData.pets.find((p) => p.id === playerData.equippedPetId) || null
    : null;

  const activeEgg = playerData.equippedEggId
    ? playerData.eggs.find((e) => e.id === playerData.equippedEggId) || null
    : null;

  // UI & Modals State
  const [activeModal, setActiveModal] = useState<
    'inventory' | 'trade' | 'build' | 'nursery' | 'neon' | 'avatar' | 'quests' | 'analytics' | null
  >(null);

  const [tradeSession, setTradeSession] = useState<TradeSession | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'm1',
      senderId: 'sys',
      senderName: '🌟 Server',
      text: 'Adopt Me! Craft: 60 FPS GPU Instancing active. Multi-language support enabled (EN, ES, DE, FR, IT, PT)!',
      timestamp: Date.now(),
      isSystem: true,
    },
  ]);

  // Gameplay State
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(1);
  const [isRiding, setIsRiding] = useState<boolean>(false);
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentLocationName, setCurrentLocationName] = useState<string>('Town Plaza');
  const [currentLocationId, setCurrentLocationId] = useState<string>('spawn');
  const [teleportTarget, setTeleportTarget] = useState<[number, number, number] | null>(null);
  const [networkPlayers, setNetworkPlayers] = useState<NetworkPlayer[]>([]);
  const [joystickInput, setJoystickInput] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Auto-Save Player & Plots
  useEffect(() => {
    StorageService.savePlayerData(playerData);
  }, [playerData]);

  useEffect(() => {
    StorageService.saveHousePlots(housePlots);
  }, [housePlots]);

  // Initialize Network and Bot Simulation
  useEffect(() => {
    multiplayer.startBotSimulation((bots) => {
      setNetworkPlayers(bots);
    });

    const unsubscribe = multiplayer.subscribe((event) => {
      if (event.type === 'CHAT_MESSAGE') {
        setMessages((prev) => [
          ...prev.slice(-30),
          {
            id: 'chat_' + Date.now() + Math.random(),
            senderId: event.senderId,
            senderName: event.senderName,
            text: event.text,
            timestamp: event.timestamp,
          },
        ]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Periodic Pet Needs Generator
  useEffect(() => {
    const timer = setInterval(() => {
      setPlayerData((prev) => {
        if (!prev.equippedPetId) return prev;
        const petIdx = prev.pets.findIndex((p) => p.id === prev.equippedPetId);
        if (petIdx === -1) return prev;

        const currentPet = prev.pets[petIdx];
        if (currentPet.activeNeeds.length >= 2) return prev;

        const needTypes = [
          { type: 'hungry', label: 'Hungry! Feed an apple or pizza', icon: '🍗', color: '#f97316', bucks: 25 },
          { type: 'thirsty', label: 'Thirsty! Give water or soda', icon: '💧', color: '#38bdf8', bucks: 20 },
          { type: 'sleepy', label: 'Sleepy! Rest in a pet crib', icon: '💤', color: '#8b5cf6', bucks: 30 },
          { type: 'dirty', label: 'Dirty! Take a bubble bath', icon: '🛁', color: '#06b6d4', bucks: 25 },
          { type: 'school', label: 'School Time! Visit the City School', icon: '🏫', color: '#eab308', bucks: 35 },
          { type: 'playground', label: 'Bored! Have fun at the Playground', icon: '🎡', color: '#22c55e', bucks: 30 },
          { type: 'hotsprings', label: 'Hot Springs! Soak in warm water', icon: '♨️', color: '#ec4899', bucks: 30 },
          { type: 'hospital', label: 'Sick! Visit the Hospital doctor', icon: '🏥', color: '#ef4444', bucks: 40 },
          { type: 'camping', label: 'Camping! Roast s\'mores at campsite', icon: '⛺', color: '#84cc16', bucks: 35 },
        ];

        const available = needTypes.filter((n) => !currentPet.activeNeeds.some((an) => an.type === n.type));
        if (available.length === 0) return prev;

        const chosen = available[Math.floor(Math.random() * available.length)];
        const newNeed = {
          id: 'need_' + Date.now(),
          type: chosen.type,
          label: chosen.label,
          icon: chosen.icon,
          color: chosen.color,
          rewardBucks: chosen.bucks,
          rewardXp: 20,
          expiresAt: Date.now() + 180000,
        };

        const updatedPet = {
          ...currentPet,
          activeNeeds: [...currentPet.activeNeeds, newNeed],
        };

        return {
          ...prev,
          pets: prev.pets.map((p, idx) => (idx === petIdx ? updatedPet : p)),
        };
      });
    }, 28000);

    return () => clearInterval(timer);
  }, []);

  // Periodic Egg Needs Generator
  useEffect(() => {
    const timer = setInterval(() => {
      setPlayerData((prev) => {
        if (!prev.equippedEggId) return prev;
        const eggIdx = prev.eggs.findIndex((e) => e.id === prev.equippedEggId);
        if (eggIdx === -1) return prev;

        const currentEgg = prev.eggs[eggIdx];
        if (currentEgg.activeNeeds.length >= 2) return prev;

        const needTypes = [
          { type: 'sleepy', label: 'Incubate Egg in Nursery Crib', icon: '💤', color: '#8b5cf6', bucks: 20 },
          { type: 'hotsprings', label: 'Warm Egg at Hot Springs', icon: '♨️', color: '#ec4899', bucks: 25 },
          { type: 'school', label: 'Take Egg to Class for Education', icon: '🏫', color: '#eab308', bucks: 30 },
          { type: 'playground', label: 'Swing Egg gently at Playground', icon: '🎡', color: '#22c55e', bucks: 25 },
          { type: 'camping', label: 'Campfire warmth at Campsite', icon: '⛺', color: '#84cc16', bucks: 30 },
        ];

        const available = needTypes.filter((n) => !currentEgg.activeNeeds.some((an) => an.type === n.type));
        if (available.length === 0) return prev;

        const chosen = available[Math.floor(Math.random() * available.length)];
        const newNeed = {
          id: 'need_' + Date.now(),
          type: chosen.type,
          label: chosen.label,
          icon: chosen.icon,
          color: chosen.color,
          rewardBucks: chosen.bucks,
          rewardXp: 15,
          expiresAt: Date.now() + 180000,
        };

        const updatedEgg = {
          ...currentEgg,
          activeNeeds: [...currentEgg.activeNeeds, newNeed],
        };

        return {
          ...prev,
          eggs: prev.eggs.map((e, idx) => (idx === eggIdx ? updatedEgg : e)),
        };
      });
    }, 24000);

    return () => clearInterval(timer);
  }, []);

  // Handle Need Completion
  const handleFulfillNeed = (needId: string, needType: string, bucksReward: number, xpReward: number) => {
    setPlayerData((prev) => {
      let updatedPets = [...prev.pets];
      let updatedEggs = [...prev.eggs];
      let newStats = { ...prev.stats, needsFulfilled: prev.stats.needsFulfilled + 1, totalBucksEarned: prev.stats.totalBucksEarned + bucksReward };

      // Check if pet had need
      if (prev.equippedPetId) {
        updatedPets = updatedPets.map((pet) => {
          if (pet.id !== prev.equippedPetId) return pet;

          const remainingNeeds = pet.activeNeeds.filter((n) => n.id !== needId);
          let newXp = pet.xp + xpReward;
          let newAge = pet.ageStage;
          let newMaxXp = pet.maxXp;

          if (newXp >= pet.maxXp) {
            newXp = 0;
            if (pet.ageStage === 'Newborn') {
              newAge = 'Junior';
              newMaxXp = 150;
            } else if (pet.ageStage === 'Junior') {
              newAge = 'Pre-Teen';
              newMaxXp = 200;
            } else if (pet.ageStage === 'Pre-Teen') {
              newAge = 'Teen';
              newMaxXp = 300;
            } else if (pet.ageStage === 'Teen') {
              newAge = 'Post-Teen';
              newMaxXp = 400;
            } else if (pet.ageStage === 'Post-Teen') {
              newAge = 'Full Grown';
              newMaxXp = 500;
              soundFx.playHatchFanfare();
              confetti({ particleCount: 60, spread: 70 });
            }
          }

          return {
            ...pet,
            xp: newXp,
            maxXp: newMaxXp,
            ageStage: newAge,
            activeNeeds: remainingNeeds,
          };
        });
      }

      // Check if egg had need
      if (prev.equippedEggId) {
        updatedEggs = updatedEggs.map((egg) => {
          if (egg.id !== prev.equippedEggId) return egg;

          const remainingNeeds = egg.activeNeeds.filter((n) => n.id !== needId);
          const newCompleted = egg.needsCompleted + 1;

          if (newCompleted >= egg.totalNeedsRequired) {
            const eggDef = EGG_CATALOG.find((e) => e.id === egg.eggTypeId) || EGG_CATALOG[0];
            const rawSpecies = eggDef.possiblePets[Math.floor(Math.random() * eggDef.possiblePets.length)];
            const speciesId = typeof rawSpecies === 'string' ? rawSpecies : rawSpecies?.speciesId || 'dog';
            const species = PET_SPECIES_LIST.find((s) => s.id === speciesId) || PET_SPECIES_LIST[0];

            const hatchedPet: PetInstance = {
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

            soundFx.playHatchFanfare();
            confetti({ particleCount: 80, spread: 80 });

            setTimeout(() => {
              setPlayerData((p) => ({
                ...p,
                pets: [...p.pets, hatchedPet],
                eggs: p.eggs.filter((e) => e.id !== egg.id),
                equippedPetId: hatchedPet.id,
                equippedEggId: null,
                stats: { ...p.stats, petsHatched: p.stats.petsHatched + 1 },
              }));
            }, 100);

            return {
              ...egg,
              needsCompleted: newCompleted,
              activeNeeds: remainingNeeds,
            };
          }

          return {
            ...egg,
            needsCompleted: newCompleted,
            activeNeeds: remainingNeeds,
          };
        });
      }

      return {
        ...prev,
        bucks: prev.bucks + bucksReward,
        pets: updatedPets,
        eggs: updatedEggs,
        stats: newStats,
      };
    });

    // Update quests progress
    setQuests((prevQuests) =>
      prevQuests.map((q) => {
        if (q.type === 'needs') {
          return { ...q, progress: q.progress + 1 };
        }
        return q;
      })
    );
  };

  // Block Placed / Broken Voxel Sync
  const handleBlockPlaced = (x: number, y: number, z: number, blockId: number) => {
    if (!playerData.claimedPlotId) return;

    setHousePlots((prev) =>
      prev.map((plot) => {
        if (plot.id !== playerData.claimedPlotId) return plot;
        const exists = plot.blocks.findIndex((b) => b.x === x && b.y === y && b.z === z);
        const newBlocks = exists >= 0
          ? plot.blocks.map((b, idx) => (idx === exists ? { x, y, z, blockId } : b))
          : [...plot.blocks, { x, y, z, blockId }];

        return { ...plot, blocks: newBlocks };
      })
    );

    setQuests((qList) =>
      qList.map((q) => (q.type === 'build' ? { ...q, progress: q.progress + 1 } : q))
    );
  };

  const handleBlockBroken = (x: number, y: number, z: number) => {
    if (!playerData.claimedPlotId) return;

    setHousePlots((prev) =>
      prev.map((plot) => {
        if (plot.id !== playerData.claimedPlotId) return plot;
        return { ...plot, blocks: plot.blocks.filter((b) => !(b.x === x && b.y === y && b.z === z)) };
      })
    );
  };

  // Open Trade with Partner
  const handleOpenTradeWithPartner = (partnerName: string) => {
    // Generate simulated trade partner offer
    const botPetSpecies = PET_SPECIES_LIST[Math.floor(Math.random() * PET_SPECIES_LIST.length)];
    const botPet: PetInstance = {
      id: 'bot_pet_' + Date.now(),
      speciesId: botPetSpecies.id,
      customName: botPetSpecies.name,
      ageStage: 'Teen',
      xp: 40,
      maxXp: 200,
      friendshipLevel: 2,
      rarity: botPetSpecies.rarity,
      isNeon: Math.random() > 0.6,
      isMegaNeon: false,
      canFly: Math.random() > 0.5,
      canRide: Math.random() > 0.4,
      equippedAccessories: [],
      activeNeeds: [],
      createdAt: Date.now(),
    };

    setTradeSession({
      id: 'trade_' + Date.now(),
      partnerId: 'bot_' + partnerName,
      partnerName: partnerName,
      myOffer: { pets: [], eggs: [], bucks: 0, accepted: false },
      partnerOffer: { pets: [botPet], eggs: [], bucks: 50, accepted: true },
      status: 'drafting',
      countdown: 5,
    });

    setActiveModal('trade');
    soundFx.playClick();
  };

  // Trade Acceptance Handlers
  const handleToggleAcceptTrade = () => {
    if (!tradeSession) return;
    const isNowAccepted = !tradeSession.myOffer.accepted;

    setTradeSession({
      ...tradeSession,
      myOffer: { ...tradeSession.myOffer, accepted: isNowAccepted },
      status: isNowAccepted ? 'reviewing' : 'drafting',
    });

    soundFx.playClick();
  };

  const handleConfirmFinalTrade = () => {
    if (!tradeSession) return;

    // Exchange items
    setPlayerData((prev) => {
      const remainingPets = prev.pets.filter(
        (p) => !tradeSession.myOffer.pets.some((op) => op.id === p.id)
      );
      const remainingEggs = prev.eggs.filter(
        (e) => !tradeSession.myOffer.eggs.some((oe) => oe.id === e.id)
      );

      return {
        ...prev,
        bucks: prev.bucks - tradeSession.myOffer.bucks + tradeSession.partnerOffer.bucks,
        pets: [...remainingPets, ...tradeSession.partnerOffer.pets],
        eggs: [...remainingEggs, ...tradeSession.partnerOffer.eggs],
        stats: {
          ...prev.stats,
          tradesCompleted: prev.stats.tradesCompleted + 1,
        },
      };
    });

    setQuests((qList) =>
      qList.map((q) => (q.type === 'trade' ? { ...q, progress: q.progress + 1 } : q))
    );

    soundFx.playTradeComplete();
    confetti({ particleCount: 70, spread: 80 });
    setActiveModal(null);
    setTradeSession(null);
  };

  // Neon Pet Fusion Handler
  const handleFuseNeonPet = (petIds: string[], isMega: boolean) => {
    const firstPet = playerData.pets.find((p) => p.id === petIds[0]);
    if (!firstPet) return;

    const newNeonPet: PetInstance = {
      ...firstPet,
      id: 'neon_' + Date.now(),
      customName: (isMega ? 'Mega ' : 'Neon ') + firstPet.customName,
      ageStage: 'Newborn',
      xp: 0,
      maxXp: 100,
      isNeon: !isMega,
      isMegaNeon: isMega,
    };

    setPlayerData((prev) => {
      const remaining = prev.pets.filter((p) => !petIds.includes(p.id));
      return {
        ...prev,
        pets: [...remaining, newNeonPet],
        equippedPetId: newNeonPet.id,
        stats: {
          ...prev.stats,
          neonFused: prev.stats.neonFused + 1,
        },
      };
    });

    setActiveModal(null);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 relative font-sans select-none">
      {/* 3D WebGL Canvas Viewport */}
      <GameCanvas
        playerData={playerData}
        activePet={activePet}
        activeEgg={activeEgg}
        selectedBlockId={selectedBlockId}
        selectedSlot={selectedSlot}
        isRiding={isRiding}
        isFlying={isFlying}
        networkPlayers={networkPlayers}
        graphicsQuality={graphicsQuality}
        retroFilterActive={retroFilterActive}
        onBlockPlaced={handleBlockPlaced}
        onBlockBroken={handleBlockBroken}
        onLocationChanged={(name, id) => {
          setCurrentLocationName(name);
          setCurrentLocationId(id);
        }}
        onOpenTradeWithBot={(bot) => handleOpenTradeWithPartner(bot.username)}
        onPetLove={() => {
          soundFx.playPetJoy();
          confetti({ particleCount: 30, spread: 50 });
        }}
        teleportTarget={teleportTarget}
        onTeleportComplete={() => setTeleportTarget(null)}
        joystickInput={joystickInput}
      />

      {/* Heads Up Display (HUD) */}
      <HUD
        playerData={playerData}
        activePet={activePet}
        activeEgg={activeEgg}
        currentLocationName={currentLocationName}
        onlineCount={networkPlayers.length + 1}
        isMuted={isMuted}
        currentLanguage={currentLanguage}
        graphicsQuality={graphicsQuality}
        retroFilterActive={retroFilterActive}
        onChangeLanguage={handleLanguageChange}
        onToggleGraphics={handleToggleGraphics}
        onToggleRetroFilter={handleToggleRetroFilter}
        onToggleMute={() => {
          soundFx.isMuted = !isMuted;
          setIsMuted(!isMuted);
        }}
        onOpenInventory={() => setActiveModal('inventory')}
        onOpenTrade={() => handleOpenTradeWithPartner('Luna_Star')}
        onOpenBuild={() => setActiveModal('build')}
        onOpenNursery={() => setActiveModal('nursery')}
        onOpenNeonCave={() => setActiveModal('neon')}
        onOpenAvatar={() => setActiveModal('avatar')}
        onOpenQuests={() => setActiveModal('quests')}
        onOpenAnalytics={() => setActiveModal('analytics')}
        onTeleportTo={(coords) => setTeleportTarget(coords)}
      />

      {/* Pet Floating Needs Action Bubbles */}
      <PetNeedsOverlay
        activePet={activePet}
        activeEgg={activeEgg}
        foodInventory={playerData.foodInventory}
        currentLocationId={currentLocationId}
        currentLanguage={currentLanguage}
        onFulfillNeed={handleFulfillNeed}
        onTeleportTo={(coords) => setTeleportTarget(coords)}
      />

      {/* Minecraft-style 8-slot Bottom Hotbar */}
      <Hotbar
        selectedSlot={selectedSlot}
        onSelectSlot={(slot) => setSelectedSlot(slot)}
        selectedBlockId={selectedBlockId}
        onSelectBlockId={(id) => setSelectedBlockId(id)}
        isRiding={isRiding}
        onToggleRide={() => setIsRiding(!isRiding)}
        isFlying={isFlying}
        onToggleFly={() => setIsFlying(!isFlying)}
        onPetLove={() => {
          soundFx.playPetJoy();
          confetti({ particleCount: 30, spread: 40 });
        }}
        hasPet={!!activePet}
        canRidePet={!!activePet?.canRide}
        canFlyPet={!!activePet?.canFly}
        currentLanguage={currentLanguage}
      />

      {/* Multiplayer Live Chat & Emotes */}
      <ChatBox
        messages={messages}
        onSendMessage={(text) => {
          multiplayer.sendChatMessage(playerData.id, playerData.username, text);
        }}
        onRequestTradeWithPlayer={(partnerName) => handleOpenTradeWithPartner(partnerName)}
        currentLanguage={currentLanguage}
      />

      {/* Mobile Touch Screen Controls */}
      <MobileControls
        onJoystickMove={(x, y) => setJoystickInput({ x, y })}
        onJump={() => soundFx.playJump()}
        onAction={() => setSelectedSlot(selectedSlot === 2 ? 1 : 2)}
        isFlying={isFlying}
      />

      {/* MODALS */}
      {activeModal === 'inventory' && (
        <InventoryModal
          playerData={playerData}
          onClose={() => setActiveModal(null)}
          onEquipPet={(id) => {
            setPlayerData((p) => ({ ...p, equippedPetId: id, equippedEggId: null }));
            setIsRiding(false);
            setIsFlying(false);
          }}
          onEquipEgg={(id) => {
            setPlayerData((p) => ({ ...p, equippedEggId: id, equippedPetId: null }));
            setIsRiding(false);
            setIsFlying(false);
          }}
          onRenamePet={(id, newName) => {
            setPlayerData((p) => ({
              ...p,
              pets: p.pets.map((pet) => (pet.id === id ? { ...pet, customName: newName } : pet)),
            }));
          }}
          onApplyPotion={(petId, potionType) => {
            setPlayerData((p) => ({
              ...p,
              pets: p.pets.map((pet) => {
                if (pet.id !== petId) return pet;
                if (potionType === 'ride') return { ...pet, canRide: true };
                if (potionType === 'fly') return { ...pet, canFly: true };
                if (potionType === 'age') return { ...pet, ageStage: 'Full Grown', xp: 100 };
                return pet;
              }),
            }));
            soundFx.playHatchFanfare();
            confetti({ particleCount: 50, spread: 60 });
          }}
          onToggleAccessory={(petId, accId) => {
            setPlayerData((p) => ({
              ...p,
              pets: p.pets.map((pet) => {
                if (pet.id !== petId) return pet;
                const exists = pet.equippedAccessories.includes(accId);
                return {
                  ...pet,
                  equippedAccessories: exists
                    ? pet.equippedAccessories.filter((a) => a !== accId)
                    : [...pet.equippedAccessories, accId],
                };
              }),
            }));
          }}
          onBuyFood={(food) => {
            if (playerData.bucks >= food.cost) {
              setPlayerData((p) => ({
                ...p,
                bucks: p.bucks - food.cost,
                foodInventory: p.foodInventory.map((f) =>
                  f.id === food.id ? { ...f, quantity: f.quantity + 1 } : f
                ),
              }));
              soundFx.playCoin();
            }
          }}
          onFeedPet={(food) => {
            if (food.quantity > 0 && activePet) {
              setPlayerData((p) => ({
                ...p,
                foodInventory: p.foodInventory.map((f) =>
                  f.id === food.id ? { ...f, quantity: f.quantity - 1 } : f
                ),
              }));
              soundFx.playPetJoy();
              const hungryNeed = activePet.activeNeeds.find((n) => n.type === 'hungry' || n.type === 'thirsty');
              if (hungryNeed) {
                handleFulfillNeed(hungryNeed.id, hungryNeed.type, hungryNeed.rewardBucks, hungryNeed.rewardXp);
              }
            }
          }}
          onSelectBlock={(id) => {
            setSelectedBlockId(id);
            setSelectedSlot(2);
          }}
          selectedBlockId={selectedBlockId}
          currentLanguage={currentLanguage}
        />
      )}

      {activeModal === 'trade' && tradeSession && (
        <TradingModal
          playerData={playerData}
          tradeSession={tradeSession}
          onClose={() => {
            setActiveModal(null);
            setTradeSession(null);
          }}
          onUpdateMyOffer={(pets, eggs, bucks) => {
            setTradeSession({
              ...tradeSession,
              myOffer: { ...tradeSession.myOffer, pets, eggs, bucks, accepted: false },
              status: 'drafting',
            });
          }}
          onToggleAccept={handleToggleAcceptTrade}
          onConfirmFinalTrade={handleConfirmFinalTrade}
          currentLanguage={currentLanguage}
        />
      )}

      {activeModal === 'nursery' && (
        <NurseryEggModal
          playerData={playerData}
          onClose={() => setActiveModal(null)}
          onBuyEgg={(egg) => {
            if (playerData.bucks >= egg.cost) {
              setPlayerData((p) => ({
                ...p,
                bucks: p.bucks - egg.cost,
                eggs: [
                  ...p.eggs,
                  {
                    id: 'egg_' + Date.now(),
                    eggTypeId: egg.id,
                    needsCompleted: 0,
                    totalNeedsRequired: egg.hatchNeedsRequired,
                    activeNeeds: [],
                  },
                ],
              }));
              soundFx.playCoin();
            }
          }}
          onEggHatchedImmediate={(pet) => {
            setPlayerData((p) => ({
              ...p,
              pets: [...p.pets, pet],
              equippedPetId: pet.id,
              equippedEggId: null,
              stats: { ...p.stats, petsHatched: p.stats.petsHatched + 1 },
            }));
            setQuests((qList) =>
              qList.map((q) => (q.type === 'hatch' ? { ...q, progress: q.progress + 1 } : q))
            );
          }}
          currentLanguage={currentLanguage}
        />
      )}

      {activeModal === 'neon' && (
        <NeonFusionModal
          playerData={playerData}
          onClose={() => setActiveModal(null)}
          onFuseNeonPet={handleFuseNeonPet}
          currentLanguage={currentLanguage}
        />
      )}

      {activeModal === 'avatar' && (
        <AvatarCustomizerModal
          avatar={playerData.avatar}
          onUpdateAvatar={(newAvatar) => {
            setPlayerData((p) => ({ ...p, avatar: newAvatar }));
          }}
          onClose={() => setActiveModal(null)}
          currentLanguage={currentLanguage}
        />
      )}

      {activeModal === 'build' && (
        <BuildCatalogModal
          playerData={playerData}
          housePlots={housePlots}
          onClose={() => setActiveModal(null)}
          onClaimPlot={(plotId) => {
            setPlayerData((p) => ({ ...p, claimedPlotId: plotId }));
            setHousePlots((plots) =>
              plots.map((plot) =>
                plot.id === plotId
                  ? { ...plot, ownerId: playerData.id, ownerName: playerData.username }
                  : plot
              )
            );
            soundFx.playCoin();
          }}
          onSelectBlock={(id) => {
            setSelectedBlockId(id);
            setSelectedSlot(2);
          }}
          selectedBlockId={selectedBlockId}
          onBuyFurniture={(furniture) => {
            if (playerData.bucks >= furniture.cost) {
              setPlayerData((p) => ({ ...p, bucks: p.bucks - furniture.cost }));
              soundFx.playCoin();
            }
          }}
          onClearPlot={(plotId) => {
            setHousePlots((plots) =>
              plots.map((plot) => (plot.id === plotId ? { ...plot, blocks: [] } : plot))
            );
          }}
          currentLanguage={currentLanguage}
        />
      )}

      {activeModal === 'quests' && (
        <QuestsModal
          playerData={playerData}
          quests={quests}
          onClaimQuest={(questId, rewardBucks) => {
            setQuests((qList) =>
              qList.map((q) => (q.id === questId ? { ...q, completed: true } : q))
            );
            setPlayerData((p) => ({
              ...p,
              bucks: p.bucks + rewardBucks,
              stats: { ...p.stats, totalBucksEarned: p.stats.totalBucksEarned + rewardBucks },
            }));
          }}
          onClose={() => setActiveModal(null)}
          currentLanguage={currentLanguage}
        />
      )}

      {activeModal === 'analytics' && (
        <AnalyticsModal
          playerData={playerData}
          onClose={() => setActiveModal(null)}
          currentLanguage={currentLanguage}
        />
      )}
    </div>
  );
}
