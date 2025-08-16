import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface GenreSelectorProps {
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  referenceArtist: string;
  onReferenceArtistChange: (artist: string) => void;
}

const POPULAR_GENRES = [
  'Hip-Hop',
  'Electropop', 
  'Pop',
  'Indie',
  'EDM',
  'Lo-Fi',
  'Trap',
  'R&B',
  'Rock',
  'Classical'
];

const GenreSelector = ({ 
  selectedGenre, 
  onGenreChange, 
  referenceArtist, 
  onReferenceArtistChange 
}: GenreSelectorProps) => {
  const [customGenre, setCustomGenre] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleGenreSelect = (genre: string) => {
    onGenreChange(genre);
    setIsCustomMode(false);
    setCustomGenre('');
  };

  const handleCustomGenreChange = (value: string) => {
    setCustomGenre(value);
    onGenreChange(value);
    setIsCustomMode(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Genre Selection */}
      <Card className="glass-card p-8">
        <div className="space-y-6">
          <div>
            <Label className="text-lg font-semibold mb-4 block">Choose Your Genre</Label>
            <p className="text-muted-foreground mb-6">
              Select a music style for your study song
            </p>
          </div>

          {/* Quick Genre Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {POPULAR_GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreSelect(genre)}
                className={`genre-button px-4 py-3 rounded-lg text-sm font-medium min-h-[44px] ${
                  selectedGenre === genre && !isCustomMode ? 'active' : ''
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Custom Genre Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-genre" className="text-sm font-medium">
              Or enter a custom genre
            </Label>
            <Input
              id="custom-genre"
              placeholder="e.g., Synthwave, Lo-fi Jazz, Ambient Electronic..."
              value={customGenre}
              onChange={(e) => handleCustomGenreChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Reference Artist */}
      <Card className="glass-card p-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="reference-artist" className="text-lg font-semibold mb-2 block">
              Reference Artist (Optional)
            </Label>
            <p className="text-muted-foreground mb-4">
              Whose style should inspire your study song?
            </p>
          </div>
          <Input
            id="reference-artist"
            placeholder="e.g., Daft Punk, Kendrick Lamar, Billie Eilish..."
            value={referenceArtist}
            onChange={(e) => onReferenceArtistChange(e.target.value)}
            className="w-full"
          />
        </div>
      </Card>

      {/* Current Selection Display */}
      {selectedGenre && (
        <Card className="glass-card p-6 bg-primary/10 border-primary/20">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Selected Style:</p>
            <p className="text-xl font-semibold text-primary">
              {selectedGenre}
              {referenceArtist && (
                <span className="text-lg text-muted-foreground">
                  {' '}inspired by {referenceArtist}
                </span>
              )}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GenreSelector;