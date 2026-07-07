import { TokenTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document as LangChainDocument } from 'langchain/document';
import { ChromaClient } from 'chromadb';
import Document from '../models/Document.js';
import ChatHistory from '../models/ChatHistory.js';

// Setup Chroma Client
const chromaUrl = process.env.CHROMADB_URL || 'http://localhost:8000';
const collectionName = 'supportgpt';

const getChromaClient = () => {
  return new ChromaClient({ path: chromaUrl });
};

/**
 * Split text into chunks, generate embeddings via OpenAI, and store in ChromaDB.
 * @param {object} mongooseDoc Mongoose Document record
 * @param {string} userId Owner user ID
 */
export const indexDocument = async (mongooseDoc, userId) => {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OpenAI API Key is not configured. Please set OPENAI_API_KEY in the server env.');
    }

    if (!mongooseDoc.content || mongooseDoc.content.trim() === '') {
      throw new Error('Document content is empty; nothing to index.');
    }

    // 1. Initialize text splitter
    const splitter = new TokenTextSplitter({
      encodingName: 'gpt2',
      chunkSize: 500,
      chunkOverlap: 100,
    });

    // 2. Generate chunks
    const chunks = await splitter.splitText(mongooseDoc.content);
    console.log(`[SupportGPT RAG] Chunked "${mongooseDoc.originalName}" into ${chunks.length} nodes.`);

    if (chunks.length === 0) {
      throw new Error('Failed to split document into valid tokens.');
    }

    // 3. Map to LangChain Document instances
    const documents = chunks.map((chunk, index) => {
      return new LangChainDocument({
        pageContent: chunk,
        metadata: {
          documentId: mongooseDoc._id.toString(),
          originalName: mongooseDoc.originalName,
          user: userId.toString(),
          chunkIndex: index,
        },
      });
    });

    // 4. Initialize embeddings and save to vector store
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    await Chroma.fromDocuments(documents, embeddings, {
      collectionName: collectionName,
      url: chromaUrl,
    });

    // 5. Update MongoDB metadata status
    mongooseDoc.status = 'indexed';
    await mongooseDoc.save();

    console.log(`[SupportGPT RAG] Document "${mongooseDoc.originalName}" indexed successfully in ChromaDB vector store.`);
    return { success: true, chunksCount: chunks.length };
  } catch (error) {
    console.error(`[SupportGPT RAG Error] Indexing failed for document: ${mongooseDoc.originalName}`, error);
    mongooseDoc.status = 'failed';
    await mongooseDoc.save();
    throw error;
  }
};

/**
 * Remove document embeddings from ChromaDB collection.
 * @param {string} docId Document ID
 */
export const deleteDocumentEmbeddings = async (docId) => {
  try {
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({ name: collectionName });

    // Delete vectors matching documentId metadata filter
    await collection.delete({
      where: { documentId: docId.toString() },
    });

    console.log(`[SupportGPT RAG] Removed all vector store embeddings for document ID: ${docId}`);
    return { success: true };
  } catch (error) {
    console.error(`[SupportGPT RAG Error] Failed to delete embeddings for document: ${docId}`, error);
    throw error;
  }
};

/**
 * Fetch knowledge base vector collection details
 * @param {string} userId Filter stats by user ID
 */
export const getVectorStoreStats = async (userId) => {
  try {
    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({ name: collectionName });
    const count = await collection.count();

    // Query documents inside MongoDB
    const docsIndexed = await Document.countDocuments({ user: userId, status: 'indexed' });
    const docsTotal = await Document.countDocuments({ user: userId });

    return {
      status: 'connected',
      collectionName: collectionName,
      vectorCount: count,
      documentsIndexed: docsIndexed,
      documentsTotal: docsTotal,
    };
  } catch (error) {
    console.warn('[SupportGPT RAG Warning] ChromaDB vector store disconnected:', error.message);
    const docsTotal = await Document.countDocuments({ user: userId });
    return {
      status: 'disconnected',
      error: error.message,
      vectorCount: 0,
      documentsIndexed: 0,
      documentsTotal: docsTotal,
    };
  }
};

