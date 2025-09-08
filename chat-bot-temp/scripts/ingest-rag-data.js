const fs = require('fs').promises;
const path = require('path');
const ragService = require('../src/services/ragService');
const logger = require('../src/utils/logger');

const DOCS_PATH = '/app/data/medical-docs';

// Simple text chunking function
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = i + chunkSize;
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
  }
  return chunks;
}

async function ingestData() {
  logger.info('Starting data ingestion process for RAG...');

  try {
    await ragService.initialize();

    const files = await fs.readdir(DOCS_PATH);
    logger.info(`Found ${files.length} files in ${DOCS_PATH}`);

    for (const file of files) {
      if (path.extname(file) !== '.txt') {
        logger.warn(`Skipping non-txt file: ${file}`);
        continue;
      }

      const filePath = path.join(DOCS_PATH, file);
      logger.info(`Processing file: ${file}`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const chunks = chunkText(content);
      
      const documents = chunks.map(chunk => ({
        content: chunk,
        source: file,
      }));

      await ragService.addDocuments(documents);
      logger.info(`Ingested ${chunks.length} chunks from ${file}`);
    }

    logger.info('Data ingestion process completed successfully.');

  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.error(`Directory not found: ${DOCS_PATH}`);
      logger.error('Please create the directory and add medical .txt files to it.');
    } else {
      logger.error('An error occurred during data ingestion:', error);
    }
    // process.exit(1); // Don't exit the main process
    throw error; // Re-throw the error to be caught by the caller
  }
}

// Create a dummy data directory and file if it doesn't exist
async function setupDummyData() {
    try {
        await fs.mkdir(DOCS_PATH, { recursive: true });
        const dummyFilePath = path.join(DOCS_PATH, 'dummy-medical-doc.txt');
        const fileExists = await fs.access(dummyFilePath).then(() => true).catch(() => false);
        if (!fileExists) {
            const dummyContent = 'Cardiovascular disease generally refers to conditions that involve narrowed or blocked blood vessels that can lead to a heart attack, chest pain (angina) or stroke. Other heart conditions, such as those that affect your heart\'s muscle, valves or rhythm, also are considered forms of heart disease.';
            await fs.writeFile(dummyFilePath, dummyContent);
            logger.info('Created dummy data file for ingestion.');
        } else {
            logger.info('Dummy data file already exists.');
        }
    } catch (error) {
        logger.error('Failed to create dummy data:', error);
    }
}

module.exports = { ingestData, setupDummyData };