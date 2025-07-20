import { container } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, TextChannel } from 'discord.js';
import { formatUptime } from './utils';
import { ScumServerData } from './types';

export async function updateStatusPanel(data: ScumServerData | null) {
    const { client } = container;

	const channelId = process.env.SERVER_STATUS_CHANNEL_ID;
	if (!channelId) return container.logger.error('[StatusUpdater] - Channel ID not configured.');

    const channel = await client.channels.fetch(channelId).catch(() => null) as TextChannel;
	if (!channel) return container.logger.error(`[StatusUpdater] - Could not find channel with ID: ${channelId}`);
    
    const messageToEdit = await getMessageToEdit(channel);
	if (!messageToEdit) return;
    const serverRulesButton = new ButtonBuilder().setLabel('Server Rules').setEmoji('📝').setStyle(ButtonStyle.Link).setURL('https://omniscum.com/rules');
    const playButton = new ButtonBuilder().setLabel('Play Now').setEmoji('🎮').setStyle(ButtonStyle.Link).setURL('https://play.omniscum.com');
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([playButton, serverRulesButton]);

    if (!data) {
        const offlineEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('🔴 Server Status: Offline')
            .setDescription('The server is currently offline or the bot is awaiting the first status update.');
        playButton.setDisabled(true);
		await messageToEdit.edit({ content: '', embeds: [offlineEmbed], components: [actionRow] });
		container.logger.info(`[StatusUpdater] - Status panel updated. Server is Offline (no data received).`);
        return;
    }

    const lastUpdateTimestamp = new Date(data?.updatedAt).getTime();
	const isServerOnline = Date.now() - lastUpdateTimestamp < 60_000;

    const { serverSettings, playerList } = data as ScumServerData;
	const serverName = serverSettings?.name || 'SCUM Server';
        const serverDescription = serverSettings?.description || 'No description.';
        const serverMaxPlayers = serverSettings?.maxPlayers || 0;
        const serverPlaystyle = serverSettings?.playstyle || 'N/A';
        const serverVersion = serverSettings?.gameVersion || 'N/A';
        const uptimeInSeconds = serverSettings?.uptime || 0;
        const onlinePlayers = playerList?.length ?? 0;

        let playerListString = 'No players online.';
        if (playerList && playerList.length > 0) {
            const formattedPlayers = playerList.map(
                (player: { name: string; steamId: string }) => `- [${player.name}](https://steamcommunity.com/profiles/${player.steamId})`
            );
            playerListString = formattedPlayers.join('\n');
        }

        const embed = new EmbedBuilder()
            .setTitle(`💀 ${serverName}`)
            .setDescription(serverDescription)
            .setTimestamp();

    if (isServerOnline) {
        embed
                .setColor('Green')
                .setFooter({ text: `⏰ Uptime: ${formatUptime(uptimeInSeconds)} | 🔧 Server Version: v${serverVersion}` })
                .addFields(
                    { name: '🎯 Playstyle', value: serverPlaystyle, inline: true },
                    { name: '👤 Player Count', value: `${onlinePlayers} / ${serverMaxPlayers}`, inline: true },
                    { name: '🖥️ Server Status', value: '🟢 Online', inline: true },
                    { name: '👥 Online Players', value: playerListString, inline: false }
                );

            playButton.setDisabled(false);
    } else {
        embed
        .setColor('Red')
        .setFooter({ text: `⏰ Uptime: N/A | 🔧 Server Version: v${serverVersion}` })
        .addFields(
            { name: '🎯 Playstyle', value: serverPlaystyle, inline: true },
            { name: '👤 Player Count', value: `Last Known: ${onlinePlayers} / ${serverMaxPlayers}`, inline: true },
            { name: '🖥️ Server Status', value: '🔴 Offline', inline: true },
            { name: '👥 Last Seen Players', value: playerListString, inline: false }
        );
    playButton.setDisabled(true);
    }

    await messageToEdit.edit({ content: '', embeds: [embed], components: [actionRow] });
    container.logger.info(`[StatusUpdater] - Status panel updated. Server is ${isServerOnline ? 'Online' : 'Offline'}.`);
}

async function getMessageToEdit(channel: TextChannel): Promise<Message | null> {
    const messageId = process.env.SERVER_STATUS_MESSAGE_ID;

    if (messageId) {
        try {
            return await channel.messages.fetch(messageId);
        } catch (error) {
            container.logger.warn(`[Update Server Status] - Could not find message with ID ${messageId}. It may have been deleted. A new one will be created.`);
        }
    }

    container.logger.info('[UpdateServerStatus] - Sending a new status panel message...');
    const newMessage = await channel.send({ content: 'Initializing server status panel...' });

    container.logger.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    container.logger.error(`!!! CRITICAL ACTION REQUIRED: A new status message has been created.`);
    container.logger.error(`!!! Please update your .env file with this new ID:`);
    container.logger.error(`!!! SERVER_STATUS_MESSAGE_ID=${newMessage.id}`);
    container.logger.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

    return newMessage;
}