import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { TableNames } from './_generated/dataModel';

export const cleanupOldLogs = internalMutation({
	args: {
		tableName: v.string(),
		retentionDays: v.number()
	},
	handler: async (ctx, args) => {
		const retentionPeriodMs = args.retentionDays * 24 * 60 * 60 * 1000;
		const cutoffTime = Date.now() - retentionPeriodMs;

		const oldDocsQuery = await ctx.db
			.query(args.tableName as TableNames)
			.filter((q) => q.lt(q.field('_creationTime'), cutoffTime))
			.collect();

		if (oldDocsQuery.length === 0) {
			console.log(`No old logs to delete from ${args.tableName}.`);
			return;
		}

		console.log(`Deleting ${oldDocsQuery.length} logs from ${args.tableName}...`);

		for (const doc of oldDocsQuery) {
			await ctx.db.delete(doc._id);
		}

		console.log(`Cleanup for ${args.tableName} complete.`);
	}
});