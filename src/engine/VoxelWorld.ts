import * as THREE from 'three';
import { HousePlot } from '../types/game';

// Procedural Minecraft Texture Generator with Texture Caching
const textureCache: Map<string, THREE.CanvasTexture> = new Map();

export function createVoxelTexture(type: string, colorHex: string): THREE.CanvasTexture {
  const cacheKey = `${type}_${colorHex}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  // Base background
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 32, 32);

  // Voxel pixel noise
  for (let x = 0; x < 32; x += 2) {
    for (let y = 0; y < 32; y += 2) {
      const shade = (Math.random() - 0.5) * 18;
      ctx.fillStyle = `rgba(0,0,0,${Math.max(0, shade / 255)})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // Type specific details
  if (type === 'grass') {
    ctx.fillStyle = '#4d7c0f';
    ctx.fillRect(0, 0, 32, 6);
    ctx.fillStyle = '#84cc16';
    for (let i = 0; i < 32; i += 4) {
      ctx.fillRect(i, 6, 2, 4);
    }
  } else if (type === 'brick') {
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 32, 32);
    ctx.beginPath();
    ctx.moveTo(0, 8); ctx.lineTo(32, 8);
    ctx.moveTo(0, 16); ctx.lineTo(32, 16);
    ctx.moveTo(0, 24); ctx.lineTo(32, 24);
    ctx.moveTo(16, 0); ctx.lineTo(16, 8);
    ctx.moveTo(8, 8); ctx.lineTo(8, 16);
    ctx.moveTo(24, 8); ctx.lineTo(24, 16);
    ctx.moveTo(16, 16); ctx.lineTo(16, 24);
    ctx.moveTo(8, 24); ctx.lineTo(8, 32);
    ctx.moveTo(24, 24); ctx.lineTo(24, 32);
    ctx.stroke();
  } else if (type === 'planks') {
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    for (let y = 0; y <= 32; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(32, y);
      ctx.stroke();
    }
  } else if (type === 'glowstone') {
    ctx.fillStyle = '#fef08a';
    for (let i = 0; i < 8; i++) {
      const rx = Math.random() * 26;
      const ry = Math.random() * 26;
      ctx.fillRect(rx, ry, 5, 5);
    }
  } else if (type === 'glass') {
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 28, 28);
    ctx.beginPath();
    ctx.moveTo(6, 6);
    ctx.lineTo(18, 6);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  textureCache.set(cacheKey, texture);
  return texture;
}

// Helper to create glowing high-contrast pixel neon billboard signs
export function createNeonBillboard(
  title: string,
  subtitle: string,
  icon: string,
  primaryColor: string,
  secondaryColor: string,
  width = 6.5,
  height = 2.2
): THREE.Group {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 180;
  const ctx = canvas.getContext('2d')!;

  // Background Slate Backplate
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 512, 180);

  // Outer Neon Glow Border
  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 10;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 18;
  ctx.strokeRect(8, 8, 496, 164);

  // Inner Neon Border
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, 484, 152);

  // Icon Badge
  ctx.shadowBlur = 0;
  ctx.font = '42px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, 30, 80);

  // Title Text with high-glow neon effect
  ctx.font = '900 32px "Press Start 2P", system-ui, sans-serif';
  ctx.fillStyle = primaryColor;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 16;
  ctx.fillText(title, 110, 68);

  // Subtitle Badge
  ctx.font = 'bold 16px monospace, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = secondaryColor;
  ctx.shadowBlur = 8;
  ctx.fillText(subtitle.toUpperCase(), 110, 115);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  group.add(mesh);

  // Subtle localized PointLight casting sign light
  const light = new THREE.PointLight(new THREE.Color(primaryColor), 1.2, 12);
  light.position.set(0, 0, 0.6);
  group.add(light);

  return group;
}

export interface BuildingZone {
  id: string;
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  roofMinY: number;
}

interface BlockInstanceRef {
  x: number;
  y: number;
  z: number;
  blockId: number;
  instanceIndex: number;
}

export class VoxelWorld {
  public scene: THREE.Scene;
  public blockMaterials: Map<number, THREE.Material> = new Map();
  public instancedMeshes: Map<number, THREE.InstancedMesh> = new Map();
  public instanceCapacities: Map<number, number> = new Map();
  public instanceCounts: Map<number, number> = new Map();
  
  // Coordinate to block data lookup
  public blockDataMap: Map<string, BlockInstanceRef> = new Map();
  // Array lookup per block ID: array index is instanceIndex, value is key "x,y,z"
  public instanceToKeyMap: Map<number, string[]> = new Map();

  // Roof Cutaway Management
  public buildingZones: BuildingZone[] = [];
  public buildingRoofs: Map<string, THREE.Group> = new Map();
  public activeIndoorBuildingId: string | null = null;

  // Animated Decorative Elements
  public animatedDecorations: {
    mesh: THREE.Object3D;
    type: 'spin_y' | 'bob_y' | 'flicker_light' | 'pulse_scale' | 'orbit';
    speed: number;
    initialY?: number;
    initialScale?: number;
  }[] = [];

  // Shared geometry
  public boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  public highlightBox: THREE.LineSegments;

  private tempMatrix = new THREE.Matrix4();
  private tempPosition = new THREE.Vector3();
  private animTime = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initMaterials();
    this.initInstancedMeshes();

