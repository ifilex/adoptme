import * as THREE from 'three';
import { AvatarCustomization } from '../types/game';

export class PlayerController {
  public avatarGroup: THREE.Group = new THREE.Group();
  public camera: THREE.PerspectiveCamera;
  
  public position: THREE.Vector3 = new THREE.Vector3(0, 2, 5);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotation: number = 0;
  
  public isGrounded: boolean = true;
  public isRiding: boolean = false;
  public isFlying: boolean = false;
  public isWalking: boolean = false;

  // Body Parts
  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private hatMesh: THREE.Mesh | null = null;
  private wingsMesh: THREE.Mesh | null = null;
  private hairMesh: THREE.Mesh | null = null;

  // Animation
  private animTime: number = 0;
  public toolSwingTimer: number = 0;

  // Camera Orbit Settings
  public cameraDistance: number = 6.5;
  public cameraPitch: number = 0.35; // radians up/down
  public cameraYaw: number = 0; // radians left/right
  public isIndoor: boolean = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

    // 1. Torso
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), shirtMat);
    this.torso.position.y = 1.4;
    this.torso.castShadow = true;
    this.avatarGroup.add(this.torso);

    // 2. Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), skinMat);
    this.head.position.y = 0.95;
    this.head.castShadow = true;
    this.torso.add(this.head);

    // Face eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-0.18, 0.18].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.02), eyeMat);
      eye.position.set(ex, 0.05, 0.36);
      this.head.add(eye);

      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), pupilMat);
      pupil.position.set(ex > 0 ? 0.02 : -0.02, 0.02, 0.01);
      eye.add(pupil);
    });

    // Mouth
    const smileMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.02), smileMat);
    mouth.position.set(0, -0.15, 0.36);
    this.head.add(mouth);

    // 3. Arms
    const armGeo = new THREE.BoxGeometry(0.35, 1.1, 0.35);
    this.leftArm = new THREE.Mesh(armGeo, shirtMat);
    this.leftArm.position.set(-0.6, 0.0, 0);
    this.leftArm.castShadow = true;
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, shirtMat);
    this.rightArm.position.set(0.6, 0.0, 0);
    this.rightArm.castShadow = true;
    this.torso.add(this.rightArm);

    // 4. Legs
    const legGeo = new THREE.BoxGeometry(0.38, 1.1, 0.38);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.22, 0.55, 0);
    this.leftLeg.castShadow = true;
    this.avatarGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.22, 0.55, 0);
    this.rightLeg.castShadow = true;
    this.avatarGroup.add(this.rightLeg);
  }

  public updateAvatarStyle(avatar: AvatarCustomization) {
    // Colors
    (this.head.material as THREE.MeshStandardMaterial).color.set(avatar.skinColor);
    (this.torso.material as THREE.MeshStandardMaterial).color.set(avatar.shirtColor);
    (this.leftArm.material as THREE.MeshStandardMaterial).color.set(avatar.shirtColor);
    (this.rightArm.material as THREE.MeshStandardMaterial).color.set(avatar.shirtColor);
    (this.leftLeg.material as THREE.MeshStandardMaterial).color.set(avatar.pantsColor);
    (this.rightLeg.material as THREE.MeshStandardMaterial).color.set(avatar.pantsColor);

    // Hair
    if (this.hairMesh) this.head.remove(this.hairMesh);
    if (avatar.hairStyle !== 'none') {
      const hairMat = new THREE.MeshStandardMaterial({ color: avatar.hairColor, roughness: 0.5 });
      this.hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.3, 0.76), hairMat);
      this.hairMesh.position.y = 0.28;
      this.head.add(this.hairMesh);
    }

    // Hat
    if (this.hatMesh) this.head.remove(this.hatMesh);
    if (avatar.hat === 'top_hat') {
      const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      this.hatMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12), hatMat);
      this.hatMesh.position.y = 0.6;
      this.head.add(this.hatMesh);
    } else if (avatar.hat === 'crown') {
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 });
      this.hatMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.35, 0.25, 8), crownMat);
      this.hatMesh.position.y = 0.5;
      this.head.add(this.hatMesh);
    }

    // Wings
    if (this.wingsMesh) this.torso.remove(this.wingsMesh);
    if (avatar.wings === 'angel' || avatar.wings === 'dragon' || avatar.wings === 'fairy') {
      const wingMat = new THREE.MeshStandardMaterial({
        color: avatar.wings === 'dragon' ? 0xea580c : avatar.wings === 'fairy' ? 0xec4899 : 0xffffff,
        roughness: 0.3,
        emissive: new THREE.Color(0x333333),
      });
      const wingGroup = new THREE.Group();
      const lWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.05), wingMat);
      lWing.position.set(-0.5, 0.2, -0.25);
      lWing.rotation.y = 0.4;
      const rWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.05), wingMat);
      rWing.position.set(0.5, 0.2, -0.25);
      rWing.rotation.y = -0.4;
      wingGroup.add(lWing, rWing);
      this.wingsMesh = wingGroup as unknown as THREE.Mesh;
      this.torso.add(this.wingsMesh);
    }
  }

  private isAABBColliding(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
    voxelWorld: { getBlock: (x: number, y: number, z: number) => number; isSolid?: (x: number, y: number, z: number) => boolean }
  ): boolean {
    const startX = Math.floor(minX);
    const endX = Math.floor(maxX - 0.0001);
    const startY = Math.floor(minY + 0.0001);
    const endY = Math.floor(maxY - 0.0001);
    const startZ = Math.floor(minZ);
    const endZ = Math.floor(maxZ - 0.0001);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        for (let z = startZ; z <= endZ; z++) {
          const solid = voxelWorld.isSolid ? voxelWorld.isSolid(x, y, z) : voxelWorld.getBlock(x, y, z) > 0;
          if (solid) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public update(
    delta: number,
    input: { moveX: number; moveZ: number; jump: boolean; flyUp: boolean; flyDown: boolean },
    voxelWorld: { getBlock: (x: number, y: number, z: number) => number; isSolid?: (x: number, y: number, z: number) => boolean }
  ) {
    this.animTime += delta;
    if (this.toolSwingTimer > 0) this.toolSwingTimer -= delta;

    const baseSpeed = this.isFlying ? 12 : this.isRiding ? 9.5 : 6.2;
    const radius = 0.28; // Player half-width
    const height = 1.75; // Player height
    const maxStep = 1.05; // Maximum step-up height (e.g. 1-block steps/stairs)

    let moveDeltaX = 0;
    let moveDeltaZ = 0;

    // Movement relative to camera yaw
    if (Math.abs(input.moveX) > 0.05 || Math.abs(input.moveZ) > 0.05) {
      this.isWalking = true;

      // Camera forward and screen-right vectors in 3D world space
      const forwardX = Math.sin(this.cameraYaw);
      const forwardZ = Math.cos(this.cameraYaw);
      const rightX = -Math.cos(this.cameraYaw);
      const rightZ = Math.sin(this.cameraYaw);

      const dirX = forwardX * input.moveZ + rightX * input.moveX;
      const dirZ = forwardZ * input.moveZ + rightZ * input.moveX;
      const len = Math.hypot(dirX, dirZ);

      if (len > 0.001) {
        const normDirX = dirX / len;
        const normDirZ = dirZ / len;
        const targetRotation = Math.atan2(normDirX, normDirZ);

        // Rotate avatar smoothly towards movement direction
        let diff = targetRotation - this.rotation;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.rotation += diff * Math.min(1.0, delta * 14);

        moveDeltaX = normDirX * baseSpeed * delta;
        moveDeltaZ = normDirZ * baseSpeed * delta;
      }
    } else {
      this.isWalking = false;
    }

    // --- 1. HORIZONTAL COLLISION RESOLUTION (X AXIS) ---
    if (Math.abs(moveDeltaX) > 0.0001) {
      const targetX = this.position.x + moveDeltaX;
      const collidingX = this.isAABBColliding(
        targetX - radius, this.position.y + 0.08, this.position.z - radius,
        targetX + radius, this.position.y + height, this.position.z + radius,
        voxelWorld
      );

      if (!collidingX) {
        this.position.x = targetX;
      } else {
        // Attempt Auto Step-Up (for 1-block steps, curbs, stairs)
        let stepped = false;
        if (this.isGrounded && !this.isFlying) {
          for (let step = 0.2; step <= maxStep; step += 0.2) {
            const testY = this.position.y + step;
            const canStep = !this.isAABBColliding(
              targetX - radius, testY + 0.05, this.position.z - radius,
              targetX + radius, testY + height, this.position.z + radius,
              voxelWorld
            );
            if (canStep) {
              // Confirm solid ground under new step position
              const hasGround = this.isAABBColliding(
                targetX - radius, testY - 0.1, this.position.z - radius,
                targetX + radius, testY + 0.05, this.position.z + radius,
                voxelWorld
              );
              if (hasGround) {
                this.position.x = targetX;
                this.position.y = testY;
                stepped = true;
                break;
              }
            }
          }
        }

        if (!stepped) {
          // Snap against solid block boundary to allow smooth sliding
          if (moveDeltaX > 0) {
            const blockX = Math.floor(targetX + radius);
            const snappedX = blockX - radius - 0.001;
            if (snappedX > this.position.x) this.position.x = snappedX;
          } else {
            const blockX = Math.floor(targetX - radius);
            const snappedX = blockX + 1.0 + radius + 0.001;
            if (snappedX < this.position.x) this.position.x = snappedX;
          }
        }
      }
    }

    // --- 2. HORIZONTAL COLLISION RESOLUTION (Z AXIS) ---
    if (Math.abs(moveDeltaZ) > 0.0001) {
      const targetZ = this.position.z + moveDeltaZ;
      const collidingZ = this.isAABBColliding(
        this.position.x - radius, this.position.y + 0.08, targetZ - radius,
        this.position.x + radius, this.position.y + height, targetZ + radius,
        voxelWorld
      );

      if (!collidingZ) {
        this.position.z = targetZ;
      } else {
        // Attempt Auto Step-Up
        let stepped = false;
        if (this.isGrounded && !this.isFlying) {
          for (let step = 0.2; step <= maxStep; step += 0.2) {
            const testY = this.position.y + step;
            const canStep = !this.isAABBColliding(
              this.position.x - radius, testY + 0.05, targetZ - radius,
              this.position.x + radius, testY + height, targetZ + radius,
              voxelWorld
            );
            if (canStep) {
              const hasGround = this.isAABBColliding(
                this.position.x - radius, testY - 0.1, targetZ - radius,
                this.position.x + radius, testY + 0.05, targetZ + radius,
                voxelWorld
              );
              if (hasGround) {
                this.position.z = targetZ;
                this.position.y = testY;
                stepped = true;
                break;
              }
            }
          }
        }

        if (!stepped) {
          if (moveDeltaZ > 0) {
            const blockZ = Math.floor(targetZ + radius);
            const snappedZ = blockZ - radius - 0.001;
            if (snappedZ > this.position.z) this.position.z = snappedZ;
          } else {
            const blockZ = Math.floor(targetZ - radius);
            const snappedZ = blockZ + 1.0 + radius + 0.001;
            if (snappedZ < this.position.z) this.position.z = snappedZ;
          }
        }
      }
    }

    // --- 3. VERTICAL PHYSICS & GRAVITY / JUMPING / FLIGHT ---
    if (!this.isFlying) {
      // Jump
      if (this.isGrounded && input.jump) {
        this.velocity.y = 8.5;
        this.isGrounded = false;
      }

      // Gravity
      this.velocity.y -= 22 * delta;
      const deltaY = this.velocity.y * delta;
      const targetY = this.position.y + deltaY;

      if (deltaY <= 0) {
        // Falling downwards: search for highest solid ground voxel beneath player's footprint
        let highestFloorY: number | null = null;
        const startX = Math.floor(this.position.x - radius);
        const endX = Math.floor(this.position.x + radius - 0.0001);
        const startZ = Math.floor(this.position.z - radius);
        const endZ = Math.floor(this.position.z + radius - 0.0001);

        const checkTopY = Math.floor(this.position.y + 0.15);
        const checkBotY = Math.floor(targetY - 0.1);

        for (let x = startX; x <= endX; x++) {
          for (let z = startZ; z <= endZ; z++) {
            for (let y = checkTopY; y >= checkBotY; y--) {
              const solid = voxelWorld.isSolid ? voxelWorld.isSolid(x, y, z) : voxelWorld.getBlock(x, y, z) > 0;
              if (solid) {
                const surfaceY = y + 1.0;
                if (highestFloorY === null || surfaceY > highestFloorY) {
                  highestFloorY = surfaceY;
                }
              }
            }
          }
        }

        if (highestFloorY !== null && targetY <= highestFloorY) {
          this.position.y = highestFloorY;
          this.velocity.y = 0;
          this.isGrounded = true;
        } else {
          this.position.y = targetY;
          this.isGrounded = false;

          // Safety bounds: if player falls off the world map, respawn in Town Plaza
          if (this.position.y < -10) {
            this.position.set(0, 3, 0);
            this.velocity.set(0, 0, 0);
            this.isGrounded = true;
          }
        }
      } else {
        // Jumping upwards: check ceiling collision
        const ceilingHit = this.isAABBColliding(
          this.position.x - radius, targetY + height - 0.1, this.position.z - radius,
          this.position.x + radius, targetY + height, this.position.z + radius,
          voxelWorld
        );

        if (ceilingHit) {
          this.velocity.y = 0; // Bonk head on ceiling
          const ceilingBlockY = Math.floor(targetY + height);
          this.position.y = ceilingBlockY - height - 0.001;
        } else {
          this.position.y = targetY;
        }
        this.isGrounded = false;
      }
    } else {
      // Flight Mode (3D Navigation with collision boundaries)
      let flyDeltaY = 0;
      if (input.flyUp || input.jump) flyDeltaY += 8.5 * delta;
      if (input.flyDown) flyDeltaY -= 8.5 * delta;

      if (flyDeltaY > 0) {
        const testY = this.position.y + flyDeltaY;
        const ceilingHit = this.isAABBColliding(
          this.position.x - radius, testY + height - 0.1, this.position.z - radius,
          this.position.x + radius, testY + height, this.position.z + radius,
          voxelWorld
        );
        if (!ceilingHit) {
          this.position.y = Math.min(45, testY);
        }
      } else if (flyDeltaY < 0) {
        const testY = this.position.y + flyDeltaY;
        const groundHit = this.isAABBColliding(
          this.position.x - radius, testY - 0.05, this.position.z - radius,
          this.position.x + radius, testY + 0.1, this.position.z + radius,
          voxelWorld
        );
        if (!groundHit) {
          this.position.y = Math.max(2, testY);
        }
      }
      this.velocity.y = 0;
      this.isGrounded = false;
    }

    // World Map Bounds
    this.position.x = Math.max(-60, Math.min(60, this.position.x));
    this.position.z = Math.max(-60, Math.min(60, this.position.z));

    // Update Avatar Mesh Transform
    this.avatarGroup.position.copy(this.position);
    this.avatarGroup.rotation.y = this.rotation;

    // Animations (Legs/Arms swing or Riding pose)
    if (this.isRiding) {
      this.leftLeg.rotation.x = -Math.PI / 2.5;
      this.rightLeg.rotation.x = -Math.PI / 2.5;
      this.leftArm.rotation.x = -Math.PI / 3;
      this.rightArm.rotation.x = -Math.PI / 3;
      this.torso.position.y = 1.0;
    } else if (this.isWalking) {
      const swing = Math.sin(this.animTime * 11) * 0.7;
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing;
      this.rightArm.rotation.x = this.toolSwingTimer > 0 ? -1.5 : swing;
      this.torso.position.y = 1.4 + Math.abs(Math.sin(this.animTime * 11)) * 0.08;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = this.toolSwingTimer > 0 ? -1.5 : 0;
      this.torso.position.y = 1.4;
    }

    // Update Camera Orbit
    this.updateCamera();
  }

  public triggerToolSwing() {
    this.toolSwingTimer = 0.35;
  }

  private updateCamera() {
    const effectiveDist = this.isIndoor ? Math.min(this.cameraDistance, 5.2) : this.cameraDistance;
    const effectivePitch = this.isIndoor ? Math.max(this.cameraPitch, 0.48) : this.cameraPitch;

    const cx = this.position.x - Math.sin(this.cameraYaw) * Math.cos(effectivePitch) * effectiveDist;
    const cz = this.position.z - Math.cos(this.cameraYaw) * Math.cos(effectivePitch) * effectiveDist;
    const cy = this.position.y + 1.8 + Math.sin(effectivePitch) * effectiveDist;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.position.x, this.position.y + 1.4, this.position.z);
  }
}
