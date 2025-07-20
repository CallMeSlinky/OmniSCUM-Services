import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, UserError } from '@sapphire/framework';
import { Message, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { postCommandToAPI } from '../lib/api-client';

@ApplyOptions<Command.Options>({
	name: 'announce',
	description: 'Sends an announcement to the in-game SCUM server.',
	aliases: ['announce'],
	preconditions: ['GuildOnly']
})
export class AnnounceCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
				.addStringOption((option) =>
					option.setName('message').setDescription('The message to announce in-game.').setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const messageToAnnounce = interaction.options.getString('message', true);

		const response = await postCommandToAPI({
			type: 'announce',
			message: messageToAnnounce
		});

		if (response.success) {
			return interaction.editReply({
				content: `✅ Announcement has been queued for the game server.`
			});
		} else {
			return interaction.editReply({
				content: `❌ Failed to queue announcement. Reason: ${response.message}`
			});
		}
	}

	public override async messageRun(message: Message, args: Args) {
		if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
			throw new UserError({ identifier: 'MissingPermissions', message: '❌ You do not have permission to use this command.' });
		}

		let messageToAnnounce: string;

		try {
			messageToAnnounce = await args.rest('string');
		} catch (error) {
			if (error instanceof UserError && error.identifier === 'argsMissing') {
				return message.reply({
					content: `Please provide a message to announce. Usage: \`!announce <your message>\``
				});
			}
			this.container.logger.error(error);
			return message.reply({ content: 'An unexpected error occurred while parsing your message.' });
		}

		const response = await postCommandToAPI({
			type: 'announce',
			message: messageToAnnounce
		});

		if (response.success) {
			return message.reply({
				content: `✅ Announcement has been queued for the game server.`
			});
		} else {
			return message.reply({
				content: `❌ Failed to queue announcement. Reason: ${response.message}`
			});
		}
	}
}