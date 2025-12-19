import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Download } from "lucide-react";

interface SummaryData {
  id: string;
  fileName: string;
  originalWordCount: number;
  summaryText: string;
  chunkLength: number;
  overlapLength: number;
  createdAt: string;
}

export default function Summary() {
  const [, setLocation] = useLocation();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const result = sessionStorage.getItem("summaryResult");
    if (!result) {
      setLocation("/");
      return;
    }

    setSummary(JSON.parse(result));
  }, [setLocation]);

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary.summaryText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!summary) return;

    const content = `Summary: ${summary.fileName}
Original Word Count: ${summary.originalWordCount}
Generated: ${new Date(summary.createdAt).toLocaleString()}

${summary.summaryText}`;

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(content)
    );
    element.setAttribute("download", `${summary.fileName}.summary.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleNewSummary = () => {
    sessionStorage.removeItem("summaryJob");
    sessionStorage.removeItem("summaryResult");
    setLocation("/");
  };

  if (!summary) {
    return null;
  }

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
      <main className="max-w-4xl mx-auto px-6 md:px-8 py-12 md:py-16">
        {/* Back Button */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header Section */}
        <div className="space-y-2 md:space-y-3 mb-12">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight">
            Your Summary
          </h2>
          <div className="text-sm text-muted-foreground opacity-60 space-y-1">
            <p>File: {summary.fileName}</p>
            <p>
              Original: {summary.originalWordCount.toLocaleString()} words •
              Generated:{" "}
              {new Date(summary.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Summary Content */}
        <div
          className="bg-card border border-card-border rounded-2xl p-8 md:p-12 mb-12"
          data-testid="summary-content"
        >
          <div
            className="text-lg leading-relaxed space-y-6 text-foreground whitespace-pre-wrap break-words prose prose-invert max-w-none"
            style={{
              fontFamily: "inherit",
              fontSize: "inherit",
              lineHeight: "inherit",
            }}
          >
            {summary.summaryText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="rounded-full px-6 py-3 md:px-8 md:py-4"
            data-testid="button-copy"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copySuccess ? "Copied!" : "Copy to Clipboard"}
          </Button>

          <Button
            onClick={handleDownload}
            variant="outline"
            className="rounded-full px-6 py-3 md:px-8 md:py-4"
            data-testid="button-download"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>

          <Button
            onClick={handleNewSummary}
            className="rounded-full px-6 py-3 md:px-8 md:py-4"
            data-testid="button-new-summary"
          >
            Summarize Another
          </Button>
        </div>
      </main>
    </div>
  );
}
