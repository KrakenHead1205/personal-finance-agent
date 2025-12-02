import axios from 'axios';

/**
 * Google ADK Client (Placeholder)
 * Will be integrated with actual Google ADK API in the future
 */

/**
 * Run a Google ADK agent (not implemented yet)
 * @param agentName - Name of the agent
 * @param input - Input data for the agent
 * @throws Error indicating ADK is not integrated
 */
export async function runAgent(agentName: string, input: any): Promise<any> {
  const ADK_API_URL = process.env.ADK_API_URL;
  const ADK_API_KEY = process.env.ADK_API_KEY;

  // Placeholder: Not integrated yet
  throw new Error(
    'Google ADK not integrated yet. Using fallback rule-based logic.'
  );

  // Future implementation:
  /*
  if (!ADK_API_URL || !ADK_API_KEY) {
    throw new Error('Google ADK credentials not configured');
  }

  const response = await axios.post(
    `${ADK_API_URL}/run`,
    { agent: agentName, input },
    {
      headers: {
        Authorization: `Bearer ${ADK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
  */
}

/**
 * Check if Google ADK is configured
 * @returns false (always, as it's not integrated yet)
 */
export function isAdkConfigured(): boolean {
  return false;
}
