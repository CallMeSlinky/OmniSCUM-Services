import axios from 'axios';
import { container } from '@sapphire/framework';

export interface SteamPlayerSummary {
	steamid: string;
	personaname: string;
	profileurl: string;
	avatarfull: string;
	timecreated?: number;
	loccountrycode?: string;
}

const STEAM_API_KEY = process.env.STEAM_WEB_API_KEY;

/**
 * Fetches a player's summary from the Steam Web API.
 * @param steamId The player's 64-bit Steam ID.
 * @returns The player's summary object, or null if not found or an error occurs.
 */
export async function getSteamPlayerSummary(steamId: string): Promise<SteamPlayerSummary | null> {
	if (!STEAM_API_KEY) {
		container.logger.warn('[Steam API] - STEAM_WEB_API_KEY is not configured. Cannot fetch player data.');
		return null;
	}

	const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;

	try {
		const response = await axios.get(url);
		const players = response.data?.response?.players;

		if (players && players.length > 0) {
			return players[0];
		}

		return null;
	} catch (error) {
		container.logger.error(`[Steam API] - Failed to fetch data for Steam ID ${steamId}:`, error);
		return null;
	}
}