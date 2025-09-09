import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_chroma import Chroma

# --- Configuration ---
KNOWLEDGE_BASE_PATH = "knowledge_base"
CHROMA_DB_PATH = "chroma_db"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2" # Example model, can be changed
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 100

def load_documents(knowledge_base_path: str = KNOWLEDGE_BASE_PATH):
    """
    Loads documents from the specified knowledge base directory.
    Supports PDF files.
    """
    documents = []
    for filename in os.listdir(knowledge_base_path):
        file_path = os.path.join(knowledge_base_path, filename)
        if filename.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
            documents.extend(loader.load())
    return documents

def split_documents(documents, chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP):
    """
    Splits documents into smaller chunks.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        is_separator_regex=False,
    )
    return text_splitter.split_documents(documents)

def create_embeddings(model_name: str = EMBEDDING_MODEL_NAME):
    """
    Creates an embedding function using SentenceTransformer.
    """
    return SentenceTransformerEmbeddings(model_name=model_name)

def store_embeddings(documents, embedding_function, persist_directory: str = CHROMA_DB_PATH):
    """
    Stores document chunks and their embeddings in a ChromaDB vector store.
    """
    # Create the Chroma vector store and persist it to disk
    db = Chroma.from_documents(
        documents=documents,
        embedding=embedding_function,
        persist_directory=persist_directory
    )
    # Persist the database to disk
    db.persist()
    return db

def ingest_data():
    """
    Main function to run the data ingestion pipeline.
    """
    print("Loading documents...")
    documents = load_documents()
    if not documents:
        print("No documents found in the knowledge base.")
        return

    print(f"Loaded {len(documents)} document(s).")
    
    print("Splitting documents into chunks...")
    chunks = split_documents(documents)
    print(f"Created {len(chunks)} chunk(s).")
    
    print("Creating embeddings...")
    embedding_function = create_embeddings()
    
    print("Storing embeddings in ChromaDB...")
    db = store_embeddings(chunks, embedding_function)
    print("Data ingestion completed successfully!")
    return db

if __name__ == "__main__":
    ingest_data()