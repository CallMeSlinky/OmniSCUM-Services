import { query } from './_generated/server';
import { TableNames, Doc } from './_generated/dataModel';

const createLatestQuery = <T extends TableNames>(tableName: T) => {
	return query({
		args: {},
		handler: async (ctx): Promise<Doc<T>[]> => {
			const latestDoc = await ctx.db
				.query(tableName)
				.order('desc')
				.first();
			
			return latestDoc ? [latestDoc] : [];
		}
	});
};

export const getServer = query({
	handler: async (ctx) => {
		return await ctx.db.query('server').first();
	}
});

export const getLatestKill = createLatestQuery('kills');
export const getLatestConnection = createLatestQuery('connections');
export const getLatestChat = createLatestQuery('chat_logs');
export const getLatestAdminLog = createLatestQuery('admin_logs');
export const getLatestInteraction = createLatestQuery('interactions');
export const getLatestLockpick = createLatestQuery('lockpicking');