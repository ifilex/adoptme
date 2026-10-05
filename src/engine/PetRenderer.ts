import * as THREE from 'three';
import { PetInstance, EggInstance } from '../types/game';
import { PET_SPECIES_LIST, EGG_CATALOG } from '../data/gameData';

export class PetRenderer {
  public group: THREE.Group = new THREE.Group();
  public petMeshGroup: THREE.Group = new THREE.Group();
  public currentPetInstance: PetInstance | null = null;
  public currentEggInstance: EggInstance | null = null;

  private bodyMesh: THREE.Mesh | null = null;
  private headMesh: THREE.Mesh | null = null;
  private leftWingMesh: THREE.Mesh | null = null;
  private rightWingMesh: THREE.Mesh | null = null;
  private tailMesh: THREE.Mesh | null = null;
  private legs: THREE.Mesh[] = [];
  private neonMaterials: THREE.MeshStandardMaterial[] = [];

  private animTimer: number = 0;
  public isSitting: boolean = false;
  public isMounted: boolean = false;
  public isFlying: boolean = false;

  constructor() {
    this.group.add(this.petMeshGroup);
  }

  public setPet(pet: PetInstance | null) {
    this.currentPetInstance = pet;
    this.currentEggInstance = null;
    this.rebuildModel();
  }

  public setEgg(egg: EggInstance | null) {
    this.currentEggInstance = egg;
    this.currentPetInstance = null;
    this.rebuildModel();
  }

  public rebuildModel() {
    // Clear existing
    while (this.petMeshGroup.children.length > 0) {
      const obj = this.petMeshGroup.children[0];
      this.petMeshGroup.remove(obj);
    }
    this.legs = [];
    this.neonMaterials = [];
    this.leftWingMesh = null;
    this.rightWingMesh = null;
    this.tailMesh = null;

    if (this.currentEggInstance) {
      this.buildEggModel(this.currentEggInstance);
      return;
    }

    if (!this.currentPetInstance) return;

    const species = PET_SPECIES_LIST.find((s) => s.id === this.currentPetInstance!.speciesId) || PET_SPECIES_LIST[0];
    this.buildPetModel(species, this.currentPetInstance);
  }

  private buildEggModel(egg: EggInstance) {
    const eggDef = EGG_CATALOG.find((e) => e.id === egg.eggTypeId) || EGG_CATALOG[0];
    const eggGeo = new THREE.SphereGeometry(0.55, 16, 16);
    eggGeo.scale(0.8, 1.2, 0.8);

    const eggMat = new THREE.MeshStandardMaterial({
      color: eggDef.eggColor,
      roughness: 0.3,
      metalness: 0.1,
    });
    const eggMesh = new THREE.Mesh(eggGeo, eggMat);
    eggMesh.position.y = 0.6;
    eggMesh.castShadow = true;
    this.petMeshGroup.add(eggMesh);
    this.bodyMesh = eggMesh;

    // Spot decorations
    const spotGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const spotMat = new THREE.MeshStandardMaterial({ color: eggDef.spotColor });
    [
      [0.2, 0.8, 0.3],
      [-0.2, 0.4, -0.3],
      [0.3, 0.3, 0.2],
      [-0.25, 0.7, 0.25],
    ].forEach(([sx, sy, sz]) => {
      const spot = new THREE.Mesh(spotGeo, spotMat);
      spot.position.set(sx, sy, sz);
      eggMesh.add(spot);
    });
  }

