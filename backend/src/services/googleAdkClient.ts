import axios from 'axios';

export async function runAgent(agentName: string, input: any): Promise<any> {
  const API_KEY = process.env.ADK_API_KEY;
  const BASE_URL = 'https://generativelanguage.googleapis.com';

  if (!API_KEY) {
    throw new Error('ADK_API_KEY not configured. Using fallback logic.');
  }

  // Try different API versions and model combinations
  // v1 is the newer stable API, v1beta might have different model availability
  const apiVersions = ['v1', 'v1beta'];
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

  let prompt = '';
  
  if (agentName === 'categorization-agent') {
    prompt = `Categorize this transaction into one of these categories: Food, Transport, Rent, Bills, Shopping, Entertainment, Healthcare, Groceries, Other.
    
Transaction: ${input.description}

Respond with ONLY the category name, nothing else.`;
  } else if (agentName === 'insights-agent') {
    prompt = `Generate 3-4 concise financial insights based on this spending summary:
    
Total: ₹${input.total}
Categories: ${JSON.stringify(input.byCategory)}

Provide actionable insights as a JSON array of strings. Example: ["insight 1", "insight 2", "insight 3"]`;
  }

  // Try each API version and model combination until one works
  let lastError: any = null;
  
  for (const apiVersion of apiVersions) {
    for (const model of models) {
      try {
        const modelEndpoint = `${BASE_URL}/${apiVersion}/models/${model}:generateContent?key=${API_KEY}`;
        
        const response = await axios.post(
          modelEndpoint,
          {
            contents: [{
              parts: [{ text: prompt }]
            }]
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        const text = response.data.candidates[0].content.parts[0].text.trim();
        console.log(`✅ Gemini API success with ${apiVersion}/${model}`);
        
        if (agentName === 'categorization-agent') {
          return { category: text };
        } else if (agentName === 'insights-agent') {
          try {
            const insights = JSON.parse(text);
            return { insights: Array.isArray(insights) ? insights : [text] };
          } catch {
            // If not valid JSON, return as single insight
            return { insights: [text] };
          }
        }
      } catch (error: any) {
        lastError = error;
        // Log the error but continue to next combination
        if (error.response?.data?.error) {
          console.warn(`⚠️ ${apiVersion}/${model} failed:`, error.response.data.error.message || error.message);
        } else {
          console.warn(`⚠️ ${apiVersion}/${model} failed:`, error.message);
        }
        // Continue to next combination
        continue;
      }
    }
  }
  
  // If all combinations failed, throw the last error
  console.error('❌ All Gemini API versions and models failed. Last error:', lastError?.response?.data || lastError?.message);
  throw new Error('Failed to get AI response from any Gemini model');
}

export function isAdkConfigured(): boolean {
  return !!process.env.ADK_API_KEY;
}