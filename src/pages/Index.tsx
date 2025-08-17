
import { useState } from 'react';
import StudyUpload from '@/components/StudyUpload';
import SongResults from '@/components/SongResults';
import { useToast } from '@/hooks/use-toast';
import { sunoService } from '@/services/sunoService';
import { pdfProcessor } from '@/services/pdfProcessor';
import { openaiService } from '@/services/openaiService';

const Index = () => {
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

  const handleFileUpload = async (file: File) => {
    console.log('Processing file:', file.name);
    setIsProcessing(true);
    
    try {
      // Extract text from PDF
      const pdfText = await pdfProcessor.extractText(file);
      console.log('Extracted PDF text length:', pdfText.length);
      
      // Generate lyrics from PDF content
      const lyrics = await openaiService.generateLyrics(pdfText);
      console.log('Generated lyrics:', lyrics);
      
      // Create song with Suno
      const audioUrl = await sunoService.createSong(lyrics);
      console.log('Created song with URL:', audioUrl);
      
      setSongData({ audioUrl, lyrics });
      
      toast({
        title: "Song created successfully! 🎵",
        description: "Your study song is ready to listen to.",
      });
    } catch (error) {
      console.error('Error creating song:', error);
      toast({
        title: "Failed to create song",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUrlSubmit = async (url: string) => {
    console.log('Processing URL:', url);
    setIsProcessing(true);
    
    try {
      // For now, show a message that URL processing isn't implemented yet
      toast({
        title: "URL processing not yet implemented",
        description: "Please upload a PDF file instead.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error processing URL:', error);
      toast({
        title: "Failed to process URL",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAnother = () => {
    setSongData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        {songData ? (
          <SongResults
            audioUrl={songData.audioUrl}
            lyrics={songData.lyrics}
            onCreateAnother={handleCreateAnother}
          />
        ) : (
          <StudyUpload
            onFileUpload={handleFileUpload}
            onUrlSubmit={handleUrlSubmit}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
