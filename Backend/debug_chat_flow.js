require('dotenv').config();
const mongoose = require('mongoose');
const vectorSearchService = require('./src/services/vectorSearchService');
const promptService = require('./src/services/promptService');
const llmService = require('./src/services/llmService');

async function debugChatFlow() {
  try {
    console.log('🔍 DEBUGGING CHAT FLOW');
    console.log('=======================');

    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
    });
    
    console.log('✅ Database connected');

    // Test query
    const testQuery = "What is the leave policy?";
    console.log(`\n📝 Test Query: "${testQuery}"`);

    // Step 1: Vector Search
    console.log('\n1️⃣ Testing Vector Search...');
    const relevantChunks = await vectorSearchService.search(testQuery, {
      limit: 10,
      minScore: 0.02
    });
    
    console.log(`✅ Found ${relevantChunks.length} chunks`);
    if (relevantChunks.length > 0) {
      console.log('Top chunks:');
      relevantChunks.slice(0, 3).forEach((chunk, i) => {
        console.log(`${i + 1}. ${chunk.fileName} - Score: ${chunk.relevanceScore.toFixed(4)}`);
        console.log(`   Preview: "${chunk.content.substring(0, 100)}..."`);
      });
    }

    // Step 2: Prompt Creation
    console.log('\n2️⃣ Testing Prompt Creation...');
    const promptData = promptService.createChatPrompt(relevantChunks, testQuery, {
      sessionId: 'test-session',
      previousMessages: []
    });
    
    console.log(`✅ Prompt created - Has context: ${promptData.hasContext}`);
    console.log(`System prompt length: ${promptData.systemPrompt.length} chars`);
    console.log(`User prompt length: ${promptData.userPrompt.length} chars`);
    console.log(`User prompt preview: "${promptData.userPrompt.substring(0, 200)}..."`);

    // Step 3: LLM Response Generation
    console.log('\n3️⃣ Testing LLM Response Generation...');
    try {
      const stream = llmService.generateStreamingResponse(
        promptData.systemPrompt,
        promptData.userPrompt
      );
      
      console.log('✅ Streaming response started');
      
      let fullResponse = '';
      let chunkCount = 0;
      
      for await (const chunk of stream) {
        const content = chunk.content || chunk;
        fullResponse += content;
        chunkCount++;
        
        if (chunkCount <= 5) { // Show first few chunks
          console.log(`Chunk ${chunkCount}: "${content}"`);
        }
      }
      
      console.log(`✅ Response completed - ${chunkCount} chunks, ${fullResponse.length} chars total`);
      console.log(`Full response: "${fullResponse}"`);
      
      if (fullResponse.length === 0) {
        console.log('❌ ERROR: Empty response from LLM');
      } else if (fullResponse.includes('error') || fullResponse.includes('Error')) {
        console.log('❌ ERROR: Response contains error message');
      }
      
    } catch (llmError) {
      console.error('❌ LLM Error:', llmError.message);
      console.error('Stack:', llmError.stack);
    }

    await mongoose.disconnect();
    console.log('\n🔚 Database disconnected');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    await mongoose.disconnect();
  }
}

debugChatFlow();
