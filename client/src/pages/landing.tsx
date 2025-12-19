import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle } from "lucide-react";

const MAX_WORDS = 10000;

export default function Landing() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [chunkLength, setChunkLength] = useState(500);
  const [overlapLength, setOverlapLength] = useState(50);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;

    setError("");
    setFile(selectedFile);
    setFileName(selectedFile.name);

    try {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      // For text files, read and count words directly
      if (fileExtension === 'txt') {
        const text = await selectedFile.text();
        const words = countWords(text);
        setWordCount(words);

        if (words > MAX_WORDS) {
          setError(
            `Document exceeds ${MAX_WORDS} words (${words} words). Please use a shorter document.`
          );
          setFile(null);
          setFileName("");
          setWordCount(0);
        }
      } else {
        // For PDF/DOCX, we can't count words on frontend - show estimated
        // The backend will do the actual extraction and validation
        setWordCount(-1); // -1 indicates unknown, will be validated server-side
      }
    } catch {
      setError("Failed to read file. Please try another file.");
      setFile(null);
      setFileName("");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] || null);
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    // Only validate word count for text files (wordCount !== -1)
    if (wordCount !== -1 && wordCount > MAX_WORDS) {
      setError(
        `Document exceeds ${MAX_WORDS} words. Please use a shorter document.`
      );
      return;
    }

    try {
      setLoading(true);

      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'txt';
      let fileContent: string;
      let isBase64 = false;

      // For text files, read as text; for binary files (PDF/DOCX), encode as base64
      if (fileExtension === 'txt') {
        fileContent = await file.text();
      } else {
        fileContent = await fileToBase64(file);
        isBase64 = true;
      }

      // Store job data for loading page
      sessionStorage.setItem(
        "summaryJob",
        JSON.stringify({
          fileContent,
          fileName,
          fileType: fileExtension,
          isBase64,
          wordCount: wordCount === -1 ? null : wordCount,
          chunkLength,
          overlapLength,
        })
      );

      setLocation("/loading");
    } catch {
      setError("Failed to process file");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-6 md:py-8">
          <h1 className="text-xl md:text-2xl font-medium tracking-tight">
            Note Summarizer
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 md:px-8 pt-12 md:pt-16 pb-20">
        {/* Hero Section */}
        <div className="space-y-4 md:space-y-6 mb-12 md:mb-16">
          <h2 className="text-5xl md:text-6xl font-medium tracking-tight leading-tight">
            Summarize Your Notes
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground opacity-70 leading-relaxed">
            Upload a document and we'll generate a concise summary. Maximum of{" "}
            <span className="font-semibold">{MAX_WORDS.toLocaleString()}</span>{" "}
            words.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ${
            file
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent"
          }`}
          data-testid="upload-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={handleFileInputChange}
            className="hidden"
            data-testid="file-input"
          />

          <div className="flex flex-col items-center gap-4">
            <Upload className="w-16 h-16 text-muted-foreground opacity-60" />

            <div className="space-y-2">
              {fileName ? (
                <>
                  <p className="text-base md:text-lg font-medium">
                    {fileName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {wordCount === -1 ? "Word count will be validated on submit" : `${wordCount.toLocaleString()} words`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base md:text-lg font-medium">
                    Drag and drop or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    TXT, PDF, or DOCX files • Max {MAX_WORDS.toLocaleString()}{" "}
                    words
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-3 items-start"
            data-testid="error-message"
          >
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Parameters Section */}
        {file && !error && (
          <div className="mt-12 md:mt-16 space-y-8">
            <div>
              <h3 className="text-lg md:text-xl font-medium mb-6">
                Summarization Parameters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Chunk Length */}
                <div className="space-y-3">
                  <Label htmlFor="chunk-length" className="text-sm font-medium">
                    Chunk Length
                  </Label>
                  <Input
                    id="chunk-length"
                    type="number"
                    min="100"
                    max="1000"
                    step="50"
                    value={chunkLength}
                    onChange={(e) => setChunkLength(Number(e.target.value))}
                    className="rounded-lg p-3"
                    data-testid="input-chunk-length"
                  />
                  <p className="text-xs text-muted-foreground opacity-60">
                    Words per chunk (100-1000). Default: 500
                  </p>
                </div>

                {/* Overlap Length */}
                <div className="space-y-3">
                  <Label htmlFor="overlap-length" className="text-sm font-medium">
                    Overlap Length
                  </Label>
                  <Input
                    id="overlap-length"
                    type="number"
                    min="0"
                    max="500"
                    step="10"
                    value={overlapLength}
                    onChange={(e) => setOverlapLength(Number(e.target.value))}
                    className="rounded-lg p-3"
                    data-testid="input-overlap-length"
                  />
                  <p className="text-xs text-muted-foreground opacity-60">
                    Overlapping words between chunks (0-500). Default: 50
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6 md:pt-8">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                size="lg"
                className="rounded-full px-8 py-4 md:px-10 md:py-5 text-base md:text-lg font-medium"
                data-testid="button-generate-summary"
              >
                {loading ? "Processing..." : "Generate Summary"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
