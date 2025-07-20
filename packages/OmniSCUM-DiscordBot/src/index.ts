import './lib/setup';

import { container, LogLevel, SapphireClient } from '@sapphire/framework';
import { EmbedBuilder, GatewayIntentBits, escapeMarkdown } from 'discord.js';
import { AdminCommandEvent, Chat, ConnectionEvent, GenericInteractionEvent, KillFeed, LockpickEvent } from './lib/types';
import { formatUptime, getChannel } from './lib/utils';
import { getSteamPlayerSummary } from './lib/steam';
import { api } from '@omni-scum/convex-backend/convex/_generated/api';
import { convex } from './lib/convex';
import '@sapphire/plugin-scheduled-tasks/register';

async function handleKillEvent(payload: KillFeed) {
	const channel = await getChannel(process.env.SERVER_KILLFEED_CHANNEL_ID);
	if (!channel) return container.logger.error('[Kill Feed] - Channel not configured or found.');

	const { killer, victim, timestamp, distance } = payload;
	let message = '';
	if (killer.steamId == victim.steamId) {
		message = `💀 ${timestamp} **${killer.name}** (${killer.steamId}) killed themselves`;
	} else {
		message = `💀 ${timestamp} **${killer.name}** (${killer.steamId}) killed **${victim.name}** (${victim.steamId}) from ${distance}m`;
	}
	await channel.send(message);
}

async function handleConnectionEvent(payload: ConnectionEvent) {
	const channel = await getChannel(process.env.SERVER_CONNECTIONS_CHANNEL_ID);
	if (!channel) return container.logger.error('[Connections] - Channel not configured or found.');

	const { type, user, playDuration } = payload;
	const steamProfile = await getSteamPlayerSummary(user.steamId);
	const embed = new EmbedBuilder().setTimestamp();
	const displayName = steamProfile?.personaname || user.name;
	const profileUrl = steamProfile?.profileurl || `https://steamcommunity.com/profiles/${user.steamId}`;

	embed.setAuthor({ name: displayName, url: profileUrl, iconURL: steamProfile?.avatarfull });
	if (steamProfile?.avatarfull) embed.setThumbnail(steamProfile.avatarfull);

	if (type === 'connect') {
		embed.setTitle('Player Connected').setColor(0x4caf50).setDescription(`**[${displayName}](${profileUrl})** has joined the server.`);
		if (steamProfile?.loccountrycode) embed.addFields({ name: 'Country', value: `:flag_${steamProfile.loccountrycode.toLowerCase()}:`, inline: true });
	} else {
		embed.setTitle('Player Disconnected').setColor(0xaf4c50).setDescription(`**[${displayName}](${profileUrl})** has left the server.`);
		if (playDuration !== undefined) embed.addFields({ name: 'Play Time', value: formatUptime(playDuration), inline: true });
	}
	await channel.send({ embeds: [embed] });
}

async function handleChatEvent(payload: Chat) {
	const channel = await getChannel(process.env.SERVER_CHAT_CHANNEL_ID);
	if (!channel) return container.logger.error('[Chat Feed] - Channel not configured or found.');

	const { timestamp, channel: chatChannelName, user, message } = payload;
	const sanitizedMessage = escapeMarkdown(message.replace(/@/g, '@\u200b'));
	const parts: string[] = [];
	if (timestamp) parts.push(timestamp);
	if (chatChannelName) parts.push(`[${chatChannelName}]`);
	if (user) parts.push(`**${escapeMarkdown(user.name || 'Unknown')}**${user.steamId ? ` (${user.steamId})` : ''}`);

	const finalMessage = `${parts.join(' ')}: ${sanitizedMessage}`;
	await channel.send(finalMessage.slice(0, 2000));
}

async function handleAdminCommandEvent(payload: AdminCommandEvent) {
	const channel = await getChannel(process.env.SERVER_ADMIN_LOG_CHANNEL_ID);
	if (!channel) return container.logger.error('[Admin Log] - Channel not configured or found.');

	const { user, command, timestamp } = payload;
	const sanitizedAdminName = escapeMarkdown(user.name);
	const messageContent = `${timestamp} **${sanitizedAdminName}** (${user.steamId}): \`#${command}\``;
	await channel.send(messageContent);
}

