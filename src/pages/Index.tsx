import { useState } from 'react';
import StudyUpload from '@/components/StudyUpload';
import GenreSelector from '@/components/GenreSelector';
import SongResults from '@/components/SongResults';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type Step = 'upload' | 'configure' | 'processing' | 'results';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [referenceArtist, setReferenceArtist] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock results for demo - in real app this would come from the API
  const mockResults = {
    audioUrl: '/mock-audio.mp3', // Would be real URL from Suno API
    lyrics: {
      title: 'Quantum Computing Study Song',
      sections: [
        {
          type: 'verse',
          bars: 16,
          purpose: 'overview',
          lines: [
            'Quantum bits are spinning round, superposition can be found',
            'Zero and one at the same time, quantum mechanics so sublime',
            'Entanglement across the space, spooky action at this pace',
            'Computing power exponential, for problems that are essential'
          ]
        },
        {
          type: 'chorus',
          bars: 8,
          purpose: 'main_takeaways',
          lines: [
            'Quantum speed-up is the key, factoring done efficiently',
            'Shor\'s algorithm breaks the code, cryptography\'s episode',
            'But decoherence is the foe, keeping quantum states below',
            'Error correction saves the day, quantum computing finds its way'
          ]
        }
      ]
    }
  };

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    setCurrentStep('configure');
  };

  const handleUrlSubmit = (url: string) => {
    setPdfUrl(url);
    setCurrentStep('configure');
  };

  const handleCreateSong = async () => {
    if (!selectedGenre) return;
    
    setIsProcessing(true);
    setCurrentStep('processing');
    
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep('results');
    }, 3000);
  };

  const handleStartOver = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setPdfUrl('');
    setSelectedGenre('');
    setReferenceArtist('');
    setIsProcessing(false);
  };

  const goBack = () => {
    switch (currentStep) {
      case 'configure':
        setCurrentStep('upload');
        break;
      case 'processing':
        setCurrentStep('configure');
        break;
      case 'results':
        setCurrentStep('configure');
        break;
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        {currentStep !== 'upload' && (
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={goBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'upload' && (
          <StudyUpload
            onFileUpload={handleFileUpload}
            onUrlSubmit={handleUrlSubmit}
            isProcessing={isProcessing}
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
                variant="hero"
                size="lg"
                onClick={handleCreateSong}
                disabled={!selectedGenre || isProcessing}
                className="min-w-48"
              >
                Create My Study Song
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="text-center space-y-8">
            <div>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center animate-pulse">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Creating your study song...</h2>
              <p className="text-muted-foreground">
                Extracting content, generating lyrics, and producing your custom track
              </p>
            </div>
          </div>
        )}

        {currentStep === 'results' && (
          <SongResults
            audioUrl={mockResults.audioUrl}
            lyrics={mockResults.lyrics}
            onCreateAnother={handleStartOver}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
