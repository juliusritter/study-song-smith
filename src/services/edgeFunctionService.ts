import { supabase } from "@/integrations/supabase/client";

export interface CreateSongResponse {
  success: boolean;
  taskId?: string;
  summary?: any;
  lyrics?: any;
  error?: string;
}

export interface SongStatusResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const createSong = async (text: string, genre: string, referenceArtist?: string): Promise<CreateSongResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-song', {
      body: { text, genre, referenceArtist }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to create song');
    }

    return data;
  } catch (error) {
    console.error('Error calling create-song:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const getSongStatus = async (taskId: string): Promise<SongStatusResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-song-status', {
      body: { taskId }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to get song status');
    }

    return data;
  } catch (error) {
    console.error('Error calling get-song-status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};