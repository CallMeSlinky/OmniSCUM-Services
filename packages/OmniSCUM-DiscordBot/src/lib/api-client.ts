import { container } from '@sapphire/framework';
import axios from 'axios';
import { ScumCommand } from './types'; // Assuming ScumCommand is defined here

const API_URL = process.env.SCUM_SERVER_API;
const API_KEY = process.env.SCUM_SERVER_API_KEY;

interface ApiResponse {
	success: boolean;
	message?: string;
}

/**
 * Posts a command to the standalone OmniSCUM API.
 * @param payload The command payload to send.
 * @returns A standardized response object.
 */
export async function postCommandToAPI(payload: ScumCommand): Promise<ApiResponse> {
	if (!API_URL || !API_KEY) {
		const errorMessage = 'API URL or Key is not configured in the .env file.';
		container.logger.error(`[API Client] ${errorMessage}`);
		return { success: false, message: errorMessage };
	}

	try {
		await axios.post(`${API_URL}/queue-command`, payload, {
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': API_KEY
			},
			timeout: 5000
		});

		return { success: true };

	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response) {
				const errorMessage = error.response.data?.error || 'Unknown API error.';
				container.logger.error(`[API Client] API returned an error: ${errorMessage} (Status: ${error.response.status})`);
				return { success: false, message: `The API server responded with an error: ${errorMessage}` };
			}
			if (error.request) {
				container.logger.error('[API Client] Could not connect to the API server. It may be offline.');
				return { success: false, message: 'Could not connect to the API server.' };
			}
		}
		container.logger.error('[API Client] An unexpected error occurred:', error);
		return { success: false, message: 'An unexpected error occurred.' };
	}
}