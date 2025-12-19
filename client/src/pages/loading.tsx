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

    return () => clearInterval(interval);
  }, [setLocation]);

  useEffect(() => {
    // Simulate processing time (in real app, poll server for completion)
    const timer = setTimeout(() => {
      // Store the summary (in real app, fetch from server)
      const job = sessionStorage.getItem("summaryJob");
      if (job) {
        const jobData = JSON.parse(job);
        // Generate a mock summary for now
        const mockSummary = jobData.content.substring(0, 500) + "...";

        sessionStorage.setItem(
          "summaryResult",
          JSON.stringify({
            ...jobData,
            summaryText: mockSummary,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          })
        );
      }

      setLocation("/summary");
    }, 5000); // 5 second processing time for demo

    return () => clearTimeout(timer);
  }, [setLocation]);

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
