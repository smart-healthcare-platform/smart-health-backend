const { ChromaClient } = require('chromadb');
const logger = require('../utils/logger');

class RagService {
  constructor() {
    this.client = new ChromaClient({ path: 'http://chromadb:8000' });
    this.collection = null;
    this.collectionName = 'medical_documents';
  }

  async initialize() {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        // Embedding function can be configured here if needed
      });
      logger.info(`ChromaDB collection '${this.collectionName}' is ready.`);
    } catch (error) {
      logger.error('Failed to initialize ChromaDB collection:', error);
      throw error;
    }
  }

  async query(question, topN = 3) {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      // In a real implementation, the question would be converted to an embedding
      // using the same model as the ingested documents.
      // For this MVP, we assume the client handles embedding or we use a simplified search.
      // Here, we'll simulate a query by text, though ChromaDB primarily works with vectors.
      const results = await this.collection.query({
        queryTexts: [question],
        nResults: topN,
      });

      logger.debug(`RAG query for "${question}" returned ${results.documents[0].length} results.`);
      return results.documents[0]; // Return the documents for the first query
    } catch (error) {
      logger.error('Failed to query ChromaDB:', { error: error.message });
      return []; // Return empty array on failure
    }
  }

  // This method would be used by an ingestion script
  async addDocuments(documents) {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      const ids = documents.map((_, i) => `doc_${Date.now()}_${i}`);
      const metadatas = documents.map(doc => ({ source: doc.source }));
      const contents = documents.map(doc => doc.content);

      await this.collection.add({
        ids: ids,
        metadatas: metadatas,
        documents: contents,
      });

      logger.info(`Successfully added ${documents.length} documents to ChromaDB.`);
    } catch (error) {
      logger.error('Failed to add documents to ChromaDB:', error);
      throw error;
    }
  }
}

const ragServiceInstance = new RagService();
module.exports = ragServiceInstance;