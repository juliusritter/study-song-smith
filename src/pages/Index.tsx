import { useEffect, useState } from 'react';
import StudyUpload from '@/components/StudyUpload';
import GenreSelector from '@/components/GenreSelector';
import SongResults from '@/components/SongResults';
import ApiKeyInput from '@/components/ApiKeyInput';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { extractTextFromPDF, extractTextFromURL } from '@/services/pdfProcessor';
import { summarizeTextForLearning, generateLyrics } from '@/services/openaiService';
import { generateSong } from '@/services/sunoService';
import { toast } from '@/hooks/use-toast';

type Step = 'apikeys' | 'upload' | 'configure' | 'processing' | 'results';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>(() => {
    const hasKeys = localStorage.getItem('openai_key') && localStorage.getItem('suno_key');
    return hasKeys ? 'upload' : 'apikeys';
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [referenceArtist, setReferenceArtist] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [sunoKey, setSunoKey] = useState('');
  const [processedText, setProcessedText] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [processingStep, setProcessingStep] = useState<string>('');

  // Hydrate keys from localStorage if present so users can skip the API key step
  useEffect(() => {
    const storedOpenAI = localStorage.getItem('openai_key') || '';
    const storedSuno = localStorage.getItem('suno_key') || '';
    if (storedOpenAI) setOpenaiKey(storedOpenAI);
    if (storedSuno) setSunoKey(storedSuno);
  }, []);
  const handleApiKeysSet = (openai: string, suno: string) => {
    setOpenaiKey(openai);
    setSunoKey(suno);
    setCurrentStep('upload');
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingStep('Extracting text from PDF...');
      const text = await extractTextFromPDF(file);
      setProcessedText(text);
      setSelectedFile(file);
      setCurrentStep('configure');
      toast({ title: 'PDF processed successfully!' });
    } catch (error) {
      toast({ 
        title: 'Error processing PDF', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleUrlSubmit = async (url: string) => {
    try {
      setIsProcessing(true);
      setProcessingStep('Extracting text from PDF URL...');
      const text = await extractTextFromURL(url);
      setProcessedText(text);
      setPdfUrl(url);
      setCurrentStep('configure');
      toast({ title: 'PDF URL processed successfully!' });
    } catch (error) {
      toast({ 
        title: 'Error processing PDF URL', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleCreateSong = async () => {
    if (!selectedGenre || !processedText || !openaiKey || !sunoKey) return;
    
    setIsProcessing(true);
    setCurrentStep('processing');
    
    try {
      // Step 1: Summarize the text
      setProcessingStep('Analyzing and summarizing content...');
      const summary = await summarizeTextForLearning(processedText, openaiKey);
      
      // Step 2: Generate lyrics
      setProcessingStep('Creating catchy lyrics...');
      const lyricsResult = await generateLyrics(summary, openaiKey);
      
      // Step 3: Generate song
      setProcessingStep('Generating your study song...');
      const lyricsText = lyricsResult.lyrics.sections
        .map(section => section.lines.join('\n'))
        .join('\n\n');
      
      const audioUrl = await generateSong(
        lyricsResult.title,
        lyricsText,
        selectedGenre,
        referenceArtist || 'Taylor Swift',
        sunoKey
      );
      
      setResults({
        audioUrl,
        lyrics: lyricsResult.lyrics
      });
      
      setCurrentStep('results');
      toast({ title: 'Study song created successfully!' });
    } catch (error) {
      toast({ 
        title: 'Error creating song', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      setCurrentStep('configure');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleStartOver = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setPdfUrl('');
    setSelectedGenre('');
    setReferenceArtist('');
    setProcessedText('');
    setResults(null);
    setIsProcessing(false);
    setProcessingStep('');
  };

  const goBack = () => {
    switch (currentStep) {
      case 'upload':
        setCurrentStep('apikeys');
        break;
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
        {currentStep !== 'apikeys' && (
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
        {currentStep === 'apikeys' && (
          <ApiKeyInput onApiKeysSet={handleApiKeysSet} />
        )}

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
                disabled={!selectedGenre || !processedText || isProcessing}
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
                {processingStep || 'Processing...'}
              </p>
            </div>
          </div>
        )}

        {currentStep === 'results' && results && (
          <SongResults
            audioUrl={results.audioUrl}
            lyrics={results.lyrics}
            onCreateAnother={handleStartOver}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
