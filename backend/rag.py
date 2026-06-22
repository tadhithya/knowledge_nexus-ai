import os
import chromadb
from pypdf import PdfReader
import google.generativeai as genai

CHROMA_DATA_PATH = "./chroma_data"
EMBEDDING_MODEL = "models/text-embedding-004"

# Initialize ChromaDB client
client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)

# Get or create a collection
collection = client.get_or_create_collection(name="knowledge_base")

def get_embedding(text: str):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document"
    )
    return result["embedding"]

def add_document(file_path: str, filename: str):
    """Reads a file, chunks it, and adds it to ChromaDB."""
    text = ""
    if filename.endswith(".pdf"):
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    else:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()

    if not text.strip():
        raise ValueError("Document is empty or could not be read.")

    # Simple chunking by paragraphs or 1000 characters
    chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
    
    for i, chunk in enumerate(chunks):
        if not chunk.strip():
            continue
        embedding = get_embedding(chunk)
        doc_id = f"{filename}_chunk_{i}"
        
        collection.upsert(
            documents=[chunk],
            embeddings=[embedding],
            metadatas=[{"source": filename}],
            ids=[doc_id]
        )
    return len(chunks)

def query_knowledge_base(query: str) -> str:
    """
    Search the private knowledge base for documents uploaded by the user.
    Use this when the user asks about their uploaded files, PDFs, or private data.
    """
    print(f"[Tool] Querying knowledge base for: {query}")
    try:
        query_embedding = get_embedding(query)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=3
        )
        
        if not results["documents"] or not results["documents"][0]:
            return "No relevant documents found in the knowledge base."
            
        formatted_results = []
        for i, doc in enumerate(results["documents"][0]):
            metadata = results["metadatas"][0][i]
            formatted_results.append(f"Source: {metadata['source']}\nExcerpt: {doc}")
            
        return "\n\n---\n\n".join(formatted_results)
    except Exception as e:
        print(f"[Tool Error] {e}")
        return f"Error querying knowledge base: {str(e)}"
