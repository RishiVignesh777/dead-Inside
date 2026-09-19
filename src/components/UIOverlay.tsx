import React from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw, Eye, ShieldAlert, Sliders, Film } from 'lucide-react';
import { GameSettings } from '../types';

interface UIOverlayProps {
  chapterTitle: string;
  chapterSubtitle: string;
  showTitleCard: boolean;
  interactPrompt: string | null;
  noiseLevel: number;
  isHiddenInShadow: boolean;
  isDogAlerted: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  onRestartCheckpoint: () => void;
  onSelectChapter: (id: number) => void;
  currentChapterId: number;
  totalChapters: number;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  showEnding: boolean;
  onRestartGame: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  chapterTitle,
  chapterSubtitle,
  showTitleCard,
  interactPrompt,
  noiseLevel,
  isHiddenInShadow,
  isDogAlerted,
  isPaused,
  onTogglePause,
  onRestartCheckpoint,
  onSelectChapter,
  currentChapterId,
  totalChapters,
  settings,
  onUpdateSettings,
  showEnding,
  onRestartGame,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-6">
      {/* Top Header Bar: Chapter indicator & Minimalist controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-[0.25em] text-neutral-400 uppercase">
            {chapterTitle}
          </span>
          <span className="text-neutral-600 font-mono text-xs">•</span>
          <span className="font-mono text-xs tracking-[0.15em] text-neutral-500 uppercase">
            {chapterSubtitle}
          </span>
        </div>

        {/* Minimalist Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Sound Mute Button */}
          <button
            id="ui-btn-mute"
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className="p-2 rounded-lg bg-black/40 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5 transition-colors backdrop-blur-sm"
            title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          {/* Film Grain Toggle */}
          <button
            id="ui-btn-grain"
            onClick={() => onUpdateSettings({ filmGrain: !settings.filmGrain })}
            className={`p-2 rounded-lg bg-black/40 hover:bg-white/10 border border-white/5 transition-colors backdrop-blur-sm ${
              settings.filmGrain ? 'text-amber-400/80' : 'text-neutral-500'
            }`}
            title="Toggle Film Grain"
          >
            <Film className="w-4 h-4" />
          </button>

