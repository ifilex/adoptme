import { PlayerData, HousePlot, PetInstance, EggInstance, AvatarCustomization } from '../types/game';
import { INITIAL_FOOD_CATALOG } from '../data/gameData';

const STORAGE_KEY = 'ADOPT_ME_CRAFT_PLAYER_DATA_V1';
const PLOTS_KEY = 'ADOPT_ME_CRAFT_HOUSE_PLOTS_V1';
const ANALYTICS_KEY = 'ADOPT_ME_CRAFT_ANALYTICS_V1';

export const DEFAULT_AVATAR: AvatarCustomization = {
  skinColor: '#fcd34d',
  faceExpression: 'smile',
  hairStyle: 'short',
  hairColor: '#451a03',
  shirtColor: '#3b82f6',
  shirtPattern: 'adopt_me_logo',
  pantsColor: '#1e293b',
  hat: 'none',
  wings: 'none',
  backpack: 'school',
};

export const DEFAULT_STARTER_PET: PetInstance = {
  id: 'starter_pup_1',
  speciesId: 'dog',
  customName: 'Buttercup',
  rarity: 'Common',
  ageStage: 'Newborn',
  xp: 0,
  maxXp: 100,
  isNeon: false,
  isMegaNeon: false,
  canRide: false,
  canFly: false,
  isRiding: false,
  isFlying: false,
  activeNeeds: [
    {
      id: 'n1',
      type: 'hungry',
      label: 'Hungry! Feed me an Apple or Pizza',
      rewardBucks: 25,
      rewardXp: 20,
      durationSeconds: 120,
      remainingSeconds: 120,
      icon: '🍗',
      color: '#f97316',
    },
  ],
  equippedAccessories: [],
  friendshipLevel: 1,
  hatchedAt: Date.now(),
  tricksUnlocked: ['Sit'],
};

export const INITIAL_PLAYER_DATA: PlayerData = {
  id: 'player_' + Math.random().toString(36).substring(2, 9),
  username: 'BlockMaster_' + Math.floor(100 + Math.random() * 900),
  bucks: 1250,
  avatar: DEFAULT_AVATAR,
  equippedPetId: 'starter_pup_1',
  equippedEggId: null,
  pets: [DEFAULT_STARTER_PET],
  eggs: [
    {
      id: 'starter_egg_item_1',
      eggTypeId: 'starter_egg',
      needsCompleted: 0,
      totalNeedsRequired: 4,
      activeNeeds: [
        {
          id: 'egg_n1',
          type: 'sleepy',
          label: 'Egg is sleepy! Put in a crib',
          rewardBucks: 30,
          rewardXp: 25,
          durationSeconds: 120,
          remainingSeconds: 120,
          icon: '💤',
          color: '#8b5cf6',
        },
      ],
    },
  ],
  foodInventory: [...INITIAL_FOOD_CATALOG],
  claimedPlotId: 1,
  inventoryBlocks: {
    1: 64, // grass
    3: 64, // stone
    4: 32, // wood
    5: 64, // planks
    6: 48, // brick
    7: 32, // glass
    8: 16, // gold
    9: 16, // diamond
    11: 32, // pink wool
    12: 32, // cyan wool
    13: 16, // glowstone
  },
  unlockedAccessories: ['top_hat', 'golden_crown'],
  stats: {
    totalBucksEarned: 1250,
    petsHatched: 0,
    needsCompleted: 0,
    needsFulfilled: 0,
    tradesCompleted: 0,
    blocksPlaced: 0,
    neonFused: 0,
    timePlayedMinutes: 1,
    totalPlayTimeMinutes: 1,
    joinDate: Date.now(),
  },
  dailyStreak: 1,
  lastDailyClaim: Date.now() - 86400000,
};

