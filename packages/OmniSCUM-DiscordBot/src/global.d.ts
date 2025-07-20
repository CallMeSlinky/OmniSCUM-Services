import type { ConvexClient } from 'convex/browser';

declare module '@sapphire/pieces' {
	interface Container {
		convex: ConvexClient;
	}
}