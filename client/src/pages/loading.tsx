import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const MESSAGES = [
  "Analyzing your document...",
  "Processing chunks...",
  "Generating summary...",
  "Almost there...",
  "Finalizing results...",
];

export default function Loading() {
  const [, setLocation] = useLocation();
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if we have a job
    const job = sessionStorage.getItem("summaryJob");
    if (!job) {
      setLocation("/");
      return;
    }

    // Rotate messages every 2.5 seconds
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);

    // Start processing
    const processFile = async () => {
      try {
        const jobData = JSON.parse(job);

        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: jobData.fileContent,
            fileName: jobData.fileName,
            fileType: jobData.fileType || 'txt',
            isBase64: jobData.isBase64 || false,
            chunkLength: jobData.chunkLength,
            overlapLength: jobData.overlapLength,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to generate summary");
        }

        const summary = await response.json();
        sessionStorage.setItem("summaryResult", JSON.stringify(summary));
        sessionStorage.removeItem("summaryJob");
        setLocation("/summary");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to process file";
        setError(message);
        setTimeout(() => setLocation("/"), 3000);
      }
    };

    processFile();

    return () => clearInterval(interval);
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-8 md:gap-12 px-6">
        {/* Spinner */}
        <div className="relative w-20 h-20 md:w-24 md:h-24">
          <div
            className="absolute inset-0 border-4 border-border rounded-full"
            data-testid="loading-spinner-bg"
          />
          <div
            className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"
            style={{ animationDuration: "2s" }}
            data-testid="loading-spinner"
          />
        </div>

        {/* Dynamic Message */}
        <div className="text-center space-y-2">
          <p
            key={messageIndex}
            className="text-2xl md:text-3xl font-medium tracking-tight animate-fade-in"
            data-testid="loading-message"
          >
            {MESSAGES[messageIndex]}
          </p>
          <p className="text-sm text-muted-foreground opacity-60">
            This may take a moment...
          </p>
        </div>
      </div>

      {/* Fade animation */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