export const DEFAULT_PLOTS: HousePlot[] = [
  {
    id: 1,
    ownerId: null,
    ownerName: null,
    position: [50, 2, -15],
    size: [16, 12, 16],
    blocks: [
      // Pre-built cute starter cottage
      { x: 0, y: 0, z: 0, blockId: 5 },
      { x: 1, y: 0, z: 0, blockId: 5 },
      { x: 2, y: 0, z: 0, blockId: 5 },
      { x: 3, y: 0, z: 0, blockId: 5 },
      { x: 4, y: 0, z: 0, blockId: 5 },
      { x: 0, y: 0, z: 1, blockId: 5 },
      { x: 4, y: 0, z: 1, blockId: 5 },
      { x: 0, y: 0, z: 2, blockId: 5 },
      { x: 4, y: 0, z: 2, blockId: 5 },
      { x: 0, y: 0, z: 3, blockId: 5 },
      { x: 4, y: 0, z: 3, blockId: 5 },
      { x: 0, y: 0, z: 4, blockId: 5 },
      { x: 1, y: 0, z: 4, blockId: 5 },
      { x: 2, y: 0, z: 4, blockId: 5 },
      { x: 3, y: 0, z: 4, blockId: 5 },
      { x: 4, y: 0, z: 4, blockId: 5 },
      // walls
      { x: 0, y: 1, z: 0, blockId: 6 },
      { x: 4, y: 1, z: 0, blockId: 6 },
      { x: 0, y: 1, z: 4, blockId: 6 },
      { x: 4, y: 1, z: 4, blockId: 6 },
      { x: 2, y: 1, z: 0, blockId: 7 }, // glass
      { x: 2, y: 1, z: 4, blockId: 7 },
      // glowstone
      { x: 2, y: 2, z: 2, blockId: 13 },
    ],
    furniture: [
      { id: 'f1', furnitureId: 'pet_crib', x: 1, y: 1, z: 1, rotation: 0 },
      { id: 'f2', furnitureId: 'pet_bowl_food', x: 3, y: 1, z: 1, rotation: 0 },
      { id: 'f3', furnitureId: 'pet_shower', x: 3, y: 1, z: 3, rotation: 0 },
    ],
    houseName: 'Starter Pet Haven',
    isLocked: false,
  },
  {
    id: 2,
    ownerId: 'npc_sophie',
    ownerName: 'Sophie_AdoptMe',
    position: [50, 2, 15],
    size: [16, 12, 16],
    blocks: [
      { x: 0, y: 0, z: 0, blockId: 11 },
      { x: 1, y: 0, z: 0, blockId: 11 },
      { x: 2, y: 0, z: 0, blockId: 11 },
      { x: 3, y: 0, z: 0, blockId: 11 },
      { x: 4, y: 0, z: 0, blockId: 11 },
      { x: 0, y: 1, z: 0, blockId: 12 },
      { x: 4, y: 1, z: 0, blockId: 12 },
      { x: 2, y: 2, z: 2, blockId: 13 },
    ],
    furniture: [
      { id: 'f4', furnitureId: 'luxury_pet_bed', x: 2, y: 1, z: 2, rotation: 0 },
      { id: 'f5', furnitureId: 'disco_ball', x: 2, y: 3, z: 2, rotation: 0 },
    ],
    houseName: 'Pastel Dream Castle',
    isLocked: false,
  },
];

export interface AnalyticsEvent {
  timestamp: number;
  type: string;
  payload: Record<string, unknown>;
}

export class StorageService {
  public static loadPlayerData(): PlayerData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...INITIAL_PLAYER_DATA,
          ...parsed,
          avatar: { ...DEFAULT_AVATAR, ...(parsed.avatar || {}) },
          stats: { ...INITIAL_PLAYER_DATA.stats, ...(parsed.stats || {}) },
        };
      }
    } catch {
      // ignore
    }
    return INITIAL_PLAYER_DATA;
  }

  public static savePlayerData(player: PlayerData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    } catch {
      // ignore
    }
  }

  public static loadHousePlots(): HousePlot[] {
    try {
      const data = localStorage.getItem(PLOTS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return DEFAULT_PLOTS;
  }

  public static saveHousePlots(plots: HousePlot[]): void {
    try {
      localStorage.setItem(PLOTS_KEY, JSON.stringify(plots));
    } catch {
      // ignore
    }
  }

  public static logAnalytics(eventType: string, payload: Record<string, unknown> = {}) {
    try {
      const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
      events.push({ timestamp: Date.now(), type: eventType, payload });
      if (events.length > 200) events.shift();
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
    } catch {
      // ignore
    }
  }

  public static getAnalytics(): AnalyticsEvent[] {
    try {
      return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
    } catch {
      return [];
    }
  }
}
