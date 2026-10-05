export type PetRarity = 'Common' | 'Uncommon' | 'Rare' | 'Ultra-Rare' | 'Legendary';

export type PetAgeStage = 'Newborn' | 'Junior' | 'Pre-Teen' | 'Teen' | 'Post-Teen' | 'Full Grown';

export type PetNeedType = 
  | 'hungry' 
  | 'thirsty' 
  | 'sleepy' 
  | 'dirty' 
  | 'school' 
  | 'playground' 
  | 'camping' 
  | 'hospital' 
  | 'hotsprings'
  | 'pizza';

export interface PetNeed {
  id: string;
  type: string;
  label: string;
  rewardBucks: number;
  rewardXp: number;
  icon: string;
  color?: string;
  durationSeconds?: number;
  remainingSeconds?: number;
  expiresAt?: number;
  targetLocation?: string;
}

export interface PetAccessory {
  id: string;
  name: string;
  type: string;
  color?: string;
  icon: string;
}

export interface PetInstance {
  id: string;
  speciesId: string;
  customName: string;
  rarity: PetRarity;
  ageStage: PetAgeStage;
  xp: number;
  maxXp: number;
  isNeon: boolean;
  isMegaNeon: boolean;
  canRide: boolean;
  canFly: boolean;
  isRiding?: boolean;
  isFlying?: boolean;
  activeNeeds: PetNeed[];
  equippedAccessories: string[];
  friendshipLevel: number;
  hatchedAt?: number;
  createdAt?: number;
  tricksUnlocked?: string[];
}

export interface PetSpecies {
  id: string;
  name: string;
  rarity: PetRarity;
  modelType: 'dog' | 'cat' | 'dragon' | 'unicorn' | 'panda' | 'penguin' | 'frog' | 'cow' | 'owl' | 'turtle' | 'kitsune' | 'bat_dragon';
  baseColor: string;
  accentColor: string;
  neonGlowColor: string;
  description: string;
  eggSource: string;
  canFlyDefault?: boolean;
}

export interface EggPetProbability {
  speciesId: string;
  probability: number;
}

export interface EggItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  eggColor: string;
  spotColor: string;
  icon?: string;
  possiblePets: (string | EggPetProbability)[];
  rarityWeights?: Record<string, number>;
  hatchNeedsRequired: number;
}

export interface EggInstance {
  id: string;
  eggTypeId: string;
  needsCompleted: number;
  totalNeedsRequired: number;
  activeNeeds: PetNeed[];
}

export interface InventoryFood {
  id: string;
  name: string;
  type: 'food' | 'drink' | 'potion';
  restores: 'hungry' | 'thirsty' | 'health' | 'ride_ability' | 'fly_ability' | 'grow_stage';
  icon: string;
  cost: number;
  quantity: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  cost: number;
  icon: string;
  satisfiesNeed?: string;
  width?: number;
  height?: number;
  depth?: number;
  color?: string;
}

export interface VoxelBlockType {
  id: number;
  name: string;
  color: string;
  textureType: 'grass' | 'dirt' | 'stone' | 'wood' | 'planks' | 'brick' | 'glass' | 'gold' | 'diamond' | 'obsidian' | 'wool_red' | 'wool_pink' | 'wool_cyan' | 'wool_yellow' | 'glowstone' | 'bookshelf' | 'leaves' | 'sand' | 'water' | 'quartz';
  isSolid: boolean;
  isTransparent?: boolean;
  emissive?: boolean;
  category?: string;
  icon: string;
}

export interface HousePlot {
  id: string | number;
  name?: string;
  ownerId: string | null;
  ownerName: string | null;
  position: [number, number, number];
  size: [number, number, number];
  blocks: { x: number; y: number; z: number; blockId: number }[];
  furniture: { id: string; furnitureId: string; x: number; y: number; z: number; rotation: number }[];
  houseName?: string;
  isLocked?: boolean;
}

export interface TradeOffer {
  pets: PetInstance[];
  eggs: EggInstance[];
  bucks: number;
  accepted: boolean;
}

export interface TradeSession {
  id: string;
  partnerId: string;
  partnerName: string;
  myOffer: TradeOffer;
  partnerOffer: TradeOffer;
  status: 'drafting' | 'reviewing' | 'completed' | 'cancelled';
  countdown: number;
}

export interface AvatarCustomization {
  skinColor: string;
  faceExpression?: string;
  hairStyle?: string;
  hairColor: string;
  shirtColor: string;
  shirtPattern?: string;
  pantsColor: string;
  hat?: string;
  wings?: string;
  backpack?: string;
}

export interface PlayerStats {
  totalBucksEarned: number;
  needsFulfilled: number;
  needsCompleted?: number;
  petsHatched: number;
  neonFused: number;
  tradesCompleted: number;
  totalPlayTimeMinutes: number;
  timePlayedMinutes?: number;
  blocksPlaced?: number;
  joinDate?: number;
}

export interface PlayerData {
  id: string;
  username: string;
  bucks: number;
  avatar: AvatarCustomization;
  equippedPetId: string | null;
  equippedEggId: string | null;
  pets: PetInstance[];
  eggs: EggInstance[];
  foodInventory: InventoryFood[];
  claimedPlotId: string | number | null;
  inventoryBlocks?: { [blockId: number]: number };
  unlockedAccessories?: string[];
  dailyStreak?: number;
  lastDailyClaim?: number;
  stats: PlayerStats;
}

export interface NetworkPlayer {
  id: string;
  username: string;
  position: [number, number, number];
  rotation: number;
  avatar: AvatarCustomization;
  equippedPet?: {
    speciesId: string;
    customName: string;
    isNeon: boolean;
    isMegaNeon: boolean;
    isRiding: boolean;
    isFlying: boolean;
  };
  currentAction?: string;
  chatBubble?: { message: string; timestamp: number };
}

export interface GameQuest {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalRequired?: number;
  target?: number;
  rewardBucks: number;
  completed: boolean;
  type: 'needs' | 'hatch' | 'trade' | 'build' | 'ride' | 'neon';
}
