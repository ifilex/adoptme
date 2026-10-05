import { NetworkPlayer, AvatarCustomization, TradeSession, PetInstance } from '../types/game';
import { PET_SPECIES_LIST } from '../data/gameData';

export type NetworkEventCallback = (event: NetworkEvent) => void;

export type NetworkEvent =
  | { type: 'PLAYER_MOVE'; player: NetworkPlayer }
  | { type: 'CHAT_MESSAGE'; senderId: string; senderName: string; text: string; timestamp: number }
  | { type: 'TRADE_REQUEST'; fromPlayer: NetworkPlayer; toPlayerId: string }
  | { type: 'TRADE_UPDATE'; session: TradeSession }
  | { type: 'BLOCK_CHANGED'; x: number; y: number; z: number; blockId: number; placedBy: string }
  | { type: 'PET_NEON_FORGED'; petName: string; ownerName: string; speciesName: string };

const BOT_NAMES = ['Luna_Star', 'Shadow_Hunter', 'Mochi_Bear', 'CraftyGamer99', 'Dragon_Lord', 'Kawaii_Panda', 'Frosty_Ace'];

const BOT_AVATARS: AvatarCustomization[] = [
  { skinColor: '#fcd34d', faceExpression: 'cute', hairStyle: 'pigtails', hairColor: '#ec4899', shirtColor: '#f472b6', shirtPattern: 'adopt_me_logo', pantsColor: '#0284c7', hat: 'cat_ears', wings: 'fairy', backpack: 'pet_carrier' },
  { skinColor: '#fed7aa', faceExpression: 'cool', hairStyle: 'spiky', hairColor: '#1e293b', shirtColor: '#1e1b2e', shirtPattern: 'hoodie', pantsColor: '#0f172a', hat: 'top_hat', wings: 'dragon', backpack: 'jetpack' },
  { skinColor: '#ffedd5', faceExpression: 'anime', hairStyle: 'long', hairColor: '#fbbf24', shirtColor: '#8b5cf6', shirtPattern: 'adopt_me_logo', pantsColor: '#475569', hat: 'halo', wings: 'angel', backpack: 'school' },
  { skinColor: '#fed7aa', faceExpression: 'confident', hairStyle: 'short', hairColor: '#78350f', shirtColor: '#10b981', shirtPattern: 'creeper', pantsColor: '#1e293b', hat: 'crown', wings: 'none', backpack: 'school' },
];

