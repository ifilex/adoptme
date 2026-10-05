import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VoxelWorld } from '../engine/VoxelWorld';
import { PlayerController } from '../engine/PlayerController';
import { PetRenderer } from '../engine/PetRenderer';
import { PlayerData, PetInstance, EggInstance, NetworkPlayer } from '../types/game';
import { MAP_LANDMARKS } from '../data/gameData';
import { soundFx } from '../services/audioService';

export type GraphicsQuality = 'performance' | 'balanced' | 'ultra';

interface GameCanvasProps {
  playerData: PlayerData;
  activePet: PetInstance | null;
  activeEgg: EggInstance | null;
  selectedBlockId: number;
  selectedSlot: number;
  isRiding: boolean;
  isFlying: boolean;
  networkPlayers: NetworkPlayer[];
  graphicsQuality?: GraphicsQuality;
  retroFilterActive?: boolean;
  onBlockPlaced: (x: number, y: number, z: number, blockId: number) => void;
  onBlockBroken: (x: number, y: number, z: number) => void;
  onLocationChanged: (locationName: string, locationId: string) => void;
  onOpenTradeWithBot: (bot: NetworkPlayer) => void;
  onPetLove: () => void;
  teleportTarget: [number, number, number] | null;
  onTeleportComplete: () => void;
  joystickInput: { x: number; y: number };
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  playerData,
  activePet,
  activeEgg,
  selectedBlockId,
  selectedSlot,
  isRiding,
  isFlying,
  networkPlayers,
  graphicsQuality = 'performance',
  retroFilterActive = true,
  onBlockPlaced,
  onBlockBroken,
  onLocationChanged,
  onTeleportComplete,
  teleportTarget,
  joystickInput,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    dirLight: THREE.DirectionalLight;
    voxelWorld: VoxelWorld;
    playerController: PlayerController;
    petRenderer: PetRenderer;
    botMeshMap: Map<string, THREE.Group>;
    cloudsGroup: THREE.Group;
    sparklesMesh: THREE.Points | null;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    isMouseDown: boolean;
    lastMouseX: number;
    lastMouseY: number;
    keys: { [key: string]: boolean };
  } | null>(null);

  // Initialize 3D Engine with GPU Hardware Acceleration & Aesthetics
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene & Warm Atmospheric Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x60a5fa); // Crisp Sky Blue
    scene.fog = new THREE.FogExp2(0x93c5fd, 0.009);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 180);
    
    // Hardware accelerated WebGLRenderer configuration
    const renderer = new THREE.WebGLRenderer({
      antialias: graphicsQuality !== 'performance',
      powerPreference: 'high-performance',
      precision: graphicsQuality === 'performance' ? 'mediump' : 'highp',
      stencil: false,
      depth: true,
    });
    
    const dpr = graphicsQuality === 'performance' ? 1.0 : graphicsQuality === 'balanced' ? 1.25 : Math.min(window.devicePixelRatio, 2.0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(dpr);

    renderer.shadowMap.enabled = graphicsQuality !== 'performance';
    renderer.shadowMap.type = graphicsQuality === 'ultra' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 2. Rich Ambient & Directional Lighting
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x86efac, 0.85);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.05); // Warm golden sun
    dirLight.position.set(35, 55, 30);
    dirLight.castShadow = graphicsQuality !== 'performance';
    dirLight.shadow.mapSize.width = graphicsQuality === 'ultra' ? 1024 : 512;
    dirLight.shadow.mapSize.height = graphicsQuality === 'ultra' ? 1024 : 512;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 130;
    const d = 45;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // 3. Floating Procedural Voxel Clouds
    const cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
    });
    const cloudGeo = new THREE.BoxGeometry(4, 1.8, 3.5);

    // Generate 7 soft voxel cloud clusters
    const cloudData: { x: number; y: number; z: number; speed: number }[] = [];
    for (let c = 0; c < 7; c++) {
      const cluster = new THREE.Group();
      const cx = (Math.random() - 0.5) * 120;
      const cy = 30 + Math.random() * 8;
      const cz = (Math.random() - 0.5) * 120;
      
      const numBlocks = 3 + Math.floor(Math.random() * 4);
      for (let b = 0; b < numBlocks; b++) {
        const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        cloudMesh.position.set((b - numBlocks / 2) * 3.2, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 2.5);
        cluster.add(cloudMesh);
      }
      cluster.position.set(cx, cy, cz);
      cloudsGroup.add(cluster);
      cloudData.push({ x: cx, y: cy, z: cz, speed: 0.8 + Math.random() * 0.8 });
    }
    scene.add(cloudsGroup);

    // 4. Golden Ambient Sparkle Particles (8-Bit Magic Atmosphere)
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 80;
      particlePositions[i + 1] = 1 + Math.random() * 12;
      particlePositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.28,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const sparklesMesh = new THREE.Points(particleGeo, particleMat);
    scene.add(sparklesMesh);

    // 5. Engine Systems (GPU Instanced Voxel World)
    const voxelWorld = new VoxelWorld(scene);
    const playerController = new PlayerController(camera);
    scene.add(playerController.avatarGroup);

    const petRenderer = new PetRenderer();
    scene.add(petRenderer.group);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const botMeshMap = new Map<string, THREE.Group>();
    const keys: { [key: string]: boolean } = {};

    engineRef.current = {
      renderer,
      scene,
      camera,
      dirLight,
      voxelWorld,
      playerController,
      petRenderer,
      botMeshMap,
      cloudsGroup,
      sparklesMesh,
      raycaster,
      mouse,
      isMouseDown: false,
      lastMouseX: 0,
      lastMouseY: 0,
      keys,
    };

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    // Mouse handlers for Camera Orbit & Raycast
    const handleMouseDown = (e: MouseEvent) => {
      if (!engineRef.current) return;
      engineRef.current.isMouseDown = true;
      engineRef.current.lastMouseX = e.clientX;
      engineRef.current.lastMouseY = e.clientY;

      // Check Click for Place / Break
      if (e.button === 0) {
        // Left click: Place block if Slot 2 selected, or Break
        const hit = voxelWorld.raycastTarget(raycaster);
        if (hit) {
          if (selectedSlot === 2) {
            // Place block
            const nx = hit.blockCoord[0] + Math.round(hit.normal.x);
            const ny = hit.blockCoord[1] + Math.round(hit.normal.y);
            const nz = hit.blockCoord[2] + Math.round(hit.normal.z);
            voxelWorld.setBlock(nx, ny, nz, selectedBlockId);
            playerController.triggerToolSwing();
            soundFx.playBlockPlace();
            onBlockPlaced(nx, ny, nz, selectedBlockId);
          } else {
            // Break block
            voxelWorld.setBlock(hit.blockCoord[0], hit.blockCoord[1], hit.blockCoord[2], 0);
            playerController.triggerToolSwing();
            soundFx.playBlockBreak();
            onBlockBroken(hit.blockCoord[0], hit.blockCoord[1], hit.blockCoord[2]);
          }
        }
      } else if (e.button === 2) {
        // Right click: Fast Break block
        const hit = voxelWorld.raycastTarget(raycaster);
        if (hit) {
          voxelWorld.setBlock(hit.blockCoord[0], hit.blockCoord[1], hit.blockCoord[2], 0);
          playerController.triggerToolSwing();
          soundFx.playBlockBreak();
          onBlockBroken(hit.blockCoord[0], hit.blockCoord[1], hit.blockCoord[2]);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!engineRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (engineRef.current.isMouseDown) {
        const dx = e.clientX - engineRef.current.lastMouseX;
        const dy = e.clientY - engineRef.current.lastMouseY;
        playerController.cameraYaw -= dx * 0.005;
        playerController.cameraPitch = Math.max(0.05, Math.min(1.2, playerController.cameraPitch + dy * 0.005));
        engineRef.current.lastMouseX = e.clientX;
        engineRef.current.lastMouseY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      if (engineRef.current) engineRef.current.isMouseDown = false;
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    containerRef.current.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    containerRef.current.addEventListener('contextmenu', handleContextMenu);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    // Animation Loop
    let lastTime = performance.now();
    let animId: number;
    let frameCount = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min(0.06, (now - lastTime) / 1000);
      lastTime = now;
      frameCount++;

      // Gather input
      let moveX = 0;
      let moveZ = 0;
      if (keys['KeyW'] || keys['ArrowUp']) moveZ += 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveZ -= 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

      // Merge joystick
      if (joystickInput.x !== 0 || joystickInput.y !== 0) {
        moveX = joystickInput.x;
        moveZ = joystickInput.y;
      }

      playerController.isRiding = isRiding;
      playerController.isFlying = isFlying;

      // Dynamic Roof Cutaway for indoor spaces + Animated Decors
      voxelWorld.updateRoofCutaway(playerController.position);
      voxelWorld.updateDecorAnimations(delta);
      playerController.isIndoor = !!voxelWorld.activeIndoorBuildingId;

      playerController.update(
        delta,
        {
          moveX,
          moveZ,
          jump: !!keys['Space'],
          flyUp: !!keys['KeyE'] || !!keys['Space'],
          flyDown: !!keys['KeyQ'] || !!keys['ShiftLeft'],
        },
        voxelWorld
      );

      // Update Pet
      petRenderer.isMounted = isRiding;
      petRenderer.isFlying = isFlying;
      petRenderer.updateAnimation(
        delta,
        playerController.isWalking,
        playerController.position,
        playerController.rotation
      );

      // Animate Clouds Drifting
      if (cloudsGroup) {
        cloudsGroup.children.forEach((cloud) => {
          cloud.position.x += delta * 1.2;
          if (cloud.position.x > 65) cloud.position.x = -65;
        });
      }

      // Animate Sparkles (Gentle Bobbing)
      if (sparklesMesh) {
        sparklesMesh.rotation.y += delta * 0.08;
      }

      // Optimized Raycasting: DDA Raymarch (every frame or throttled)
      raycaster.setFromCamera(mouse, camera);
      const hit = voxelWorld.raycastTarget(raycaster);
      voxelWorld.updateHighlight(hit, selectedSlot === 2);

      // Location Check throttled to once every 10 frames
      if (frameCount % 10 === 0) {
        let closestLandmark = 'Town Plaza';
        let closestId = 'spawn';
        let minDistance = Infinity;

        MAP_LANDMARKS.forEach((l) => {
          const dist = Math.hypot(playerController.position.x - l.x, playerController.position.z - l.z);
          if (dist < minDistance && dist < 14) {
            minDistance = dist;
            closestLandmark = `${l.icon} ${l.name}`;
            closestId = l.id;
          }
        });

        onLocationChanged(closestLandmark, closestId);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
    };
  }, [graphicsQuality]);

  // Update Avatar Styling
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.playerController.updateAvatarStyle(playerData.avatar);
    }
  }, [playerData.avatar]);

  // Update Equipped Pet / Egg Model
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.petRenderer.setPet(activePet);
      if (activeEgg) engineRef.current.petRenderer.setEgg(activeEgg);
    }
  }, [activePet, activeEgg]);

  // Teleport Handler
  useEffect(() => {
    if (teleportTarget && engineRef.current) {
      engineRef.current.playerController.position.set(teleportTarget[0], teleportTarget[1], teleportTarget[2]);
      onTeleportComplete();
    }
  }, [teleportTarget]);

  // Sync Simulated Network Players
  useEffect(() => {
    if (!engineRef.current) return;
    const { scene, botMeshMap } = engineRef.current;

    networkPlayers.forEach((player) => {
      let botGroup = botMeshMap.get(player.id);
      if (!botGroup) {
        botGroup = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: player.avatar.shirtColor });
        const skinMat = new THREE.MeshStandardMaterial({ color: player.avatar.skinColor });
        
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), mat);
        body.position.y = 1.4;
        botGroup.add(body);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), skinMat);
        head.position.y = 0.95;
        body.add(head);

        const nameCanvas = document.createElement('canvas');
        nameCanvas.width = 256;
        nameCanvas.height = 64;
        const ctx = nameCanvas.getContext('2d')!;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.roundRect(0, 0, 256, 64, 16);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player.username, 128, 40);

        const nameTex = new THREE.CanvasTexture(nameCanvas);
        const nameMat = new THREE.SpriteMaterial({ map: nameTex });
        const sprite = new THREE.Sprite(nameMat);
        sprite.position.y = 2.8;
        sprite.scale.set(3, 0.75, 1);
        botGroup.add(sprite);

        scene.add(botGroup);
        botMeshMap.set(player.id, botGroup);
      }

      botGroup.position.set(player.position[0], player.position[1], player.position[2]);
      botGroup.rotation.y = player.rotation;
    });
  }, [networkPlayers]);

  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <div
        ref={containerRef}
        className={`w-full h-full cursor-crosshair relative touch-none ${
          retroFilterActive ? 'contrast-[1.06] saturate-[1.12]' : ''
        }`}
      />
      {retroFilterActive && (
        <div className="retro-8bit-layer retro-scanline-active pointer-events-none" />
      )}
    </div>
  );
};