          {/* Restart Checkpoint */}
          <button
            id="ui-btn-restart"
            onClick={onRestartCheckpoint}
            className="p-2 rounded-lg bg-black/40 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5 transition-colors backdrop-blur-sm"
            title="Rewind to Checkpoint"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Pause Menu */}
          <button
            id="ui-btn-pause"
            onClick={onTogglePause}
            className="p-2 rounded-lg bg-black/40 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/5 transition-colors backdrop-blur-sm"
            title="Pause Menu"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Dramatic INSIDE Chapter Title Card Fade */}
      {showTitleCard && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 transition-opacity duration-1000 z-40 pointer-events-none backdrop-blur-xs">
          <h1 className="font-serif text-3xl md:text-5xl tracking-[0.4em] text-neutral-200 uppercase mb-3 text-center">
            {chapterTitle}
          </h1>
          <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-neutral-400 uppercase text-center">
            {chapterSubtitle}
          </p>
          <div className="mt-8 h-px w-24 bg-neutral-700" />
        </div>
      )}

      {/* Center Contextual Interaction Tooltip */}
      {interactPrompt && !isPaused && (
        <div className="self-center mb-16 flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 border border-neutral-700/60 backdrop-blur-md transition-all animate-pulse">
          <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-600 font-mono text-[11px] text-amber-300 font-bold">
            E
          </span>
          <span className="font-mono text-xs tracking-wider text-neutral-200 uppercase">
            {interactPrompt}
          </span>
        </div>
      )}

      {/* Bottom Bar: Stealth Acoustic Awareness & Status */}
      <div className="flex items-end justify-between">
        {/* Acoustic Footprint / Stealth Gauge */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/50 border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            {isHiddenInShadow ? (
              <Eye className="w-3.5 h-3.5 text-blue-400" />
            ) : isDogAlerted ? (
              <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-amber-400/80" />
            )}
            <span className="font-mono text-[11px] tracking-wider text-neutral-400 uppercase">
              {isHiddenInShadow ? 'Concealed in Steam/Shadow' : isDogAlerted ? 'Hound Alert!' : 'Footprint Sound'}
            </span>
          </div>

          {/* Sound ripple gauge */}
          <div className="flex items-center gap-1">
            {[0.1, 0.25, 0.45, 0.65, 0.85].map((thresh, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-xs transition-all duration-75 ${
                  noiseLevel >= thresh
                    ? isDogAlerted
                      ? 'bg-red-500 h-4'
                      : 'bg-amber-400 h-3.5'
                    : 'bg-neutral-800 h-1.5'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Minimalist Controls Guide */}
        <div className="hidden lg:flex items-center gap-4 text-neutral-500 font-mono text-[11px] tracking-wider uppercase">
          <span>[A/D] Move</span>
          <span>[S] Crouch / Sneak</span>
          <span>[W / Space] Jump / Climb</span>
          <span>[Shift] Sprint</span>
          <span>[E] Grab / Valve / Lever</span>
        </div>
      </div>

      {/* Pause Menu Modal */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center pointer-events-auto z-50">
          <div className="max-w-md w-full p-8 rounded-2xl bg-[#11171a] border border-neutral-800 shadow-2xl text-neutral-200">
            <h2 className="font-serif text-2xl tracking-[0.25em] uppercase text-center mb-1 text-neutral-100">
              Suspended
            </h2>
            <p className="text-center font-mono text-xs text-neutral-500 tracking-widest uppercase mb-8">
              Industrial Stealth Escape
            </p>

            <div className="space-y-4 mb-8">
              <button
                id="pause-resume"
                onClick={onTogglePause}
                className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-xs tracking-widest uppercase transition-colors"
              >
                Resume Run
              </button>

              <button
                id="pause-restart-cp"
                onClick={() => {
                  onRestartCheckpoint();
                  onTogglePause();
                }}
                className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 font-mono text-xs tracking-widest uppercase transition-colors"
              >
                Rewind To Checkpoint
              </button>
            </div>

            {/* Chapter Selection */}
            <div className="border-t border-neutral-800/80 pt-6">
              <p className="font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase mb-3">
                Select Sector
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 1, name: 'I. Perimeters' },
                  { id: 2, name: 'II. Foundry' },
                  { id: 3, name: 'III. Siphon' },
                  { id: 4, name: 'IV. Breakout' },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    id={`chapter-select-${ch.id}`}
                    onClick={() => {
                      onSelectChapter(ch.id);
                      onTogglePause();
                    }}
                    className={`py-2 px-3 rounded-lg font-mono text-xs tracking-wider uppercase text-left transition-colors border ${
                      currentChapterId === ch.id
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-neutral-900/60 border-neutral-800/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {ch.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cinematic Ending Screen when finishing Chapter 4 */}
      {showEnding && (
        <div className="absolute inset-0 bg-[#080c0e] flex flex-col items-center justify-center p-8 z-50 pointer-events-auto text-center">
          <div className="max-w-lg space-y-6">
            <h1 className="font-serif text-3xl md:text-5xl tracking-[0.35em] text-neutral-200 uppercase">
              Escape Into The Mist
            </h1>
            <p className="text-neutral-400 text-sm leading-relaxed font-sans">
              The locomotive boiler roars into motion, plunging through the rusted perimeter barrier into the cold industrial fog.
              Behind you, the mechanical hounds howl with metallic resonance at the cliff's edge, their glowing eyes piercing the smoke.
            </p>
            <div className="pt-6">
              <button
                id="restart-game-btn"
                onClick={onRestartGame}
                className="px-8 py-3 rounded-xl bg-neutral-200 hover:bg-white text-neutral-950 font-mono text-xs tracking-[0.2em] uppercase font-bold transition-all shadow-lg hover:shadow-neutral-200/20"
              >
                Replay Journey
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
