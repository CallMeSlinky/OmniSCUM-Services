import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { updateStatusPanel } from '../lib/status-updater';
import { updateBountyPanel } from '../lib/bounty-updater';
import { ScumServerData } from '../lib/types';
import { api } from '@omni-scum/convex-backend/convex/_generated/api';

export class UpdateDiscordPanelsTask extends ScheduledTask {
	public constructor(context: ScheduledTask.LoaderContext, options: ScheduledTask.Options) {
		super(context, {
			...options,
			name: 'update-discord-panels',
			interval: 60_000,
		});
	}

	public async run() {
		this.container.logger.info('Fetching server data to update all panels...');

		try {
			const data = await this.container.convex.query(api.queries.getServer, {});
			await Promise.all([
				updateStatusPanel(data as ScumServerData | null),
				updateBountyPanel(data as ScumServerData | null)
			]);

			this.container.logger.info('All Discord panels updated successfully.');
		} catch (error) {
			this.container.logger.error('Could not fetch server status from Convex, updating panels to offline state.', error);
			
			await Promise.all([
				updateStatusPanel(null),
				updateBountyPanel(null)
			]);
		}
	}
}

declare module '@sapphire/plugin-scheduled-tasks' {
	interface ScheduledTasks {
		manual: never;
	}
}