/**
 * Query ChromaDB for top 5 context chunks, execute completion with OpenAI, and return concise answers
 * @param {string} question User question
 * @param {string} userId Owner user ID
 * @param {object} options Options like temperature and modelName
 * @returns {Promise<object>} response object containing answer, sources, and confidence score
 */
export const queryKnowledgeBase = async (question, userId, options = {}) => {
  const temperature = options.temperature !== undefined ? Number(options.temperature) : 0;
  const modelName = options.modelName || 'gpt-4o-mini';

  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OpenAI API Key is not configured in environment variables.');
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: collectionName,
      url: chromaUrl,
    });

    // 1. Retrieve Top 5 relevant chunks filtered by user owner
    const results = await vectorStore.similaritySearchWithScore(question, 5, {
      user: userId.toString(),
    });

    if (results.length === 0) {
      return {
        answer: "I don't know based on the uploaded knowledge.",
        sources: [],
        confidence: 0,
      };
    }

    // 2. Map distance metric to confidence percentage
    // In ChromaDB cosine distance range is 0 to 2. Let's compute a standard similarity score.
    const bestDistance = results[0][1];
    const confidence = Math.max(0, Math.min(100, Math.round((1 - bestDistance) * 100)));

    // If similarity distance indicates completely irrelevant results, return fallback early
    if (bestDistance > 0.85) {
      return {
        answer: "I don't know based on the uploaded knowledge.",
        sources: [],
        confidence: 0,
      };
    }

    // Compile contexts and list unique source document names
    const contexts = results.map(([doc]) => doc.pageContent).join('\n\n');

    // Create rich citations list
    const citations = results.map(([doc, distance]) => {
      const score = Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
      return {
        documentName: doc.metadata.originalName || 'Unknown Document',
        chunkNumber: doc.metadata.chunkIndex !== undefined ? doc.metadata.chunkIndex + 1 : 1, // 1-indexed for visual output
        similarityScore: score,
        confidenceScore: score,
        text: doc.pageContent,
      };
    });

    // 3. Retrieve past session memory logs to feed context to the model
    const sessionId = options.sessionId;
    let pastTurns = [];
    if (sessionId) {
      pastTurns = await ChatHistory.find({ user: userId, sessionId })
        .sort({ createdAt: 1 })
        .limit(5);
    }

    // 4. Initialize OpenAI Chat model
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: modelName,
      temperature: temperature,
    });

    const systemPrompt = `You are SupportGPT, an AI Customer Support Assistant.
Answer the user's question STRICTLY based on the provided document contexts and the conversation history.
If the answer cannot be found in the contexts, reply EXACTLY with: "I don't know based on the uploaded knowledge."
Do not make up any information, do not use external resources, and do not hallucinate.

Contexts:
${contexts}`;

    // Compile thread messages including history
    const messages = [
      new SystemMessage(systemPrompt),
    ];

    for (const turn of pastTurns) {
      messages.push(new HumanMessage(turn.question));
      messages.push(new AIMessage(turn.answer));
    }

    messages.push(new HumanMessage(question));

    const response = await model.invoke(messages);

    let answer = response.content || response.text || '';
    if (typeof answer !== 'string') {
      answer = JSON.stringify(answer);
    }
    answer = answer.trim();

    // Secondary strict validation guard
    const cleanAnswer = answer.toLowerCase();
    if (
      cleanAnswer.includes("don't know") ||
      cleanAnswer.includes("do not know") ||
      cleanAnswer.includes("no information") ||
      cleanAnswer.includes("cannot be found") ||
      cleanAnswer === ''
    ) {
      answer = "I don't know based on the uploaded knowledge.";
    }

    // 5. Store conversation turn in ChatHistory collection in MongoDB
    if (sessionId) {
      await ChatHistory.create({
        user: userId,
        question,
        answer,
        sessionId,
      });
    }

    return {
      answer,
      sources: answer === "I don't know based on the uploaded knowledge." ? [] : citations,
      confidence: answer === "I don't know based on the uploaded knowledge." ? 0 : confidence,
    };
  } catch (error) {
    console.error('[SupportGPT RAG Query Error]', error);
    throw error;
  }
};
