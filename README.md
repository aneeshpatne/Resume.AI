# Resume.AI

A chatbot system that uses Retrieval-Augmented Generation (RAG) and various language models to create an interactive resume experience.

## Overview

Resume.AI is an intelligent chatbot that provides accurate, contextual responses about professional experience by combining:

- GROQ, OpenRouter, Ollama, and DeepSeek R1.
- RAG (Retrieval-Augmented Generation) for grounding responses in actual resume data.
- Natural language processing for human-like interactions.
- ChromaDB for vector database management.

## Features

- Interactive Q&A about professional experience.
- Context-aware responses using RAG.
- Accurate information retrieval from resume data.
- Natural conversational interface.
- Support for diverse professional queries.

## Demo

<img src="assets/image.png" alt="Resume AI Demo" width="100%" height="400">
<img src="assets/demo.gif" alt="Demo GIF" width="100%" height="400">

_Interactive chat interface demonstrating Resume.AI capabilities_

## Project Structure

```
.
├── Chat/                         # Main chat implementation
│   └── Vector Database/         # Vector DB for RAG
├── Extraction and Upserting/    # Data processing scripts
│   ├── extraction.ipynb
│   └── conversion.ipynb
├── Deprecated Attempts/         # Previous attempts and experiments
├── server/                      # Server-side code
│   ├── chroma_db/               # ChromaDB related files
│   └── server.py                # Main server script
└── README.md
```

## Setup and Installation

1. Clone the repository

   ```bash
   git clone https://github.com/username/Resume.AI.git
   ```

2. Install dependencies

   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables in `.env`

4. Run the chat interface

   ```bash
   python chat/main.py
   ```

## Data Preparation

Training data includes prompt-response pairs covering:

- Work history and experience.
- Technical skills and competencies.
- Educational background.
- Project details and achievements.
- Professional certifications.

## Development

- Uses GROQ, OpenRouter, Ollama, and DeepSeek R1.
- Implements RAG for retrieval-augmented generation.
- Indexes resume content in ChromaDB.
- Processes natural language queries.

## Usage

1. Ensure all dependencies are installed and environment variables are configured.
2. Start the server:

   ```bash
   python server/server.py
   ```

3. Access the chat interface through your browser or preferred client.
