import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SongResultsProps {
  audioUrl: string;
  lyrics: {
    title: string;
    sections: Array<{
      type: string;
      bars: number;
      purpose: string;
      lines: string[];
    }>;
  };
  onCreateAnother: () => void;
}

const SongResults = ({ audioUrl, lyrics, onCreateAnother }: SongResultsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'verse': return '🎵';
      case 'chorus': return '🎤';
      case 'bridge': return '🌉';
      default: return '🎶';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold gradient-text">{lyrics.title}</h1>
        <p className="text-lg text-muted-foreground">
          Your study song is ready! 🎉
        </p>
      </div>

      {/* Audio Player */}
      <Card className="glass-card p-8">
        <div className="space-y-6">
          {/* Play Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="hero"
              size="lg"
              onClick={togglePlayback}
              className="w-16 h-16 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div
              className="w-full h-2 bg-secondary rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                style={{
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" asChild>
              <a href={audioUrl} download={`${lyrics.title}.mp3`}>
                <Download className="w-4 h-4" />
                Download
              </a>
            </Button>
            <Button variant="outline" onClick={onCreateAnother}>
              <RotateCcw className="w-4 h-4" />
              Create Another
            </Button>
          </div>
        </div>
      </Card>

      {/* Lyrics Display */}
      <Card className="glass-card">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Study Lyrics</h2>
          <p className="text-muted-foreground">
            Learn while you listen - each section teaches key concepts
          </p>
        </div>
        <ScrollArea className="h-96 p-6">
          <div className="space-y-6">
            {lyrics.sections.map((section, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getSectionIcon(section.type)}</span>
                  <div>
                    <h3 className="font-semibold capitalize">
                      {section.type} ({section.bars} bars)
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {section.purpose.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="pl-10 space-y-1">
                  {section.lines.map((line, lineIndex) => (
                    <p key={lineIndex} className="text-foreground leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
};

export default SongResults;