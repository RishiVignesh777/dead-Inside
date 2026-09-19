import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { LEVELS } from './game/levels';
import { GameSettings } from './types';
import { soundEngine } from './audio/soundEngine';

export default function App() {
  const [currentChapterId, setCurrentChapterId] = useState<number>(1);
  const [showTitleCard, setShowTitleCard] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [noiseLevel, setNoiseLevel] = useState<number>(0);
  const [isHiddenInShadow, setIsHiddenInShadow] = useState<boolean>(false);
  const [isDogAlerted, setIsDogAlerted] = useState<boolean>(false);
  const [showEnding, setShowEnding] = useState<boolean>(false);
  const [checkpointToast, setCheckpointToast] = useState<string | null>(null);
  const [restartNonce, setRestartNonce] = useState<number>(0);

  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicVolume: 0.8,
    sfxVolume: 0.9,
    letterbox: true,
    filmGrain: true,
  });

  const currentLevel = LEVELS.find((l) => l.id === currentChapterId) || LEVELS[0];

  // Show dramatic title card when chapter changes
  useEffect(() => {
    setShowTitleCard(true);
    const timer = setTimeout(() => {
      setShowTitleCard(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, [currentChapterId]);

  // Handle global keyboard hotkeys (Escape, P, M, R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        setIsPaused((prev) => !prev);
      } else if (e.code === 'KeyM') {
        setSettings((prev) => {
          const next = !prev.soundEnabled;
          soundEngine.setMuted(!next);
          return { ...prev, soundEnabled: next };
        });
      } else if (e.code === 'KeyR' && !isPaused) {
        // Instant rewind to checkpoint
        setRestartNonce((n) => n + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused]);

  // Sync sound settings with soundEngine
  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.soundEnabled !== undefined) {
        soundEngine.setMuted(!newSettings.soundEnabled);
      }
      return updated;
    });
  }, []);

  const handleChapterComplete = useCallback(
    (nextChapterId: number) => {
      if (nextChapterId > LEVELS.length) {
        setShowEnding(true);
      } else {
        setCurrentChapterId(nextChapterId);
      }
    },
    []
  );

  const handlePlayerCaught = useCallback(() => {
    // Checkpoint reset is automatically performed with cinematic rewind in GameCanvas
  }, []);

  const handleCheckpointReached = useCallback((index: number) => {
    setCheckpointToast(`CHECKPOINT ${index} LOGGED`);
    setTimeout(() => {
      setCheckpointToast(null);
    }, 2200);
  }, []);

  const handleRestartCheckpoint = useCallback(() => {
    setRestartNonce((n) => n + 1);
  }, []);

  const handleRestartGame = useCallback(() => {
    setShowEnding(false);
    setCurrentChapterId(1);
    setRestartNonce((n) => n + 1);
  }, []);

  return (
    <main id="app-container" className="relative w-screen h-screen overflow-hidden bg-[#06080a] select-none font-sans">
      {/* Game Canvas Viewport */}
      <GameCanvas
        key={`game-canvas-${currentChapterId}-${restartNonce}`}
        currentChapterId={currentChapterId}
        onChapterComplete={handleChapterComplete}
        onPlayerCaught={handlePlayerCaught}
        onCheckpointReached={handleCheckpointReached}
        settings={settings}
        isPaused={isPaused}
        onInteractPromptChange={setInteractPrompt}
        onStealthStateChange={(noise, hidden, alerted) => {
          setNoiseLevel(noise);
          setIsHiddenInShadow(hidden);
          setIsDogAlerted(alerted);
        }}
      />

      {/* Atmospheric UI Overlay */}
      <UIOverlay
        chapterTitle={currentLevel.title}
        chapterSubtitle={currentLevel.subtitle}
        showTitleCard={showTitleCard}
        interactPrompt={interactPrompt}
        noiseLevel={noiseLevel}
        isHiddenInShadow={isHiddenInShadow}
        isDogAlerted={isDogAlerted}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        onRestartCheckpoint={handleRestartCheckpoint}
        onSelectChapter={(id) => {
          setCurrentChapterId(id);
          setShowEnding(false);
        }}
        currentChapterId={currentChapterId}
        totalChapters={LEVELS.length}
        settings={settings}
        onUpdateSettings={updateSettings}
        showEnding={showEnding}
        onRestartGame={handleRestartGame}
      />

      {/* Checkpoint Toast */}
      {checkpointToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-neutral-400 font-mono text-[11px] tracking-[0.2em] uppercase backdrop-blur-sm pointer-events-none transition-all z-40">
          {checkpointToast}
        </div>
      )}
    </main>
  );
}