async function handleLockpickEvent(payload: LockpickEvent) {
	const channel = await getChannel(process.env.SERVER_INTERACTIONS_CHANNEL_ID);
	if (!channel) return container.logger.error('[Lockpicking] - Interactions channel not configured or found.');

	const steamProfile = await getSteamPlayerSummary(payload.user.steamId);
	const embed = new EmbedBuilder().setTimestamp();

	if (steamProfile) {
		embed.setAuthor({ name: steamProfile.personaname, url: steamProfile.profileurl, iconURL: steamProfile.avatarfull });
	} else {
		embed.setAuthor({ name: payload.user.name });
	}
    
	embed
		.setTitle('🔐 Lockpicking')
		.setColor(payload.success ? 0x4caf50 : 0xaf4c50)
		.addFields(
			{ name: 'Player', value: `[${payload.user.name}](${steamProfile?.profileurl || `https://steamcommunity.com/profiles/${payload.user.steamId}`})`, inline: false },
			{ name: 'Target', value: payload.lockpickable, inline: true },
			{ name: 'Outcome', value: payload.success ? '🔓 Success' : '🔒 Failure', inline: true },
			{ name: 'Location (Copy/Paste)', value: `\`${payload.teleportCmd}\``, inline: false }
		);

	await channel.send({ embeds: [embed] });
}

async function handleGenericInteractionEvent(payload: GenericInteractionEvent) {

	const interactionEmbedConfig = {
		cooking:       { title: '🍳 Cooking Activity', color: 0xf1c40f },
		world:         { title: '🌍 World Interaction', color: 0x2ecc71 },
		base_building: { title: '🏚️ Base Building', color: 0xe67e22 },
		inventory:     { title: '📦 Inventory Action', color: 0x95a5a6 },
		squad:         { title: '🛡️ Squad Management', color: 0x3498db },
		combat:        { title: '⚔️ Combat Action', color: 0xe74c3c },
		misc:          { title: '✨ Miscellaneous', color: 0x9b59b6 },
		economy:       { title: '💰 Economy', color: 0x27ae60 }
	};

	const channel = await getChannel(process.env.SERVER_INTERACTIONS_CHANNEL_ID);
	if (!channel) return container.logger.error('[Interactions] - Channel not configured or found.');

	const steamProfile = await getSteamPlayerSummary(payload.user.steamId);
	const embed = new EmbedBuilder().setTimestamp();

	if (steamProfile) {
		embed.setAuthor({ name: steamProfile.personaname, url: steamProfile.profileurl, iconURL: steamProfile.avatarfull });
	} else {
		embed.setAuthor({ name: payload.user.name });
	}

    if (payload.type in interactionEmbedConfig) {
        const config = interactionEmbedConfig[payload.type as keyof typeof interactionEmbedConfig];
        embed
            .setColor(config.color)
            .setTitle(config.title)
            .setDescription(payload.description);
    } else {
        embed
            .setTitle('⚙️ General Interaction')
            .setDescription(payload.description);
    }

	await channel.send({ embeds: [embed] });
}

const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	loadMessageCommandListeners: true,
	tasks: {
		bull: {
			connection: {
				port: Number(process.env.REDIS_PORT!),
				password: process.env.REDIS_PASSWORD!,
				host: process.env.REDIS_URL!,
				db: 0
			}
		}
	}
});

function initializeConvexListeners() {
	container.logger.info('Initializing Convex query listeners...');
	const convexClient = container.convex;

	convexClient.onUpdate(api.queries.getLatestKill, {}, (newKillDocs) => {
		if (newKillDocs && newKillDocs.length > 0) {
			void handleKillEvent(newKillDocs[0]);
		}
	});

	// --- Connection Event Listener ---
	convexClient.onUpdate(api.queries.getLatestConnection, {}, (newConnectionDocs) => {
		if (newConnectionDocs && newConnectionDocs.length > 0) {
			void handleConnectionEvent(newConnectionDocs[0]);
		}
	});

	// --- Chat Event Listener ---
	convexClient.onUpdate(api.queries.getLatestChat, {}, (newChatDocs) => {
		if (newChatDocs && newChatDocs.length > 0) {
			void handleChatEvent(newChatDocs[0]);
		}
	});

	// --- Admin Command Log Listener ---
	convexClient.onUpdate(api.queries.getLatestAdminLog, {}, (newAdminLogDocs) => {
		if (newAdminLogDocs && newAdminLogDocs.length > 0) {
			void handleAdminCommandEvent(newAdminLogDocs[0]);
		}
	});

	convexClient.onUpdate(api.queries.getLatestInteraction, {}, (docs) => {
		if (docs && docs.length > 0) {
			void handleGenericInteractionEvent(docs[0]);
		}
	});

	convexClient.onUpdate(api.queries.getLatestLockpick, {}, (newLockpickDocs) => {
		if (newLockpickDocs && newLockpickDocs.length > 0) {
			void handleLockpickEvent(newLockpickDocs[0]);
		}
	});

	container.logger.info('Convex query listeners have been attached.');
}

const main = async () => {
	try {
		container.convex = convex;

		client.logger.info('Logging in');
		await client.login();
		client.logger.info('Logged in');

		initializeConvexListeners();
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

main()