  private buildPetModel(species: (typeof PET_SPECIES_LIST)[0], pet: PetInstance) {
    const isNeon = pet.isNeon || pet.isMegaNeon;
    const baseColor = new THREE.Color(species.baseColor);
    const accentColor = new THREE.Color(species.accentColor);
    const glowColor = new THREE.Color(species.neonGlowColor);

    const mainMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.6,
      emissive: isNeon ? glowColor.clone().multiplyScalar(0.2) : new THREE.Color(0x000000),
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.5,
      emissive: isNeon ? glowColor.clone().multiplyScalar(0.5) : new THREE.Color(0x000000),
    });

    const neonGlowMat = new THREE.MeshStandardMaterial({
      color: isNeon ? glowColor : accentColor,
      emissive: isNeon ? glowColor : new THREE.Color(0x000000),
      emissiveIntensity: isNeon ? 0.9 : 0,
      roughness: 0.2,
    });

    if (isNeon) {
      this.neonMaterials.push(neonGlowMat, mainMat, accentMat);
    }

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 1. Body Voxel Block
    const bodyGeo = new THREE.BoxGeometry(0.7, 0.6, 0.9);
    this.bodyMesh = new THREE.Mesh(bodyGeo, mainMat);
    this.bodyMesh.position.y = 0.5;
    this.bodyMesh.castShadow = true;
    this.petMeshGroup.add(this.bodyMesh);

    // 2. Head
    const headGeo = new THREE.BoxGeometry(0.65, 0.6, 0.65);
    this.headMesh = new THREE.Mesh(headGeo, mainMat);
    this.headMesh.position.set(0, 0.55, 0.55);
    this.headMesh.castShadow = true;
    this.bodyMesh.add(this.headMesh);

    // Snout / Nose
    const snoutGeo = new THREE.BoxGeometry(0.35, 0.25, 0.25);
    const snoutMesh = new THREE.Mesh(snoutGeo, accentMat);
    snoutMesh.position.set(0, -0.1, 0.35);
    this.headMesh.add(snoutMesh);

    // Cute Eyes
    [-0.2, 0.2].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.04), eyeMat);
      eye.position.set(ex, 0.08, 0.34);
      this.headMesh!.add(eye);

      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), pupilMat);
      pupil.position.set(ex > 0 ? 0.02 : -0.02, 0.03, 0.02);
      eye.add(pupil);
    });

    // Model specific features (Ears / Horns / Wings / Tails)
    if (species.modelType === 'dragon' || species.modelType === 'bat_dragon') {
      // Dragon Horns (Neon glowing!)
      [-0.22, 0.22].forEach((hx) => {
        const horn = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), neonGlowMat);
        horn.position.set(hx, 0.4, -0.1);
        horn.rotation.x = -0.3;
        horn.rotation.z = hx > 0 ? -0.2 : 0.2;
        this.headMesh!.add(horn);
      });

      // Dragon Wings
      const wingGeo = new THREE.BoxGeometry(0.6, 0.4, 0.05);
      this.leftWingMesh = new THREE.Mesh(wingGeo, neonGlowMat);
      this.leftWingMesh.position.set(-0.5, 0.2, 0);
      this.bodyMesh.add(this.leftWingMesh);

      this.rightWingMesh = new THREE.Mesh(wingGeo, neonGlowMat);
      this.rightWingMesh.position.set(0.5, 0.2, 0);
      this.bodyMesh.add(this.rightWingMesh);
    } else if (species.modelType === 'unicorn') {
      // Rainbow golden glowing Horn!
      const hornGeo = new THREE.ConeGeometry(0.1, 0.45, 6);
      const horn = new THREE.Mesh(hornGeo, neonGlowMat);
      horn.position.set(0, 0.5, 0.15);
      horn.rotation.x = 0.25;
      this.headMesh.add(horn);

      // Cute Ears
      [-0.22, 0.22].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.08), accentMat);
        ear.position.set(ex, 0.35, -0.1);
        this.headMesh!.add(ear);
      });
    } else if (species.modelType === 'kitsune') {
      // 9 Fox tails fan
      for (let i = -4; i <= 4; i++) {
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), neonGlowMat);
        tail.position.set(i * 0.08, 0.1, -0.55);
        tail.rotation.x = -0.5;
        tail.rotation.y = i * 0.15;
        this.bodyMesh.add(tail);
      }
    } else if (species.modelType === 'dog' || species.modelType === 'cat') {
      // Floppy / Pointy ears
      [-0.25, 0.25].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.1), accentMat);
        ear.position.set(ex, 0.35, -0.05);
        this.headMesh!.add(ear);
      });
      // Wagging tail
      this.tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), neonGlowMat);
      this.tailMesh.position.set(0, 0.1, -0.5);
      this.tailMesh.rotation.x = -0.5;
      this.bodyMesh.add(this.tailMesh);
    }

    // 4 Articulated Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.35, 0.18);
    const legPositions: [number, number, number][] = [
      [-0.25, -0.3, 0.3],
      [0.25, -0.3, 0.3],
      [-0.25, -0.3, -0.3],
      [0.25, -0.3, -0.3],
    ];

    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, neonGlowMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      this.bodyMesh!.add(leg);
      this.legs.push(leg);
    });
  }

  public updateAnimation(delta: number, isWalking: boolean, playerPos: THREE.Vector3, playerRot: number) {
    this.animTimer += delta;

    // Mega Neon Rainbow shift
    if (this.currentPetInstance?.isMegaNeon) {
      const hue = (this.animTimer * 0.4) % 1;
      const rainbowColor = new THREE.Color().setHSL(hue, 1.0, 0.5);
      this.neonMaterials.forEach((mat) => {
        mat.emissive = rainbowColor;
        mat.color = rainbowColor;
      });
    }

    // Follow player when not mounted
    if (!this.isMounted) {
      const targetX = playerPos.x + Math.sin(playerRot + Math.PI * 0.7) * 1.8;
      const targetZ = playerPos.z + Math.cos(playerRot + Math.PI * 0.7) * 1.8;
      const targetY = playerPos.y;

      this.group.position.x += (targetX - this.group.position.x) * 0.12;
      this.group.position.z += (targetZ - this.group.position.z) * 0.12;
      this.group.position.y += (targetY - this.group.position.y) * 0.15;

      // Orient toward player
      const dx = playerPos.x - this.group.position.x;
      const dz = playerPos.z - this.group.position.z;
      const angle = Math.atan2(dx, dz);
      this.group.rotation.y = angle;
    } else {
      // Mounted directly beneath player
      this.group.position.copy(playerPos);
      this.group.position.y -= 0.6;
      this.group.rotation.y = playerRot;
    }

    // Walking / Idle animations
    const walkSpeed = 10;
    if (isWalking) {
      this.legs.forEach((leg, idx) => {
        const sign = idx % 2 === 0 ? 1 : -1;
        leg.rotation.x = Math.sin(this.animTimer * walkSpeed) * 0.6 * sign;
      });
      if (this.tailMesh) {
        this.tailMesh.rotation.y = Math.sin(this.animTimer * 12) * 0.6;
      }
    } else {
      this.legs.forEach((leg) => {
        leg.rotation.x = 0;
      });
      if (this.tailMesh) {
        this.tailMesh.rotation.y = Math.sin(this.animTimer * 3) * 0.2;
      }
    }

    // Flying / Flapping animation
    if (this.leftWingMesh && this.rightWingMesh) {
      const flapSpeed = this.isFlying ? 18 : 6;
      const flapAngle = Math.sin(this.animTimer * flapSpeed) * 0.5;
      this.leftWingMesh.rotation.z = -0.3 + flapAngle;
      this.rightWingMesh.rotation.z = 0.3 - flapAngle;
    }

    // Gentle breathing wobble
    if (this.bodyMesh) {
      this.bodyMesh.position.y = 0.5 + Math.sin(this.animTimer * 4) * 0.03;
    }
  }
}
