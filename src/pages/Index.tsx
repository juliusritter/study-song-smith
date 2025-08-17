
import { useState } from 'react';
import StudyUpload from '@/components/StudyUpload';
import GenreSelector from '@/components/GenreSelector';
import SongResults from '@/components/SongResults';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromPDF, extractTextFromURL } from '@/services/pdfProcessor';
import { createSong, getSongStatus } from '@/services/edgeFunctionService';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [step, setStep] = useState<'upload' | 'customize' | 'processing'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [referenceArtist, setReferenceArtist] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [songData, setSongData] = useState<{
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
  } | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setUploadedUrl('');
    setStep('customize');
  };

  const handleUrlSubmit = (url: string) => {
    setUploadedUrl(url);
    setUploadedFile(null);
    setStep('customize');
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
  };

  const handleReferenceArtistChange = (artist: string) => {
    setReferenceArtist(artist);
  };

  const processFile = async () => {
    if (!selectedGenre) {
      toast({
        title: "Please select a genre",
        description: "Choose a music style for your study song.",
        variant: "destructive",
      });
      return;
    }

    setStep('processing');
    setIsProcessing(true);
    
    try {
      let pdfText = '';
      
      if (uploadedFile) {
        console.log('Processing file:', uploadedFile.name);
        pdfText = await extractTextFromPDF(uploadedFile);
      } else if (uploadedUrl) {
        console.log('Processing URL:', uploadedUrl);
        pdfText = await extractTextFromURL(uploadedUrl);
      }
      
      console.log('Extracted PDF text length:', pdfText.length);
      
      // Create song using edge function
      const result = await createSong(pdfText, selectedGenre, referenceArtist);
      console.log('Song creation result:', result);
      
      if (!result.success || !result.taskId) {
        throw new Error(result.error || 'Failed to create song');
      }
      
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusResult = await getSongStatus(result.taskId);
        console.log('Status check:', statusResult);
        
        if (statusResult.success && statusResult.data?.status === 'SUCCESS' && statusResult.data?.songs?.length > 0) {
          const song = statusResult.data.songs[0];
          if (song.audioUrl) {
            setSongData({ 
              audioUrl: song.audioUrl,
              lyrics: result.lyrics || { title: 'Study Song', sections: [] }
            });
            
            toast({
              title: "Song created successfully! 🎵",
              description: "Your study song is ready to listen to.",
            });
            return;
          }
        }
        
        attempts++;
      }
      
      throw new Error('Song generation timed out');
    } catch (error) {
      console.error('Error creating song:', error);
      toast({
        title: "Failed to create song",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      setStep('customize');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (step === 'customize') {
      setStep('upload');
      setUploadedFile(null);
      setUploadedUrl('');
      setSelectedGenre('');
      setReferenceArtist('');
    }
  };

  const handleCreateAnother = () => {
    setSongData(null);
    setStep('upload');
    setUploadedFile(null);
    setUploadedUrl('');
    setSelectedGenre('');
    setReferenceArtist('');
  };

  const renderStep = () => {
    if (songData) {
      return (
        <SongResults
          audioUrl={songData.audioUrl}
          lyrics={songData.lyrics}
          onCreateAnother={handleCreateAnother}
        />
      );
    }

    switch (step) {
      case 'upload':
        return (
          <StudyUpload
            onFileUpload={handleFileUpload}
            onUrlSubmit={handleUrlSubmit}
            isProcessing={false}
          />
        );
      
      case 'customize':
        return (
          <div className="space-y-6">
            <GenreSelector
              selectedGenre={selectedGenre}
              onGenreChange={handleGenreChange}
              referenceArtist={referenceArtist}
              onReferenceArtistChange={handleReferenceArtistChange}
            />
            
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                variant="hero" 
                onClick={processFile}
                disabled={!selectedGenre}
                size="lg"
              >
                Create My Song
              </Button>
            </div>
          </div>
        );
      
      case 'processing':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Creating Your Study Song...</h2>
              <p className="text-muted-foreground">
                AI is composing a {selectedGenre} song from your material. This usually takes 2-3 minutes.
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        {renderStep()}
      </div>
    </div>
  );
};

export default Index;
