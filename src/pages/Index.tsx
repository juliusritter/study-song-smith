
import { useState } from 'react';
import StudyUpload from '@/components/StudyUpload';
import SongResults from '@/components/SongResults';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromPDF, extractTextFromURL } from '@/services/pdfProcessor';
import { createSong, getSongStatus } from '@/services/edgeFunctionService';

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

  const handleFileUpload = async (file: File, genre: string = 'Educational Pop') => {
    console.log('Processing file:', file.name);
    setIsProcessing(true);
    
    try {
      // Extract text from PDF
      const pdfText = await extractTextFromPDF(file);
      console.log('Extracted PDF text length:', pdfText.length);
      
      // Create song using edge function
      const result = await createSong(pdfText, genre);
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
        
        if (statusResult.success && statusResult.data?.songs?.length > 0) {
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUrlSubmit = async (url: string, genre: string = 'Educational Pop') => {
    console.log('Processing URL:', url);
    setIsProcessing(true);
    
    try {
      // Extract text from PDF URL
      const pdfText = await extractTextFromURL(url);
      console.log('Extracted PDF text from URL, length:', pdfText.length);
      
      // Create song using edge function
      const result = await createSong(pdfText, genre);
      console.log('Song creation result:', result);
      
      if (!result.success || !result.taskId) {
        throw new Error(result.error || 'Failed to create song');
      }
      
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusResult = await getSongStatus(result.taskId);
        console.log('Status check:', statusResult);
        
        if (statusResult.success && statusResult.data?.songs?.length > 0) {
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
