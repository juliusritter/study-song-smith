import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeysSet: (openaiKey: string, sunoKey: string) => void;
}

const ApiKeyInput = ({ onApiKeysSet }: ApiKeyInputProps) => {
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('openai_key') || '');
  const [sunoKey, setSunoKey] = useState(localStorage.getItem('suno_key') || '');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showSunoKey, setShowSunoKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (openaiKey && sunoKey) {
      localStorage.setItem('openai_key', openaiKey);
      localStorage.setItem('suno_key', sunoKey);
      onApiKeysSet(openaiKey, sunoKey);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>API Keys Required</CardTitle>
          <CardDescription>
            Enter your OpenAI and Suno API keys to generate study songs. Keys are stored locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                >
                  {showOpenaiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="suno-key">Suno API Key</Label>
              <div className="relative">
                <Input
                  id="suno-key"
                  type={showSunoKey ? 'text' : 'password'}
                  value={sunoKey}
                  onChange={(e) => setSunoKey(e.target.value)}
                  placeholder="Your Suno API key"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowSunoKey(!showSunoKey)}
                >
                  {showSunoKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={!openaiKey || !sunoKey}>
              Save API Keys
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyInput;