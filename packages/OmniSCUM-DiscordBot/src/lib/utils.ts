import {
	container,
	type ChatInputCommandSuccessPayload,
	type Command,
	type ContextMenuCommandSuccessPayload,
	type MessageCommandSuccessPayload
} from '@sapphire/framework';
import { cyan } from 'colorette';
import type { APIUser, Guild, TextChannel, User } from 'discord.js';

export function logSuccessCommand(payload: ContextMenuCommandSuccessPayload | ChatInputCommandSuccessPayload | MessageCommandSuccessPayload): void {
	let successLoggerData: ReturnType<typeof getSuccessLoggerData>;

	if ('interaction' in payload) {
		successLoggerData = getSuccessLoggerData(payload.interaction.guild, payload.interaction.user, payload.command);
	} else {
		successLoggerData = getSuccessLoggerData(payload.message.guild, payload.message.author, payload.command);
	}

	container.logger.debug(`${successLoggerData.shard} - ${successLoggerData.commandName} ${successLoggerData.author} ${successLoggerData.sentAt}`);
}

export function getSuccessLoggerData(guild: Guild | null, user: User, command: Command) {
	const shard = getShardInfo(guild?.shardId ?? 0);
	const commandName = getCommandInfo(command);
	const author = getAuthorInfo(user);
	const sentAt = getGuildInfo(guild);

	return { shard, commandName, author, sentAt };
}

function getShardInfo(id: number) {
	return `[${cyan(id.toString())}]`;
}

function getCommandInfo(command: Command) {
	return cyan(command.name);
}

function getAuthorInfo(author: User | APIUser) {
	return `${author.username}[${cyan(author.id)}]`;
}

function getGuildInfo(guild: Guild | null) {
	if (guild === null) return 'Direct Messages';
	return `${guild.name}[${cyan(guild.id)}]`;
}

export function formatUptime(totalSeconds: number): string {
	if (typeof totalSeconds !== 'number' || totalSeconds <= 0) {
		return 'N/A';
	}

	if (totalSeconds < 60) {
		return '1 minute';
	}

	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);

	const parts: string[] = [];

	if (days > 0) {
		parts.push(`${days} day${days > 1 ? 's' : ''}`);
	}

	if (hours > 0) {
		parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
	}

	if (minutes > 0 || parts.length === 0) {
		parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
	}
    
    if (parts.length === 0) {
        return "1 minute";
    }

	return parts.join(', ');
}


export async function getChannel(channelIdEnv: string | undefined): Promise<TextChannel | null> {
	if (!channelIdEnv) return null;
	try {
		const channel = await container.client.channels.fetch(channelIdEnv);
		return channel && channel.isTextBased() ? (channel as TextChannel) : null;
	} catch {
		return null;
	}
}