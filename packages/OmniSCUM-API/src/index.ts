import { Hono } from 'hono';
import { GameEventMutation, ScumCommand } from './lib/types';
import { api } from '@omni-scum/convex-backend/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const app = new Hono();
const convex = new ConvexHttpClient(process.env.CONVEX_URL!);
const commandQueue: ScumCommand[] = [];

app.use('*', async (c, next) => {
	const apiKey = c.req.header('X-API-Key');
	if (apiKey !== process.env.SCUM_SERVER_API_KEY) {
		return c.json({ error: 'Unauthorized' }, 401);
	}
	await next();
});

const eventDispatchMap: Record<string, GameEventMutation> = {
	'server-update': api.gameEvents.updateServer,
	'kill-event': api.gameEvents.logKill,
	'connections': api.gameEvents.logConnection,
	'admin-command-event': api.gameEvents.logAdminCommand,
	'chat-event': api.gameEvents.logChat,
	'lockpick-event': api.gameEvents.logLockpicking,
};


app.post('/game-event', async (c) => {
	try {
		const { event, payload } = await c.req.json<{ event: string; payload: any }>();

		const mutation = eventDispatchMap[event];

		if (!mutation) {
			return c.json({ error: `Unknown or disallowed event type: ${event}` }, 400);
		}

		await convex.mutation(mutation, payload);

		return c.json({ success: true }, 200);

	} catch (error) {
		console.error('Convex mutation failed:', error);
		return c.json({ error: 'Failed to process event' }, 500);
	}
});

app.post('/queue-command', async (c) => {
	try {
		const payload: ScumCommand = await c.req.json();

		commandQueue.push(payload);

		console.log(`[Command Queue] Queued command: ${payload.type}. Queue size is now ${commandQueue.length}`);

		return c.json({ success: true, message: 'Command queued.' }, 201);
	} catch (err) {
		return c.json({ error: 'Invalid JSON payload' }, 400);
	}
});

app.get('/get-commands', async (c) => {
	try {
		if (commandQueue.length === 0) {
			return c.json([]);
		}

		const commandsToSend = [...commandQueue];

		commandQueue.length = 0;

		console.log(`[Command Queue] Sent ${commandsToSend.length} commands to game server. Queue cleared.`);

		return c.json(commandsToSend);

	} catch (error: any) {
		console.error('Error fetching commands:', error);
		return c.json({ error: error.message }, 500);
	}
});

const port = Number(process.env.HONO_PORT) || 3000;
console.log(`API server listening on port ${port}`);

export default {
	port: port,
	fetch: app.fetch
} 