    // Highlight wireframe for target block
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
    this.highlightBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    );
    this.highlightBox.visible = false;
    this.scene.add(this.highlightBox);

    this.generateAdoptMeMinecraftWorld();
    this.commitBatchUpdates();
  }

  private initMaterials() {
    const blockDefs: { id: number; type: string; color: string; emissive?: boolean; transparent?: boolean; opacity?: number }[] = [
      { id: 1, type: 'grass', color: '#5b8c32' },
      { id: 2, type: 'dirt', color: '#866043' },
      { id: 3, type: 'stone', color: '#7b7b7b' },
      { id: 4, type: 'wood', color: '#664c28' },
      { id: 5, type: 'planks', color: '#b8945f' },
      { id: 6, type: 'brick', color: '#9b4231' },
      { id: 7, type: 'glass', color: '#a5f3fc', transparent: true, opacity: 0.5 },
      { id: 8, type: 'gold', color: '#facc15', emissive: true },
      { id: 9, type: 'diamond', color: '#38bdf8', emissive: true },
      { id: 10, type: 'obsidian', color: '#1e1b2e' },
      { id: 11, type: 'wool_pink', color: '#f472b6' },
      { id: 12, type: 'wool_cyan', color: '#06b6d4', emissive: true },
      { id: 13, type: 'glowstone', color: '#fbbf24', emissive: true },
      { id: 14, type: 'bookshelf', color: '#854d0e' },
      { id: 15, type: 'leaves', color: '#2d6a4f', transparent: true, opacity: 0.9 },
      { id: 16, type: 'quartz', color: '#f8fafc' },
      { id: 17, type: 'sand', color: '#eab308' },
    ];

    blockDefs.forEach((def) => {
      const texture = createVoxelTexture(def.type, def.color);
      const mat = new THREE.MeshLambertMaterial({
        map: texture,
        transparent: !!def.transparent,
        opacity: def.opacity || 1.0,
        emissive: def.emissive ? new THREE.Color(def.color).multiplyScalar(0.35) : new THREE.Color(0x000000),
      });
      this.blockMaterials.set(def.id, mat);
    });
  }

  private initInstancedMeshes() {
    // Generous initial capacity per block type
    const defaultCapacity = 45000;
    this.blockMaterials.forEach((mat, blockId) => {
      const capacity = (blockId === 1 || blockId === 2 || blockId === 3 || blockId === 16) ? defaultCapacity : 12000;
      const mesh = new THREE.InstancedMesh(this.boxGeometry, mat, capacity);
      mesh.count = 0;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      this.scene.add(mesh);

      this.instancedMeshes.set(blockId, mesh);
      this.instanceCapacities.set(blockId, capacity);
      this.instanceCounts.set(blockId, 0);
      this.instanceToKeyMap.set(blockId, []);
    });
  }

  public setBlock(x: number, y: number, z: number, blockId: number, deferCommit = false) {
    const key = `${x},${y},${z}`;
    const existing = this.blockDataMap.get(key);

    // 1. Remove if exists
    if (existing) {
      const oldBlockId = existing.blockId;
      const oldMesh = this.instancedMeshes.get(oldBlockId);
      const keyList = this.instanceToKeyMap.get(oldBlockId);
      const oldIdx = existing.instanceIndex;

      if (oldMesh && keyList && oldIdx !== -1) {
        const lastIdx = oldMesh.count - 1;
        if (oldIdx !== lastIdx && lastIdx >= 0) {
          const lastKey = keyList[lastIdx];
          const lastRef = this.blockDataMap.get(lastKey);
          if (lastRef) {
            oldMesh.getMatrixAt(lastIdx, this.tempMatrix);
            oldMesh.setMatrixAt(oldIdx, this.tempMatrix);
            lastRef.instanceIndex = oldIdx;
            keyList[oldIdx] = lastKey;
          }
        }
        keyList.pop();
        oldMesh.count = Math.max(0, oldMesh.count - 1);
        if (!deferCommit) {
          oldMesh.instanceMatrix.needsUpdate = true;
        }
      }
      this.blockDataMap.delete(key);
    }

    // 2. Block 0 is air
    if (blockId === 0) return;

    // 3. Add instance
    const mesh = this.instancedMeshes.get(blockId);
    const keyList = this.instanceToKeyMap.get(blockId);
    const capacity = this.instanceCapacities.get(blockId) || 12000;

    if (!mesh || !keyList) return;
    if (mesh.count >= capacity) return;

    const newIdx = mesh.count;
    this.tempPosition.set(x + 0.5, y + 0.5, z + 0.5);
    this.tempMatrix.makeTranslation(this.tempPosition.x, this.tempPosition.y, this.tempPosition.z);
    mesh.setMatrixAt(newIdx, this.tempMatrix);
    mesh.count++;
    
    keyList.push(key);
    this.blockDataMap.set(key, { x, y, z, blockId, instanceIndex: newIdx });

    if (!deferCommit) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public commitBatchUpdates() {
    this.instancedMeshes.forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
    });
  }

  public getBlock(x: number, y: number, z: number): number {
    const key = `${x},${y},${z}`;
    return this.blockDataMap.get(key)?.blockId || 0;
  }

  public isSolid(x: number, y: number, z: number): boolean {
    const key = `${x},${y},${z}`;
    const block = this.blockDataMap.get(key);
    return !!block && block.blockId > 0;
  }

  public loadPlotBlocks(plot: HousePlot) {
    plot.blocks.forEach((b) => {
      this.setBlock(plot.position[0] + b.x, plot.position[1] + b.y, plot.position[2] + b.z, b.blockId, true);
    });
    this.commitBatchUpdates();
  }

  // Create a dedicated modular roof voxel group for a building
  private addRoofVoxel(buildingId: string, x: number, y: number, z: number, blockId: number) {
    let roofGroup = this.buildingRoofs.get(buildingId);
    if (!roofGroup) {
      roofGroup = new THREE.Group();
      roofGroup.name = `roof_${buildingId}`;
      this.scene.add(roofGroup);
      this.buildingRoofs.set(buildingId, roofGroup);
    }

    const mat = this.blockMaterials.get(blockId);
    if (mat) {
      const mesh = new THREE.Mesh(this.boxGeometry, mat);
      mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      roofGroup.add(mesh);
    }
  }

  // Fast DDA Voxel Raycasting
  public raycastTarget(raycaster: THREE.Raycaster, maxDistance = 14): {
    point: THREE.Vector3;
    normal: THREE.Vector3;
    blockCoord: [number, number, number];
  } | null {
    const origin = raycaster.ray.origin;
    const dir = raycaster.ray.direction;

    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = dir.x > 0 ? 1 : dir.x < 0 ? -1 : 0;
    const stepY = dir.y > 0 ? 1 : dir.y < 0 ? -1 : 0;
    const stepZ = dir.z > 0 ? 1 : dir.z < 0 ? -1 : 0;

    const deltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const deltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const deltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;

    let nextX = dir.x > 0 ? (Math.floor(origin.x) + 1 - origin.x) * deltaX : (origin.x - Math.floor(origin.x)) * deltaX;
    let nextY = dir.y > 0 ? (Math.floor(origin.y) + 1 - origin.y) * deltaY : (origin.y - Math.floor(origin.y)) * deltaY;
    let nextZ = dir.z > 0 ? (Math.floor(origin.z) + 1 - origin.z) * deltaZ : (origin.z - Math.floor(origin.z)) * deltaZ;

    let normal = new THREE.Vector3(0, 1, 0);
    let distance = 0;

    while (distance < maxDistance) {
      if (nextX < nextY) {
        if (nextX < nextZ) {
          x += stepX;
          distance = nextX;
          nextX += deltaX;
          normal.set(-stepX, 0, 0);
        } else {
          z += stepZ;
          distance = nextZ;
          nextZ += deltaZ;
          normal.set(0, 0, -stepZ);
        }
      } else {
        if (nextY < nextZ) {
          y += stepY;
          distance = nextY;
          nextY += deltaY;
          normal.set(0, -stepY, 0);
        } else {
          z += stepZ;
          distance = nextZ;
          nextZ += deltaZ;
          normal.set(0, 0, -stepZ);
        }
      }

      const block = this.getBlock(x, y, z);
      if (block > 0) {
        const hitPoint = origin.clone().add(dir.clone().multiplyScalar(distance));
        return {
          point: hitPoint,
          normal: normal,
          blockCoord: [x, y, z],
        };
      }
    }

    return null;
  }

  public updateHighlight(hit: { blockCoord: [number, number, number]; normal: THREE.Vector3 } | null, isPlacing: boolean) {
    if (!hit) {
      this.highlightBox.visible = false;
      return;
    }
    this.highlightBox.visible = true;
    if (isPlacing) {
      const px = hit.blockCoord[0] + Math.round(hit.normal.x);
      const py = hit.blockCoord[1] + Math.round(hit.normal.y);
      const pz = hit.blockCoord[2] + Math.round(hit.normal.z);
      this.highlightBox.position.set(px + 0.5, py + 0.5, pz + 0.5);
    } else {
      this.highlightBox.position.set(hit.blockCoord[0] + 0.5, hit.blockCoord[1] + 0.5, hit.blockCoord[2] + 0.5);
    }
  }

  // Real-time Roof Cutaway System: hides roof/ceilings when player enters any enclosed building!
  public updateRoofCutaway(playerPos: THREE.Vector3) {
    let indoorBuilding: BuildingZone | null = null;

    for (const zone of this.buildingZones) {
      if (
        playerPos.x >= zone.minX &&
        playerPos.x <= zone.maxX &&
        playerPos.z >= zone.minZ &&
        playerPos.z <= zone.maxZ &&
        playerPos.y <= zone.roofMinY + 1.5
      ) {
        indoorBuilding = zone;
        break;
      }
    }

    this.activeIndoorBuildingId = indoorBuilding ? indoorBuilding.id : null;

    // Toggle Roof Visibilities
    this.buildingRoofs.forEach((group, id) => {
      const isInsideThis = this.activeIndoorBuildingId === id;
      group.visible = !isInsideThis;
    });
  }

  // Update dynamic animations for decor, glowing eggs, campfire, crystals
  public updateDecorAnimations(delta: number) {
    this.animTime += delta;

    this.animatedDecorations.forEach((item) => {
      if (item.type === 'spin_y') {
        item.mesh.rotation.y += delta * item.speed;
      } else if (item.type === 'bob_y') {
        if (item.initialY !== undefined) {
          item.mesh.position.y = item.initialY + Math.sin(this.animTime * item.speed) * 0.15;
        }
      } else if (item.type === 'pulse_scale') {
        if (item.initialScale !== undefined) {
          const s = item.initialScale * (1.0 + Math.sin(this.animTime * item.speed) * 0.08);
          item.mesh.scale.set(s, s, s);
        }
      } else if (item.type === 'flicker_light') {
        if (item.mesh instanceof THREE.PointLight) {
          item.mesh.intensity = 1.6 + Math.sin(this.animTime * 14) * 0.4 + (Math.random() - 0.5) * 0.3;
        }
      }
    });
  }

  private generateAdoptMeMinecraftWorld() {
    // 1. Terrain & Pathways (Grass + Stone Roads + Plaza)
    for (let x = -60; x <= 60; x++) {
      for (let z = -60; z <= 60; z++) {
        const isPlaza = Math.abs(x) <= 9 && Math.abs(z) <= 9;
        const isRoadX = Math.abs(z) <= 3 && Math.abs(x) <= 56;
        const isRoadZ = Math.abs(x) <= 3 && Math.abs(z) <= 56;
        const isDiagonalRoad = (Math.abs(x - z) <= 2 || Math.abs(x + z) <= 2) && Math.abs(x) <= 42 && Math.abs(z) <= 42;

        this.setBlock(x, 0, z, 2, true); // Dirt Base

        if (isPlaza) {
          const isCheck = (x + z) % 2 === 0;
          this.setBlock(x, 1, z, isCheck ? 16 : 9, true); // Quartz & Diamond Grid Plaza
        } else if (isRoadX || isRoadZ || isDiagonalRoad) {
          this.setBlock(x, 1, z, 3, true); // Cobblestone Roads
        } else {
          this.setBlock(x, 1, z, 1, true); // Grass
        }
      }
    }

    // Register Building Zones for Cutaways
    this.buildingZones = [
      { id: 'nursery', name: 'Nursery', minX: -8, maxX: 8, minZ: -43, maxZ: -27, roofMinY: 5 },
      { id: 'school', name: 'School', minX: 28, maxX: 43, minZ: -32, maxZ: -18, roofMinY: 5 },
      { id: 'hospital', name: 'Hospital', minX: -42, maxX: -28, minZ: -32, maxZ: -18, roofMinY: 5 },
      { id: 'pizza', name: 'Pizza Place', minX: -8, maxX: 8, minZ: 33, maxZ: 47, roofMinY: 5 },
      { id: 'neon_cave', name: 'Neon Cave', minX: -53, maxX: -37, minZ: -9, maxZ: 9, roofMinY: 5 },
    ];

    // 2. Central Town Plaza & Luminous Fountain
    this.buildPlaza(0, 1, 0);

    // 3. The Nursery (Adoption Center)
    this.buildNursery(0, 1, -35);

    // 4. Neon Cave Altar
    this.buildNeonCave(-45, 1, 0);

    // 5. City School
    this.buildSchool(35, 1, -25);

    // 6. Pet Hospital
    this.buildHospital(-35, 1, -25);

    // 7. Fun Park & Playground
    this.buildPlayground(35, 1, 25);

    // 8. Zen Hot Springs
    this.buildHotSprings(-35, 1, 25);

    // 9. Luigi's Pizza Place & Retro Diner
    this.buildPizzaPlace(0, 1, 40);

    // 10. Starry Campsite
    this.buildCampsite(-45, 1, -40);

    // 11. Street Lamps, Neon Arches, Flower Beds & Trees
    this.buildStreetDecor();
  }

  private buildPlaza(cx: number, cy: number, cz: number) {
    // Multi-tier crystal fountain with glowing water
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist <= 4.2 && dist >= 3.2) {
          this.setBlock(cx + x, cy + 1, cz + z, 16, true); // Quartz rim
        } else if (dist < 3.2) {
          this.setBlock(cx + x, cy + 1, cz + z, 9, true); // Diamond glowing water
        }
      }
    }

    // Center Spire with Neon Ring
    for (let y = 1; y <= 5; y++) {
      this.setBlock(cx, cy + y, cz, 16, true);
    }
    this.setBlock(cx, cy + 6, cz, 13, true); // Glowstone top

    // Water cascades
    this.setBlock(cx + 1, cy + 4, cz, 9, true);
    this.setBlock(cx - 1, cy + 4, cz, 9, true);
    this.setBlock(cx, cy + 4, cz + 1, 9, true);
    this.setBlock(cx, cy + 4, cz - 1, 9, true);

    // Plaza Neon Holographic Billboard
    const plazaSign = createNeonBillboard('TOWN PLAZA', 'Central Gathering Hub', '✨', '#38bdf8', '#f472b6', 6.5, 2.2);
    plazaSign.position.set(cx, cy + 7.5, cz);
    this.scene.add(plazaSign);
    this.animatedDecorations.push({ mesh: plazaSign, type: 'bob_y', speed: 2, initialY: cy + 7.5 });

    // Cozy Plaza Benches & Planters
    [[-6, 0, -6], [6, 0, -6], [-6, 0, 6], [6, 0, 6]].forEach(([bx, by, bz]) => {
      this.setBlock(cx + bx, cy + 1, cz + bz, 5, true); // Planks bench
      this.setBlock(cx + bx + 1, cy + 1, cz + bz, 15, true); // Flower bush
    });
  }

  private buildNursery(cx: number, cy: number, cz: number) {
    // Walls & Floor (Oak Planks & Pink Wool)
    for (let x = -7; x <= 7; x++) {
      for (let z = -6; z <= 6; z++) {
        this.setBlock(cx + x, cy, cz + z, 5, true); // Floor
        if (Math.abs(x) === 7 || Math.abs(z) === 6) {
          for (let y = 1; y <= 4; y++) {
            if (z === 6 && Math.abs(x) <= 1 && y <= 3) continue; // Entrance doorway
            const isWindow = y === 2 && Math.abs(x) % 2 === 0;
            this.setBlock(cx + x, cy + y, cz + z, isWindow ? 7 : 11, true);
          }
        }
      }
    }

    // Modular Roof (in roof group so it hides when player enters!)
    for (let x = -7; x <= 7; x++) {
      for (let z = -6; z <= 6; z++) {
        this.addRoofVoxel('nursery', cx + x, cy + 5, cz + z, 12); // Cyan Roof Blocks
        if (Math.abs(x) <= 4 && Math.abs(z) <= 3) {
          this.addRoofVoxel('nursery', cx + x, cy + 6, cz + z, 16); // Center White Cupola
        }
      }
    }

    // Neon Billboard over Nursery Door
    const nurserySign = createNeonBillboard('PET NURSERY', 'Adoption Center & Eggs', '🍼', '#f472b6', '#06b6d4', 7.5, 2.5);
    nurserySign.position.set(cx, cy + 5.8, cz + 6.2);
    this.scene.add(nurserySign);

    // Glowing Neon Arch at Entrance
    const neonArchMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const archMesh = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.12, 8, 24, Math.PI), neonArchMat);
    archMesh.position.set(cx, cy + 3.2, cz + 6.1);
    this.scene.add(archMesh);

    // --- INTERIOR RICH FURNITURE ---
    // 4 Incubator Pods with floating glowing eggs!
    const podCoords = [
      { x: -3.5, z: -2, color: 0xfacc15, eggName: 'Golden Egg' },
      { x: 3.5, z: -2, color: 0x38bdf8, eggName: 'Diamond Egg' },
      { x: -3.5, z: 2, color: 0xf472b6, eggName: 'Royal Egg' },
      { x: 3.5, z: 2, color: 0xa855f7, eggName: 'Mythic Egg' },
    ];

    podCoords.forEach((pod) => {
      // Golden Pedestal
      this.setBlock(cx + Math.round(pod.x), cy + 1, cz + Math.round(pod.z), 8, true);
      
      // Floating Rotating Holographic Egg
      const eggGeo = new THREE.SphereGeometry(0.35, 12, 12);
      eggGeo.scale(0.8, 1.15, 0.8);
      const eggMat = new THREE.MeshStandardMaterial({
        color: pod.color,
        emissive: new THREE.Color(pod.color),
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const eggMesh = new THREE.Mesh(eggGeo, eggMat);
      eggMesh.position.set(cx + pod.x, cy + 2.3, cz + pod.z);
      this.scene.add(eggMesh);
      this.animatedDecorations.push({ mesh: eggMesh, type: 'spin_y', speed: 2 });
      this.animatedDecorations.push({ mesh: eggMesh, type: 'bob_y', speed: 3, initialY: cy + 2.3 });
    });

    // Nursery Reception Desk & Plushies
    this.setBlock(cx - 1, cy + 1, cz - 4, 16, true);
    this.setBlock(cx, cy + 1, cz - 4, 16, true);
    this.setBlock(cx + 1, cy + 1, cz - 4, 16, true);
    this.setBlock(cx, cy + 2, cz - 4, 13, true); // Glowing register lamp

    // Baby Cribs with pink and blue cushions
    this.setBlock(cx - 5, cy + 1, cz - 4, 11, true);
    this.setBlock(cx - 5, cy + 1, cz + 4, 12, true);
    this.setBlock(cx + 5, cy + 1, cz - 4, 11, true);
    this.setBlock(cx + 5, cy + 1, cz + 4, 12, true);
  }

  private buildNeonCave(cx: number, cy: number, cz: number) {
    // Obsidian Cavern
    for (let x = -6; x <= 6; x++) {
      for (let z = -6; z <= 6; z++) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist <= 5.5) {
          this.setBlock(cx + x, cy, cz + z, 10, true); // Obsidian Floor
          if (dist >= 4.5) {
            for (let y = 1; y <= 4; y++) {
              if (x > 3 && Math.abs(z) <= 1 && y <= 3) continue; // Cave mouth entrance
              this.setBlock(cx + x, cy + y, cz + z, 10, true);
            }
          }
        }
      }
    }

    // Modular Roof for Neon Cave (vanishes inside so player can see pet fusion ceremony)
    for (let x = -6; x <= 6; x++) {
      for (let z = -6; z <= 6; z++) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist <= 5.5) {
          this.addRoofVoxel('neon_cave', cx + x, cy + 5, cz + z, 10);
        }
      }
    }

    // Giant Glowing Neon Cave Billboard
    const neonCaveSign = createNeonBillboard('NEON CAVE', 'Altar of Evolution & Fusion', '🔮', '#ec4899', '#8b5cf6', 7.5, 2.5);
    neonCaveSign.position.set(cx + 5.8, cy + 5.2, cz);
    neonCaveSign.rotation.y = Math.PI / 2;
    this.scene.add(neonCaveSign);

    // --- INTERIOR NEON FORGE ---
    // 4 Elemental Fusion Pillars with colorful light crystals
    const pillars = [
      { x: -2.5, z: -2.5, color: 0x06b6d4, block: 12 }, // Cyan
      { x: 2.5, z: -2.5, color: 0xf43f5e, block: 11 },  // Pink
      { x: -2.5, z: 2.5, color: 0xfacc15, block: 8 },   // Gold
      { x: 2.5, z: 2.5, color: 0x10b981, block: 9 },   // Emerald
    ];

    pillars.forEach((p) => {
      this.setBlock(cx + Math.round(p.x), cy + 1, cz + Math.round(p.z), p.block, true);
      
      // Floating glowing crystal octahedron
      const crystalGeo = new THREE.OctahedronGeometry(0.4, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: p.color,
        emissive: new THREE.Color(p.color),
        emissiveIntensity: 0.9,
        roughness: 0.1,
      });
      const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
      crystalMesh.position.set(cx + p.x, cy + 2.2, cz + p.z);
      this.scene.add(crystalMesh);
      this.animatedDecorations.push({ mesh: crystalMesh, type: 'spin_y', speed: 2.5 });
      this.animatedDecorations.push({ mesh: crystalMesh, type: 'bob_y', speed: 3.5, initialY: cy + 2.2 });

      const pLight = new THREE.PointLight(new THREE.Color(p.color), 1.5, 8);
      pLight.position.set(cx + p.x, cy + 2.5, cz + p.z);
      this.scene.add(pLight);
    });

    // Central Mystic Glowing Altar with rotating runic ring
    this.setBlock(cx, cy + 1, cz, 13, true); // Glowstone core
    
    const runeRingGeo = new THREE.TorusGeometry(1.6, 0.08, 6, 24);
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true });
    const runeMesh = new THREE.Mesh(runeRingGeo, runeMat);
    runeMesh.rotation.x = Math.PI / 2;
    runeMesh.position.set(cx, cy + 1.2, cz);
    this.scene.add(runeMesh);
    this.animatedDecorations.push({ mesh: runeMesh, type: 'spin_y', speed: 1 });
  }

  private buildSchool(cx: number, cy: number, cz: number) {
    // School Walls & Wood Floor
    for (let x = -6; x <= 6; x++) {
      for (let z = -5; z <= 5; z++) {
        this.setBlock(cx + x, cy, cz + z, 5, true); // Floor
        if (Math.abs(x) === 6 || Math.abs(z) === 5) {
          for (let y = 1; y <= 4; y++) {
            if (z === 5 && Math.abs(x) <= 1 && y <= 3) continue; // Doorway
            const isWindow = y === 2 && Math.abs(x) === 3;
            this.setBlock(cx + x, cy + y, cz + z, isWindow ? 7 : 6, true);
          }
        }
      }
    }

    // Modular Roof
    for (let x = -6; x <= 6; x++) {
      for (let z = -5; z <= 5; z++) {
        this.addRoofVoxel('school', cx + x, cy + 5, cz + z, 3); // Stone/slate roof
      }
    }

    // School Neon Billboard
    const schoolSign = createNeonBillboard('PET ACADEMY', 'School & Training Grounds', '🎓', '#fbbf24', '#38bdf8', 7.5, 2.5);
    schoolSign.position.set(cx, cy + 5.8, cz + 5.2);
    this.scene.add(schoolSign);

    // --- INTERIOR CLASSROOM FURNITURE ---
    // Blackboard on back wall
    for (let bx = -3; bx <= 3; bx++) {
      this.setBlock(cx + bx, cy + 2, cz - 4, 10, true); // Obsidian blackboard
    }

    // Teacher Desk with Apple & Bell
    this.setBlock(cx, cy + 1, cz - 2, 5, true);
    this.setBlock(cx, cy + 2, cz - 2, 13, true); // Glowstone desk lamp

    // Student Desks & Chairs
    [[-3, 0], [3, 0], [-3, 2], [3, 2]].forEach(([sx, sz]) => {
      this.setBlock(cx + sx, cy + 1, cz + sz, 5, true); // Desk
      this.setBlock(cx + sx, cy + 1, cz + sz + 1, 14, true); // Bookshelf chair
    });

    // Bookshelf Wall
    this.setBlock(cx - 5, cy + 1, cz - 2, 14, true);
    this.setBlock(cx - 5, cy + 2, cz - 2, 14, true);
    this.setBlock(cx + 5, cy + 1, cz - 2, 14, true);
    this.setBlock(cx + 5, cy + 2, cz - 2, 14, true);
  }

  private buildHospital(cx: number, cy: number, cz: number) {
    // Hospital Quartz Walls
    for (let x = -5; x <= 5; x++) {
      for (let z = -5; z <= 5; z++) {
        this.setBlock(cx + x, cy, cz + z, 16, true);
        if (Math.abs(x) === 5 || Math.abs(z) === 5) {
          for (let y = 1; y <= 4; y++) {
            if (z === 5 && Math.abs(x) <= 1 && y <= 3) continue; // Entrance
            const isWindow = y === 2 && Math.abs(x) === 2;
            this.setBlock(cx + x, cy + y, cz + z, isWindow ? 7 : 16, true);
          }
        }
      }
    }

    // Modular Roof
    for (let x = -5; x <= 5; x++) {
      for (let z = -5; z <= 5; z++) {
        this.addRoofVoxel('hospital', cx + x, cy + 5, cz + z, 16);
      }
    }

    // Hospital Neon Billboard with pulsating Red Cross
    const hospitalSign = createNeonBillboard('PET HOSPITAL', 'Recovery Clinic & Wellness', '🏥', '#10b981', '#ef4444', 7.5, 2.5);
    hospitalSign.position.set(cx, cy + 5.8, cz + 5.2);
    this.scene.add(hospitalSign);

    // Glowing Red Cross on facade
    this.setBlock(cx, cy + 6, cz + 5, 6, true);
    this.setBlock(cx - 1, cy + 6, cz + 5, 6, true);
    this.setBlock(cx + 1, cy + 6, cz + 5, 6, true);
    this.setBlock(cx, cy + 7, cz + 5, 6, true);
    this.setBlock(cx, cy + 5, cz + 5, 6, true);

    // --- INTERIOR HOSPITAL CLINIC ---
    // 3 Patient Examination Beds
    [-3, 0, 3].forEach((bx) => {
      this.setBlock(cx + bx, cy + 1, cz - 3, 12, true); // Cyan sterile bed
      this.setBlock(cx + bx, cy + 2, cz - 4, 13, true); // Vital monitor lamp
    });

    // Medicine Dispensary Counter & Potion Bottles
    this.setBlock(cx - 3, cy + 1, cz + 2, 16, true);
    this.setBlock(cx - 2, cy + 1, cz + 2, 16, true);
    this.setBlock(cx + 3, cy + 1, cz + 2, 16, true);
  }

  private buildPizzaPlace(cx: number, cy: number, cz: number) {
    // Checkered Floor & Brick Walls
    for (let x = -6; x <= 6; x++) {
      for (let z = -5; z <= 5; z++) {
        const isCheck = (x + z) % 2 === 0;
        this.setBlock(cx + x, cy, cz + z, isCheck ? 16 : 10, true); // Checkered floor
        if (Math.abs(x) === 6 || Math.abs(z) === 5) {
          for (let y = 1; y <= 4; y++) {
            if (z === -5 && Math.abs(x) <= 1 && y <= 3) continue; // Entrance
            const isWindow = y === 2 && Math.abs(x) === 3;
            this.setBlock(cx + x, cy + y, cz + z, isWindow ? 7 : 6, true);
          }
        }
      }
    }

    // Modular Roof (vanishes cleanly when player enters to enjoy pizza with pet!)
    for (let x = -6; x <= 6; x++) {
      for (let z = -5; z <= 5; z++) {
        this.addRoofVoxel('pizza', cx + x, cy + 5, cz + z, 5);
      }
    }

    // Giant Glowing Retro Pizza Billboard
    const pizzaSign = createNeonBillboard("LUIGI'S PIZZA", 'Hot Slices & Retro Diner', '🍕', '#f97316', '#22c55e', 7.5, 2.5);
    pizzaSign.position.set(cx, cy + 5.8, cz - 5.2);
    this.scene.add(pizzaSign);

    // --- INTERIOR PIZZA PARLOR ---
    // Brick Pizza Oven with Flickering Ember Fire!
    this.setBlock(cx, cy + 1, cz + 4, 6, true);
    this.setBlock(cx - 1, cy + 1, cz + 4, 6, true);
    this.setBlock(cx + 1, cy + 1, cz + 4, 6, true);
    this.setBlock(cx, cy + 2, cz + 4, 13, true); // Glowing fire opening

    const ovenLight = new THREE.PointLight(0xff6b00, 2.0, 8);
    ovenLight.position.set(cx, cy + 2.5, cz + 3.5);
    this.scene.add(ovenLight);
    this.animatedDecorations.push({ mesh: ovenLight, type: 'flicker_light', speed: 10 });

    // Diner Dining Booths
    [[-3, -1], [3, -1], [-3, 2], [3, 2]].forEach(([tx, tz]) => {
      this.setBlock(cx + tx, cy + 1, cz + tz, 16, true); // Table
      this.setBlock(cx + tx, cy + 1, cz + tz - 1, 6, true); // Red Bench
      this.setBlock(cx + tx, cy + 1, cz + tz + 1, 6, true); // Red Bench
    });

    // Retro Jukebox
    this.setBlock(cx - 5, cy + 1, cz + 3, 12, true);
    this.setBlock(cx - 5, cy + 2, cz + 3, 8, true);
  }

  private buildPlayground(cx: number, cy: number, cz: number) {
    // Playground Floor & Neon Billboard
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        this.setBlock(cx + x, cy + 1, cz + z, 17, true); // Sandpit
      }
    }

    const parkSign = createNeonBillboard('FUN PARK', 'Playground & Attractions', '🎡', '#a855f7', '#ec4899', 6.5, 2.2);
    parkSign.position.set(cx, cy + 6.2, cz);
    this.scene.add(parkSign);

    // Swings / Slide
    for (let y = 1; y <= 5; y++) {
      this.setBlock(cx + 4, cy + y, cz + 3, 4, true);
      this.setBlock(cx + 4, cy + y, cz - 3, 4, true);
    }
    for (let z = -3; z <= 3; z++) {
      this.setBlock(cx + 4, cy + 5, cz + z, 5, true);
    }

    // Trampoline
    this.setBlock(cx - 3, cy + 1, cz - 2, 12, true);
    this.setBlock(cx - 2, cy + 1, cz - 2, 12, true);
  }

  private buildHotSprings(cx: number, cy: number, cz: number) {
    for (let x = -6; x <= 6; x++) {
      for (let z = -6; z <= 6; z++) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist <= 5) {
          this.setBlock(cx + x, cy, cz + z, 17, true);
          this.setBlock(cx + x, cy + 1, cz + z, 9, true); // Glowing steaming spring water
        } else if (dist <= 6) {
          this.setBlock(cx + x, cy + 1, cz + z, 3, true); // Stone rim
        }
      }
    }

    const hotSpringSign = createNeonBillboard('HOT SPRINGS', 'Zen Relax & Soak', '♨️', '#06b6d4', '#f43f5e', 6.5, 2.2);
    hotSpringSign.position.set(cx, cy + 5.5, cz - 6.5);
    this.scene.add(hotSpringSign);

    // Bamboo Torii Gate Lanterns
    this.setBlock(cx - 4, cy + 2, cz - 6, 13, true);
    this.setBlock(cx + 4, cy + 2, cz - 6, 13, true);
  }

  private buildCampsite(cx: number, cy: number, cz: number) {
    // Campfire in Center
    this.setBlock(cx, cy + 1, cz, 4, true);
    this.setBlock(cx, cy + 2, cz, 13, true);

    const campLight = new THREE.PointLight(0xff7700, 2.2, 10);
    campLight.position.set(cx, cy + 2.5, cz);
    this.scene.add(campLight);
    this.animatedDecorations.push({ mesh: campLight, type: 'flicker_light', speed: 8 });

    // Log Benches
    this.setBlock(cx - 2, cy + 1, cz, 4, true);
    this.setBlock(cx + 2, cy + 1, cz, 4, true);
    this.setBlock(cx, cy + 1, cz - 2, 4, true);
    this.setBlock(cx, cy + 1, cz + 2, 4, true);

    // 3 Tents (Pink, Cyan, Orange)
    for (let z = -2; z <= 2; z++) {
      this.setBlock(cx - 6, cy + 1, cz + z, 11, true);
      this.setBlock(cx - 5, cy + 2, cz + z, 11, true);
      this.setBlock(cx - 4, cy + 1, cz + z, 11, true);

      this.setBlock(cx + 4, cy + 1, cz + z, 12, true);
      this.setBlock(cx + 5, cy + 2, cz + z, 12, true);
      this.setBlock(cx + 6, cy + 1, cz + z, 12, true);
    }

    const campSign = createNeonBillboard('CAMPSITE', 'Starry Night Retreat', '🏕️', '#f59e0b', '#10b981', 6.5, 2.2);
    campSign.position.set(cx, cy + 5.2, cz + 5);
    this.scene.add(campSign);
  }

  private buildStreetDecor() {
    // Luminous Street Lamps with Glowing Lanterns
    const lampCoords = [
      [-15, 1, -15], [15, 1, -15], [-15, 1, 15], [15, 1, 15],
      [-30, 1, 0], [30, 1, 0], [0, 1, -20], [0, 1, 20],
      [-20, 1, -35], [20, 1, -35], [-20, 1, 35], [20, 1, 35]
    ];
    lampCoords.forEach(([x, y, z]) => {
      this.setBlock(x, y + 1, z, 3, true);
      this.setBlock(x, y + 2, z, 4, true);
      this.setBlock(x, y + 3, z, 4, true);
      this.setBlock(x, y + 4, z, 13, true); // Glowstone Lantern

      // Point Light for Street Illumination
      const lampLight = new THREE.PointLight(0xfef08a, 0.8, 8);
      lampLight.position.set(x, y + 4.5, z);
      this.scene.add(lampLight);
    });

    // Lush Trees with Leaf Canopies & Flower Beds
    const treeCoords = [
      [-20, 1, -30], [-10, 1, -48], [20, 1, -42], [25, 1, 10], [-25, 1, 35], [10, 1, 48],
      [-48, 1, 20], [48, 1, -10], [-35, 1, -50], [35, 1, 45]
    ];
    treeCoords.forEach(([tx, ty, tz]) => {
      for (let y = 1; y <= 4; y++) {
        this.setBlock(tx, ty + y, tz, 4, true);
      }
      for (let lx = -2; lx <= 2; lx++) {
        for (let lz = -2; lz <= 2; lz++) {
          for (let ly = 4; ly <= 6; ly++) {
            if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === 6) continue;
            if (lx !== 0 || lz !== 0 || ly > 4) {
              this.setBlock(tx + lx, ty + ly, tz + lz, 15, true);
            }
          }
        }
      }
      // Colorful flowers around base
      this.setBlock(tx + 1, ty + 1, tz, 11, true); // Pink flower
      this.setBlock(tx - 1, ty + 1, tz, 8, true);  // Gold flower
    });
  }
}

