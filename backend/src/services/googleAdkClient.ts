import axios from 'axios';

export async function runAgent(agentName: string, input: any): Promise<any> {
  const API_KEY = process.env.ADK_API_KEY;
  const API_URL = process.env.ADK_API_URL || 'https://generativelanguage.googleapis.com/v1beta';

  if (!API_KEY) {
    throw new Error('ADK_API_KEY not configured. Using fallback logic.');
  }

  // Use gemini-1.5-flash (latest stable model)
  // Try with latest suffix first, fallback to base name
  let endpoint = `${API_URL}/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
  
  // Alternative endpoint format if the above doesn't work
  // const endpoint = `${API_URL}/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

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

  try {
    const response = await axios.post(
      endpoint,
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
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to get AI response');
  }
}

export function isAdkConfigured(): boolean {
  return !!process.env.ADK_API_KEY;
}