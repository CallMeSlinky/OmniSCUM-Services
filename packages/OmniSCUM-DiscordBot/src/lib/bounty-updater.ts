import { EmbedBuilder, Message, TextChannel } from 'discord.js';
import { container } from '@sapphire/framework';
import { Bounty, ScumServerData } from './types';

function formatBountyReward(rewards: { cash: number; gold: number; fame: number }): string {
    const parts: string[] = [];
    if (rewards.cash > 0) parts.push(`$${rewards.cash.toLocaleString()}`);
    if (rewards.gold > 0) parts.push(`${rewards.gold.toLocaleString()} Gold`);
    if (rewards.fame > 0) parts.push(`${rewards.fame.toLocaleString()} FP`);

    if (parts.length === 0) return 'No Reward';
    return parts.join(' | ');
}

export async function updateBountyPanel(data: ScumServerData | null) {
    const { client } = container;

    const channelId = process.env.SERVER_BOUNTY_CHANNEL_ID;
    if (!channelId) {
        return client.logger.error('[Bounty Panel] - BOUNTY_PANEL_CHANNEL_ID is not configured.');
    }

    const channel = (await client.channels.fetch(channelId).catch(() => null)) as TextChannel;
    if (!channel) return;

    const messageToEdit = await getMessageToEdit(channel);
    if (!messageToEdit) return;

    if (!data) {
        const offlineEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('💀 Active Server Bounties')
            .setDescription('The server is currently offline or the bot is awaiting the first bounty update.')
            .setTimestamp();
		await messageToEdit.edit({ content: '', embeds: [offlineEmbed] });
		container.logger.info(`[BountyUpdater] - Bounty panel updated. Server is Offline (no data received).`);
        return;
    }

    const lastUpdateTimestamp = new Date(data?.updatedAt).getTime();
	const isServerOnline = Date.now() - lastUpdateTimestamp < 60_000;
    const bounties: Bounty[] = data?.bounties || [];

    const embed = new EmbedBuilder()
        .setColor(isServerOnline ? '#00FF00' : '#FF0000')
        .setTitle('💀 Active Server Bounties')
        .setTimestamp();

    if (isServerOnline) {
        if (bounties.length > 0) {
            const bountyListString = bounties
                .map((bounty: Bounty) => {
                    const targetName = `🎯 [${bounty.targetName}](https://steamcommunity.com/profiles/${bounty.targetUserId})`;
                    const details = [
                        formatBountyReward(bounty.rewards),
                        (bounty.lastSeenSector || bounty.lastSeenKeypad) &&
                        `📍[${[
                            bounty.lastSeenSector,
                            bounty.lastSeenKeypad && `K${bounty.lastSeenKeypad}`
                        ].filter(Boolean).join(', ')}]`
                    ];
                    return `${targetName} - ${details.filter(Boolean).join(' | ')}`;
                })
                .join('\n');
            embed.setDescription(bountyListString);
        } else {
            embed.setDescription('There are no active bounties on the server.');
        }
    } else {
        embed.setDescription('The server is currently offline. No bounty data is available.');
    }

    try {
        await messageToEdit.edit({ content: '', embeds: [embed] });
        container.logger.info(`[Update Bounty Status] - Bounty panel updated. Server is ${isServerOnline ? 'Online' : 'Offline'}.`);
    } catch (error) {
        container.logger.error('[Update Bounty Status] - Failed to edit the bounty message.', error);
    }
}


async function getMessageToEdit(channel: TextChannel): Promise<Message | null> {
    const messageId = process.env.SERVER_BOUNTY_MESSAGE_ID;

    if (messageId) {
        try {
            return await channel.messages.fetch(messageId);
        } catch (error) {
            container.logger.warn(`[Update Server Status] - Could not find message with ID ${messageId}. It may have been deleted. A new one will be created.`);
        }
    }

    container.logger.info('[Bounty] - Sending a new bounty panel message...');
    const newMessage = await channel.send({ content: 'Initializing bounty status panel...' });

    container.logger.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    container.logger.error(`!!! CRITICAL ACTION REQUIRED: A new status message has been created.`);
    container.logger.error(`!!! Please update your .env file with this new ID:`);
    container.logger.error(`!!! SERVER_BOUNTY_MESSAGE_ID=${newMessage.id}`);
    container.logger.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

    return newMessage;
}
