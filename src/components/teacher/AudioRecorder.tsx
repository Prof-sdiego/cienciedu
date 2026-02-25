import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Trash2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
  /** When a recording is completed or cleared, this fires with the File or null */
  onRecorded: (file: File | null) => void;
  /** If there's an existing audio URL (edit mode), show it */
  existingUrl?: string | null;
  /** Called when user removes existing audio */
  onRemoveExisting?: () => void;
}

const AudioRecorder = ({ onRecorded, existingUrl, onRemoveExisting }: AudioRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [previewUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
        onRecorded(file);
      };

      mediaRecorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    } catch {
      // permission denied or no mic
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearRecording = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAudioBlob(null);
    setPreviewUrl(null);
    setElapsed(0);
    onRecorded(null);
  };

  const togglePlay = () => {
    const url = previewUrl || existingUrl;
    if (!url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.src = url;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const hasAudio = !!previewUrl || !!existingUrl;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-2">
        <Volume2 className="w-4 h-4" /> Áudio da pergunta
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {recording ? (
          <>
            <Button type="button" variant="destructive" size="sm" onClick={stopRecording} className="gap-1">
              <Square className="w-3 h-3" /> Parar
            </Button>
            <span className="text-sm text-destructive font-mono animate-pulse">
              ● {formatTime(elapsed)}
            </span>
          </>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={startRecording} className="gap-1">
            <Mic className="w-4 h-4" /> Gravar
          </Button>
        )}

        {hasAudio && !recording && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={togglePlay} className="gap-1">
              <Play className="w-3 h-3" /> {playing ? "Parar" : "Ouvir"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                clearRecording();
                onRemoveExisting?.();
              }}
              className="text-destructive hover:text-destructive gap-1"
            >
              <Trash2 className="w-3 h-3" /> Remover
            </Button>
            {!previewUrl && existingUrl && (
              <span className="text-xs text-muted-foreground">(áudio existente)</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
