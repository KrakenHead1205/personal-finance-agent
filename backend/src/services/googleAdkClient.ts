import axios, { AxiosError } from 'axios';

/**
 * Google ADK Client
 * Integrates with Google ADK (Agentic Development Kit) API
 */

/**
 * Run an ADK agent with the given input
 * @param agentName - Name of the agent to run
 * @param input - Input data for the agent
 * @returns Response data from the agent
 * @throws Error if API credentials are missing or request fails
 */
export async function runAgent(agentName: string, input: any): Promise<any> {
  const ADK_API_URL = process.env.ADK_API_URL;
  const ADK_API_KEY = process.env.ADK_API_KEY;

  // Validate environment variables
  if (!ADK_API_URL || !ADK_API_KEY) {
    const missingVars = [];
    if (!ADK_API_URL) missingVars.push('ADK_API_URL');
    if (!ADK_API_KEY) missingVars.push('ADK_API_KEY');

    console.warn(
      `⚠️  Google ADK configuration missing: ${missingVars.join(', ')}. ` +
      `Please set these environment variables to enable AI features.`
    );

    throw new Error(
      `Google ADK not configured. Missing environment variables: ${missingVars.join(', ')}`
    );
  }

  try {
    // Make POST request to ADK API
    const response = await axios.post(
      `${ADK_API_URL}/run`,
      {
        agent: agentName,
        input,
      },
      {
        headers: {
          'Authorization': `Bearer ${ADK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return response.data;
  } catch (error) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Server responded with error status
        console.error('Google ADK API error:', {
          status: axiosError.response.status,
          data: axiosError.response.data,
        });
        
        throw new Error(
          `Google ADK API error (${axiosError.response.status}): ${
            JSON.stringify(axiosError.response.data) || 'Unknown error'
          }`
        );
      } else if (axiosError.request) {
        // Request was made but no response received
        console.error('Google ADK API: No response received', axiosError.message);
        throw new Error('Failed to connect to Google ADK API. Please check the API URL and network connection.');
      }
    }

    // Generic error
    console.error('Unexpected error calling Google ADK:', error);
    throw new Error(
      `Failed to run ADK agent: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if Google ADK is configured
 * @returns true if ADK credentials are set
 */
export function isAdkConfigured(): boolean {
  return !!(process.env.ADK_API_URL && process.env.ADK_API_KEY);
}

