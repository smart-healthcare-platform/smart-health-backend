import os
import chromadb
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

# --- Configuration ---
KNOWLEDGE_BASE_PATH = "knowledge_base"
CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", 8000))
COLLECTION_NAME = "healthsmart_rag"
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
    return HuggingFaceEmbeddings(model_name=model_name, model_kwargs={'device': 'cpu'})

def store_embeddings(documents, embedding_function):
    """
    Stores document chunks and their embeddings in a ChromaDB vector store.
    """
    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    
    # Create the Chroma vector store
    db = Chroma.from_documents(
        documents=documents,
        embedding=embedding_function,
        client=client,
        collection_name=COLLECTION_NAME
    )
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

def get_retriever(model_name: str = EMBEDDING_MODEL_NAME, k: int = 3):
    """
    Creates a retriever for querying the vector database.
    """
    embedding_function = create_embeddings(model_name)
    client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    
    db = Chroma(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding_function=embedding_function,
    )
    
    return db.as_retriever(search_kwargs={"k": k})

def query_rag(query: str, k: int = 3):
    """
    Queries the RAG pipeline for a given query.
    Returns the content of the most relevant documents.
    """
    print(f"Querying RAG for: '{query}'")
    retriever = get_retriever(k=k)
    docs = retriever.invoke(query)
    print(f"Found {len(docs)} relevant documents.")
    return [doc.page_content for doc in docs]

if __name__ == "__main__":
    ingest_data()