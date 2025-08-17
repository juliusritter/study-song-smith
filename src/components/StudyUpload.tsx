import { useState, useRef } from 'react';
import { Upload, Link, Music, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface StudyUploadProps {
  onFileUpload: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  isProcessing?: boolean;
}

const StudyUpload = ({ onFileUpload, onUrlSubmit, isProcessing = false }: StudyUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      onFileUpload(pdfFile);
      setInputType('file');
      setInputValue(pdfFile.name);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file);
      setInputType('file');
      setInputValue(file.name);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Auto-detect if input looks like a URL
    if (value.startsWith('http://') || value.startsWith('https://')) {
      setInputType('url');
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    
    if (inputType === 'url') {
      onUrlSubmit(inputValue);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Music className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold gradient-text">Beathoven</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Transform any PDF into a catchy study song you can learn at the gym
        </p>
      </div>

      {/* Upload/Link Input */}
      <Card className="glass-card">
        <div
          className={`upload-zone rounded-lg p-8 text-center cursor-pointer ${
            isDragOver ? 'border-solid bg-primary/10' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !inputValue && openFilePicker()}
        >
          {inputValue ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                {inputType === 'file' ? (
                  <FileText className="w-8 h-8 text-primary" />
                ) : (
                  <Link className="w-8 h-8 text-primary" />
                )}
                <span className="text-foreground font-medium">{inputValue}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setInputValue('');
                  setInputType('url');
                }}
              >
                Clear
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <Upload className="w-12 h-12 text-primary mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upload PDF or paste link</h3>
                  <p className="text-muted-foreground">
                    Drag and drop a PDF file here, or click to select
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  placeholder="Or paste a PDF link here..."
                  value={inputValue}
                  onChange={handleInputChange}
                  className="flex-1"
                  disabled={isProcessing}
                />
                <Button
                  variant="hero"
                  onClick={openFilePicker}
                  className="shrink-0"
                  disabled={isProcessing}
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Submit Button */}
      {inputValue && (
        <div className="text-center">
          <Button
            variant="hero"
            size="lg"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="min-w-48"
          >
            {isProcessing ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default StudyUpload;