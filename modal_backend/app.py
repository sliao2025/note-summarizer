"""
Modal deployment for Note Summarizer ML Backend.

This file defines a Modal app that handles text summarization using the BART model.
Deploy with: modal deploy modal_backend/app.py
"""

import modal
import re
import base64
import io

# Define the Modal image with all required dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "flask",
        "fastapi",
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

    def _extract_text_from_pdf(self, content_bytes: bytes) -> str:
        """Extract text from PDF bytes."""
        from PyPDF2 import PdfReader
        
        try:
            pdf_file = io.BytesIO(content_bytes)
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + " "
            return text.strip()
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

    def _extract_text_from_docx(self, content_bytes: bytes) -> str:
        """Extract text from DOCX bytes."""
        from docx import Document
        
        try:
            docx_file = io.BytesIO(content_bytes)
            document = Document(docx_file)
            text = ""
            for paragraph in document.paragraphs:
                text += paragraph.text + " "
            return text.strip()
        except Exception as e:
            print(f"Error extracting DOCX text: {e}")
            raise ValueError(f"Failed to extract text from DOCX: {str(e)}")

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
    def summarize(
        self, 
        content: str, 
        file_type: str = "txt",
        is_base64: bool = False,
        chunk_length: int = 500, 
        overlap_length: int = 50
    ) -> dict:
        """Summarize the provided content."""
        try:
            # Extract text based on file type
            if is_base64 and file_type in ['pdf', 'docx']:
                # Decode base64 content
                content_bytes = base64.b64decode(content)
                
                if file_type == 'pdf':
                    text = self._extract_text_from_pdf(content_bytes)
                elif file_type == 'docx':
                    text = self._extract_text_from_docx(content_bytes)
                else:
                    text = content
            else:
                # Plain text content
                text = content
            
            # Clean text
            text = re.sub(r'\s+', ' ', text).strip()
            word_count = len(text.split(" "))
            
            print(f"Extracted {word_count} words from {file_type} file")

            if word_count > 10000:
                return {
                    "error": f"Document exceeds 10000 words ({word_count} words)",
                    "success": False
                }
            
            if word_count < 10:
                return {
                    "error": "Document is too short to summarize (less than 10 words)",
                    "success": False
                }

            # Get chunks
            chunks = self._chunk_by_sentences(text, chunk_length, overlap_length)
            
            print(f"Created {len(chunks)} chunks")
            
            # Summarize each chunk
            summary_parts = []
            
            for i, chunk in enumerate(chunks):
                # Ensure chunk is long enough for summarization (min 30 words)
                chunk_words = len(chunk.split())
                if chunk_words > 30:
                    try:
                        # Adjust max_length based on chunk size
                        max_len = min(150, max(50, chunk_words // 3))
                        min_len = min(30, max_len - 10)
                        
                        result = self.summarizer(
                            chunk, 
                            max_length=max_len, 
                            min_length=min_len, 
                            do_sample=False
                        )
                        summary_parts.append(result[0]["summary_text"])
                        print(f"Summarized chunk {i+1}/{len(chunks)}")
                    except Exception as e:
                        print(f"Error summarizing chunk {i}: {e}")
                        # Use first part of chunk as fallback
                        summary_parts.append(chunk[:200] + "...")
                else:
                    # Chunk too short, include as-is
                    summary_parts.append(chunk)
            
            summary = " ".join(summary_parts)
            
            return {
                "summary": summary,
                "wordCount": word_count,
                "chunkCount": len(chunks),
                "success": True
            }
            
        except ValueError as e:
            return {
                "error": str(e),
                "success": False
            }
        except Exception as e:
            print(f"Error in summarize: {e}")
            return {
                "error": f"Summarization failed: {str(e)}",
                "success": False
            }


@app.function()
@modal.web_endpoint(method="POST")
def summarize_endpoint(request: dict) -> dict:
    """
    Web endpoint for summarization.
    
    Expects JSON body with:
    - content: str - The text content or base64-encoded file
    - fileType: str (optional, default 'txt') - File type: 'txt', 'pdf', or 'docx'
    - isBase64: bool (optional, default False) - Whether content is base64-encoded
    - chunkLength: int (optional, default 500) - Words per chunk
    - overlapLength: int (optional, default 50) - Overlap between chunks
    
    Returns:
    - summary: str - The generated summary
    - wordCount: int - Original word count
    - chunkCount: int - Number of chunks processed
    """
    content = request.get("content", "")
    file_type = request.get("fileType", "txt")
    is_base64 = request.get("isBase64", False)
    chunk_length = request.get("chunkLength", 500)
    overlap_length = request.get("overlapLength", 50)
    
    if not content:
        return {"error": "No content provided", "success": False}
    
    summarizer = Summarizer()
    return summarizer.summarize.remote(
        content, 
        file_type, 
        is_base64, 
        chunk_length, 
        overlap_length
    )


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
    result = summarizer.summarize.remote(test_text, "txt", False, 500, 50)
    print(f"Summary: {result.get('summary', 'No summary generated')}")
    print(f"Word Count: {result.get('wordCount', 0)}")
    print(f"Chunks: {result.get('chunkCount', 0)}")
