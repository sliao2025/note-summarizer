"""
Modal deployment for Note Summarizer ML Backend.

This file defines a Modal app that handles text summarization using the BART model.
Deploy with: modal deploy modal_backend/app.py
"""

import modal
import re

# Define the Modal image with all required dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "flask",
        "transformers",
        "torch",
        "nltk",
        "PyPDF2",
        "python-docx",
    )
    .run_commands("python -c \"import nltk; nltk.download('punkt'); nltk.download('punkt_tab')\"")
)

app = modal.App("note-summarizer", image=image)


@app.cls(
    gpu="T4",  # Use T4 GPU for efficient inference
    container_idle_timeout=300,  # Keep warm for 5 minutes
    allow_concurrent_inputs=10,  # Allow concurrent requests
)
class Summarizer:
    @modal.enter()
    def setup(self):
        """Load the model when container starts - this caches the model."""
        from transformers import pipeline
        import nltk
        
        print("Loading BART-large-CNN model...")
        self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn", device=0)
        print("Model loaded successfully!")
        
        # Ensure NLTK data is available
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt', quiet=True)
        try:
            nltk.data.find('tokenizers/punkt_tab')
        except LookupError:
            nltk.download('punkt_tab', quiet=True)

    def _get_overlap_sentences(self, sentences: list, overlap: int) -> list:
        """Get overlap sentences from the end of current chunk."""
        overlap_chunk = []
        count = 0
        for sentence in reversed(sentences):
            sentence_words = len(sentence.split(" "))
            if count + sentence_words > overlap:
                break
            overlap_chunk.insert(0, sentence)
            count += sentence_words
        return overlap_chunk

    def _chunk_by_sentences(self, text: str, length: int = 600, overlap: int = 50) -> list:
        """Split text into chunks by sentences with overlap."""
        from nltk.tokenize import sent_tokenize
        
        sentences = sent_tokenize(text)
        chunks = []
        current_chunk = []
        word_count = 0

        for sentence in sentences:
            sentence_words = len(sentence.split(" "))
            
            if word_count + sentence_words > length:
                chunks.append(" ".join(current_chunk))
                current_chunk = self._get_overlap_sentences(current_chunk, overlap)
                word_count = sum(len(s.split()) for s in current_chunk)

            current_chunk.append(sentence)
            word_count += sentence_words

        if len(current_chunk) != 0:
            chunks.append(" ".join(current_chunk))

        return chunks

    @modal.method()
    def summarize(self, content: str, chunk_length: int = 500, overlap_length: int = 50) -> dict:
        """Summarize the provided text content."""
        # Clean text
        text = re.sub(r'\s+', ' ', content).strip()
        word_count = len(text.split(" "))

        if word_count > 2000:
            return {
                "error": f"Document exceeds 2000 words ({word_count} words)",
                "success": False
            }

        # Get chunks
        chunks = self._chunk_by_sentences(text, chunk_length, overlap_length)
        
        # Summarize each chunk
        summary_parts = []
        
        for chunk in chunks:
            # Ensure chunk is long enough for summarization (min 50 tokens)
            if len(chunk.split()) > 50:
                try:
                    result = self.summarizer(chunk, max_length=150, min_length=30, do_sample=False)
                    summary_parts.append(result[0]["summary_text"])
                except Exception as e:
                    print(f"Error summarizing chunk: {e}")
                    summary_parts.append(chunk[:200])
            else:
                summary_parts.append(chunk)
        
        summary = " ".join(summary_parts)
        
        return {
            "summary": summary,
            "wordCount": word_count,
            "chunkCount": len(chunks),
            "success": True
        }


@app.function()
@modal.web_endpoint(method="POST")
def summarize_endpoint(request: dict) -> dict:
    """
    Web endpoint for summarization.
    
    Expects JSON body with:
    - content: str - The text to summarize
    - chunkLength: int (optional, default 500) - Words per chunk
    - overlapLength: int (optional, default 50) - Overlap between chunks
    
    Returns:
    - summary: str - The generated summary
    - wordCount: int - Original word count
    - chunkCount: int - Number of chunks processed
    """
    content = request.get("content", "")
    chunk_length = request.get("chunkLength", 500)
    overlap_length = request.get("overlapLength", 50)
    
    if not content:
        return {"error": "No content provided", "success": False}
    
    summarizer = Summarizer()
    return summarizer.summarize.remote(content, chunk_length, overlap_length)


# For local testing
@app.local_entrypoint()
def main():
    """Test the summarizer locally."""
    test_text = """
    Climate change is one of the most pressing issues of our time. The scientific consensus 
    is clear: human activities, particularly the burning of fossil fuels, are causing global 
    temperatures to rise at an unprecedented rate. This warming has far-reaching consequences, 
    including more frequent and severe weather events, rising sea levels, and disruptions to 
    ecosystems around the world.
    
    The impacts of climate change are already being felt in communities across the globe. 
    Coastal cities face increasing flood risks, agricultural regions struggle with changing 
    precipitation patterns, and wildlife populations are shifting their ranges in response 
    to warming temperatures. These changes disproportionately affect vulnerable populations 
    who have contributed least to the problem.
    """
    
    summarizer = Summarizer()
    result = summarizer.summarize.remote(test_text, 500, 50)
    print(f"Summary: {result.get('summary', 'No summary generated')}")
    print(f"Word Count: {result.get('wordCount', 0)}")
    print(f"Chunks: {result.get('chunkCount', 0)}")
