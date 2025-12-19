#!/usr/bin/env python3
import os
import re
import io
from flask import Flask, request, jsonify
from nltk.tokenize import sent_tokenize
import nltk

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab', quiet=True)

# Lazy load transformers to minimize startup time
summarizer = None

def get_summarizer():
    global summarizer
    if summarizer is None:
        print("Loading summarization model...")
        from transformers import pipeline
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        print("Model loaded!")
    return summarizer

app = Flask(__name__)

def get_overlap_sentences(sentences, overlap):
    """Get overlap sentences from the end of current chunk"""
    overlap_chunk = []
    count = 0
    for sentence in reversed(sentences):
        sentence_words = len(sentence.split(" "))
        if count + sentence_words > overlap:
            break
        overlap_chunk.insert(0, sentence)
        count += sentence_words
    return overlap_chunk

def chunk_by_sentences(text, length=600, overlap=50):
    """Split text into chunks by sentences with overlap"""
    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = []
    word_count = 0

    for sentence in sentences:
        sentence_words = len(sentence.split(" "))
        
        if word_count + sentence_words > length:
            chunks.append(" ".join(current_chunk))
            current_chunk = get_overlap_sentences(current_chunk, overlap)
            word_count = sum(len(s.split()) for s in current_chunk)

        current_chunk.append(sentence)
        word_count += sentence_words

    if len(current_chunk) != 0:
        chunks.append(" ".join(current_chunk))

    return chunks

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/summarize', methods=['POST'])
def summarize():
    try:
        data = request.json
        content = data.get('content', '')
        chunk_length = data.get('chunkLength', 500)
        overlap_length = data.get('overlapLength', 50)

        if not content:
            return jsonify({"error": "No content provided"}), 400

        # Clean text
        text = re.sub(r'\s+', ' ', content).strip()
        word_count = len(text.split(" "))

        if word_count > 2000:
            return jsonify({
                "error": f"Document exceeds 2000 words ({word_count} words)"
            }), 400

        # Get chunks
        chunks = chunk_by_sentences(text, chunk_length, overlap_length)
        
        # Summarize each chunk
        summarizer = get_summarizer()
        summary_parts = []
        
        for chunk in chunks:
            # Ensure chunk is long enough for summarization (min 50 tokens)
            if len(chunk.split()) > 50:
                try:
                    result = summarizer(chunk, max_length=150, min_length=30, do_sample=False)
                    summary_parts.append(result[0]["summary_text"])
                except Exception as e:
                    print(f"Error summarizing chunk: {e}")
                    summary_parts.append(chunk[:200])
            else:
                summary_parts.append(chunk)
        
        summary = " ".join(summary_parts)
        
        return jsonify({
            "summary": summary,
            "wordCount": word_count,
            "chunkCount": len(chunks)
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
