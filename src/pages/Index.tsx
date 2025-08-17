import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import StudyUpload from '@/components/StudyUpload';
import GenreSelector from '@/components/GenreSelector';
import SongResults from '@/components/SongResults';
import { extractTextFromPDF } from '@/services/pdfProcessor';
import { createSong, getSongStatus } from '@/services/edgeFunctionService';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'processing' | 'results'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [referenceArtist, setReferenceArtist] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [songResults, setSongResults] = useState<any>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    try {
      const text = await extractTextFromPDF(file);
      setExtractedText(text);
      setUploadedFile(file);
      setCurrentStep('configure');
      
      toast({
        title: "PDF processed successfully!",
        description: "Now choose your music style"
      });
    } catch (error) {
      toast({
        title: "Error processing PDF",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive"
      });
    }
  };

  const handleUrlSubmit = async (url: string) => {
    try {
      const text = await extractTextFromPDF(url as any); // PDF processor handles URLs too
      setExtractedText(text);
      setPdfUrl(url);
      setCurrentStep('configure');
      
      toast({
        title: "PDF URL processed successfully!",
        description: "Now choose your music style"
      });
    } catch (error) {
      toast({
        title: "Error processing PDF URL",
        description: error instanceof Error ? error.message : "Failed to process PDF URL",
        variant: "destructive"
      });
    }
  };

  const handleCreateSong = async () => {
    if (!extractedText || !selectedGenre) return;
    
    setIsProcessing(true);
    setCurrentStep('processing');
    
    try {
      // Step 1: Create song using edge function
      toast({
        title: "Creating your song...",
        description: "Analyzing content and generating music"
      });
      
      const response = await createSong(extractedText, selectedGenre);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create song');
      }
      
      // Step 2: Poll for completion
      let songDetails = null;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        try {
          const statusResponse = await getSongStatus(response.taskId!);
          
          if (statusResponse.success && statusResponse.data && statusResponse.data.length > 0) {
            const song = statusResponse.data[0];
            if (song.audio_url) {
              songDetails = statusResponse.data;
              break;
            }
          }
        } catch (error) {
          console.log('Still processing...', error);
        }
        
        attempts++;
        
        if (attempts % 6 === 0) { // Every 30 seconds
          toast({
            title: "Still creating...",
            description: `Please wait, this can take up to 5 minutes`
          });
        }
      }
      
      if (!songDetails || songDetails.length === 0 || !songDetails[0].audio_url) {
        throw new Error('Song generation timed out or failed');
      }
      
      setSongResults({
        summary: response.summary,
        lyrics: response.lyrics,
        songs: songDetails
      });
      
      setCurrentStep('results');
      
      toast({
        title: "Success!",
        description: "Your study song has been created"
      });
      
    } catch (error) {
      console.error('Error creating song:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create song",
        variant: "destructive"
      });
      setCurrentStep('configure');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setPdfUrl('');
    setExtractedText('');
    setSelectedGenre('');
    setReferenceArtist('');
    setSongResults(null);
  };

  const goBack = () => {
    switch (currentStep) {
      case 'configure':
        setCurrentStep('upload');
        break;
      case 'results':
        setCurrentStep('configure');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              StudySong AI
            </h1>
            <p className="text-muted-foreground text-lg">
              Transform your study materials into memorable songs
            </p>
          </div>

      {/* Back Button */}
      {currentStep !== 'upload' && currentStep !== 'processing' && (
        <Button
          variant="ghost"
          onClick={goBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}

      {/* Step Content */}
      {currentStep === 'upload' && (
        <StudyUpload
          onFileUpload={handleFileUpload}
          onUrlSubmit={handleUrlSubmit}
        />
      )}

      {currentStep === 'configure' && (
        <div className="space-y-8">
          <GenreSelector
            selectedGenre={selectedGenre}
            onGenreChange={setSelectedGenre}
            referenceArtist={referenceArtist}
            onReferenceArtistChange={setReferenceArtist}
          />
          
          <div className="text-center">
            <Button
              onClick={handleCreateSong}
              disabled={!selectedGenre || !extractedText}
              size="lg"
              className="px-8"
            >
              Create My Study Song
            </Button>
          </div>
        </div>
      )}

      {currentStep === 'processing' && (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-2">Creating your study song...</h2>
            <p className="text-muted-foreground">
              This may take a few minutes. We're analyzing your content and generating music.
            </p>
          </div>
        </div>
      )}

      {currentStep === 'results' && songResults && (
        <SongResults
          audioUrl={songResults.songs[0]?.audio_url || ''}
          lyrics={songResults.lyrics}
          onCreateAnother={handleStartOver}
        />
      )}
        </div>
      </div>
    </div>
  );
};

export default Index;