import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, Hammer, Footprints, Sparkles } from 'lucide-react';

interface MobileControlsProps {
  onJoystickMove: (x: number, y: number) => void;
  onJump: () => void;
  onAction: () => void;
  isFlying: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onJump,
  onAction,
  isFlying,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const touch = e.touches[0];
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.min(45, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * distance;
    const stickY = Math.sin(angle) * distance;

    setStickPos({ x: stickX, y: stickY });
    onJoystickMove(stickX / 45, -stickY / 45);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setStickPos({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  return (
    <div className="md:hidden absolute inset-0 pointer-events-none z-30 select-none">
      {/* Bottom-Left Virtual Joystick */}
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute bottom-24 left-6 w-28 h-28 rounded-full bg-slate-950/70 backdrop-blur-xl border-2 border-cyan-400/60 pointer-events-auto flex items-center justify-center touch-none shadow-2xl shadow-cyan-500/20"
      >
        <div
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-cyan-400 border-2 border-white shadow-lg pointer-events-none transition-transform duration-75"
          style={{ transform: `translate(${stickPos.x}px, ${stickPos.y}px)` }}
        />
      </div>

      {/* Bottom-Right Action Buttons */}
      <div className="absolute bottom-24 right-6 pointer-events-auto flex flex-col gap-3">
        {/* Jump / Fly button */}
        <button
          onTouchStart={onJump}
          className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/25 border-2 border-cyan-200 active:scale-90 transition"
        >
          <ArrowUp className="w-7 h-7 stroke-[3]" />
        </button>

        {/* Build / Interact button */}
        <button
          onTouchStart={onAction}
          className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/25 border-2 border-amber-200 active:scale-90 transition"
        >
          <Hammer className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

