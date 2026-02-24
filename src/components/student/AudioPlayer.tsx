import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  autoPlayDelay?: number;
}

const AudioPlayer = ({ src, autoPlay = true, autoPlayDelay = 3000 }: AudioPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (autoPlay && src) {
      const timer = setTimeout(() => {
        audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
      }, autoPlayDelay);
      return () => clearTimeout(timer);
    }
  }, [src, autoPlay, autoPlayDelay]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const handleEnded = () => setPlaying(false);

  return (
    <div className="flex justify-center">
      <audio ref={audioRef} src={src} onEnded={handleEnded} />
      <button
        onClick={toggle}
        className={`touch-target-xxl w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 active:scale-90 ${
          playing
            ? "bg-primary text-primary-foreground animate-pulse-soft"
            : "bg-student-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {playing ? (
          <VolumeX className="w-14 h-14 sm:w-16 sm:h-16" />
        ) : (
          <Volume2 className="w-14 h-14 sm:w-16 sm:h-16" />
        )}
      </button>
    </div>
  );
};

export default AudioPlayer;
