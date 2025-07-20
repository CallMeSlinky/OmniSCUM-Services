import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();



crons.daily(
	'Daily Log Cleanup',
	{ hourUTC: 0, minuteUTC: 0 },
	internal.logs.cleanupOldLogs,
	{ tableName: 'chat_logs', retentionDays: 1 }
);

crons.daily(
	'Daily Kills Cleanup',
	{ hourUTC: 0, minuteUTC: 1 },
	internal.logs.cleanupOldLogs,
	{ tableName: 'kills', retentionDays: 30 }
);

crons.daily(
	'Daily Connections Cleanup',
	{ hourUTC: 0, minuteUTC: 2 },
	internal.logs.cleanupOldLogs,
	{ tableName: 'connections', retentionDays: 30 }
);

crons.daily(
	'Daily Admin Log Cleanup',
	{ hourUTC: 0, minuteUTC: 3 },
	internal.logs.cleanupOldLogs,
	{ tableName: 'admin_logs', retentionDays: 1 }
);

crons.daily(
	'Daily Chat Log Cleanup',
	{ hourUTC: 0, minuteUTC: 4 },
	internal.logs.cleanupOldLogs,
	{ tableName: 'chat_logs', retentionDays: 1 }
);

crons.daily(
	'Daily Lockpit Log Cleanup',
	{ hourUTC: 0, minuteUTC: 5 },
	internal.logs.cleanupOldLogs,
	{ tableName: 'chat_logs', retentionDays: 30 }
);

export default crons;