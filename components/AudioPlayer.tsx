
import React from 'react';
import { Play, Pause, StopCircle } from 'lucide-react';
import { GlobalTTSState, GlobalTTSControls } from '../types';

interface AudioPlayerProps {
  ttsState: GlobalTTSState;
  ttsControls: GlobalTTSControls;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ ttsState, ttsControls }) => {
  const { currentPlayingMessageId, currentLoadingMessageId, isPlaying, progress, currentTime, duration, messageText } = ttsState;

  if (!currentPlayingMessageId && !currentLoadingMessageId) {
    return null; // Don't render if no audio is active
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    ttsControls.seek(newProgress);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-brand-navy border-t border-slate-800 p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-in slide-in-from-bottom duration-300">
      
      {/* Play/Pause & Stop Buttons */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {currentLoadingMessageId ? (
          <div className="w-8 h-8 flex items-center justify-center text-brand-amber animate-spin">
            <StopCircle size={24} /> {/* Using stop circle for loading as a temporary visual */}
          </div>
        ) : (
          <button 
            onClick={ttsControls.togglePlayPause} 
            className="p-2 rounded-full bg-brand-amber text-brand-navy hover:bg-brand-yellow transition-colors"
            title={isPlaying ? "Mettre en pause" : "Jouer"}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
        )}
        
        <button 
          onClick={ttsControls.stop} 
          className="p-2 rounded-full text-slate-400 hover:text-white transition-colors"
          title="Arrêter la lecture"
        >
          <StopCircle size={24} />
        </button>
      </div>

      {/* Progress Bar and Time */}
      <div className="flex-1 flex items-center gap-3 w-full sm:w-auto">
        <span className="text-slate-400 text-xs flex-shrink-0">{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-slate-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-amber"
          disabled={currentLoadingMessageId !== null || duration === 0}
        />
        <span className="text-slate-400 text-xs flex-shrink-0">{formatTime(duration)}</span>
      </div>

      {/* Message Info */}
      <div className="flex items-center gap-2 flex-grow sm:flex-grow-0 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse"></div>
        <p className="text-slate-300 text-sm truncate max-w-[200px]">
          {messageText ? `Lecture: "${messageText}"` : "Lecture en cours..."}
        </p>
      </div>

    </div>
  );
};

export default AudioPlayer;