export class MultiplayerService {
  private channel: BroadcastChannel | null = null;
  private listeners: NetworkEventCallback[] = [];
  public simulatedPlayers: Map<string, NetworkPlayer> = new Map();
  public myId: string = '';

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('ADOPT_ME_CRAFT_BROADCAST_CHANNEL');
      this.channel.onmessage = (e) => {
        this.emitLocal(e.data);
      };
    }
    this.initSimulatedBots();
  }

  private initSimulatedBots() {
    const locations: [number, number, number][] = [
      [0, 2, -30],   // Nursery
      [30, 2, -20],  // School
      [-30, 2, -20], // Hospital
      [30, 2, 20],   // Park
      [-30, 2, 20],  // Hotsprings
      [0, 2, 35],    // Pizza
      [-40, 2, 0],   // Neon Cave
    ];

    const botPets = [
      { speciesId: 'frost_dragon', customName: 'Blizzard', isNeon: true, isMegaNeon: false, isRiding: true, isFlying: true },
      { speciesId: 'unicorn', customName: 'Sparkles', isNeon: true, isMegaNeon: true, isRiding: false, isFlying: false },
      { speciesId: 'shadow_dragon', customName: 'Nightfall', isNeon: false, isMegaNeon: false, isRiding: true, isFlying: true },
      { speciesId: 'cow', customName: 'Milkshake', isNeon: true, isMegaNeon: false, isRiding: true, isFlying: false },
      { speciesId: 'kitsune', customName: 'Flame', isNeon: false, isMegaNeon: false, isRiding: false, isFlying: false },
      { speciesId: 'owl', customName: 'Hooty', isNeon: true, isMegaNeon: false, isRiding: false, isFlying: true },
      { speciesId: 'bat_dragon', customName: 'Spooky', isNeon: true, isMegaNeon: true, isRiding: true, isFlying: true },
    ];

    BOT_NAMES.forEach((name, index) => {
      const id = 'bot_' + index;
      const pos = locations[index % locations.length];
      const avatar = BOT_AVATARS[index % BOT_AVATARS.length];
      const pet = botPets[index % botPets.length];

      this.simulatedPlayers.set(id, {
        id,
        username: name,
        position: [pos[0] + (Math.random() - 0.5) * 6, pos[1], pos[2] + (Math.random() - 0.5) * 6],
        rotation: Math.random() * Math.PI * 2,
        avatar,
        equippedPet: pet,
        currentAction: 'idle',
      });
    });
  }

  public startBotSimulation(onMoveUpdate: (players: NetworkPlayer[]) => void) {
    setInterval(() => {
      this.simulatedPlayers.forEach((bot) => {
        // slight wander
        const dx = (Math.random() - 0.5) * 0.4;
        const dz = (Math.random() - 0.5) * 0.4;
        bot.position[0] = Math.max(-60, Math.min(60, bot.position[0] + dx));
        bot.position[2] = Math.max(-60, Math.min(60, bot.position[2] + dz));
        bot.rotation = Math.atan2(dx, dz);
      });
      onMoveUpdate(Array.from(this.simulatedPlayers.values()));
    }, 100);

    // Random bot chat & roleplay
    const botChats = [
      'Trading Neon Frost Dragon for Bat Dragon + Adds! 🐉',
      'Anyone want to trade? Sent trade req! 🦄',
      'Heading to the Hot Springs to give my pet a bath ♨️',
      'Just hatched a Legendary Unicorn in Nursery!! 🎉✨',
      'Anyone need school / playground roleplay? 🏫',
      'Building a modern voxel mansion at plot 2! 🏡',
      'Taking care of my pet needs for Bucks! 💰',
    ];

    setInterval(() => {
      const bots = Array.from(this.simulatedPlayers.values());
      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      const randomChat = botChats[Math.floor(Math.random() * botChats.length)];
      
      randomBot.chatBubble = {
        message: randomChat,
        timestamp: Date.now(),
      };

      this.broadcast({
        type: 'CHAT_MESSAGE',
        senderId: randomBot.id,
        senderName: randomBot.username,
        text: randomChat,
        timestamp: Date.now(),
      });
    }, 18000);
  }

  public subscribe(cb: NetworkEventCallback) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private emitLocal(event: NetworkEvent) {
    this.listeners.forEach((cb) => cb(event));
  }

  public broadcast(event: NetworkEvent) {
    this.emitLocal(event);
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch {
        // ignore
      }
    }
  }

  public sendChatMessage(senderId: string, senderName: string, text: string) {
    this.broadcast({
      type: 'CHAT_MESSAGE',
      senderId,
      senderName,
      text,
      timestamp: Date.now(),
    });
  }

  // Create simulated trade partner offer
  public generateBotTradeOffer(partnerId: string): { pets: PetInstance[]; bucks: number } {
    const species = PET_SPECIES_LIST[Math.floor(Math.random() * PET_SPECIES_LIST.length)];
    const mockPet: PetInstance = {
      id: 'bot_pet_' + Date.now(),
      speciesId: species.id,
      customName: species.name,
      rarity: species.rarity,
      ageStage: 'Full Grown',
      xp: 100,
      maxXp: 100,
      isNeon: Math.random() > 0.5,
      isMegaNeon: false,
      canRide: true,
      canFly: true,
      isRiding: false,
      isFlying: false,
      activeNeeds: [],
      equippedAccessories: [],
      friendshipLevel: 5,
      hatchedAt: Date.now() - 500000,
      tricksUnlocked: ['Sit', 'Lay Down', 'Joy Spin', 'Dance'],
    };

    return {
      pets: [mockPet],
      bucks: Math.floor(Math.random() * 500) + 100,
    };
  }
}

export const multiplayer = new MultiplayerService();
