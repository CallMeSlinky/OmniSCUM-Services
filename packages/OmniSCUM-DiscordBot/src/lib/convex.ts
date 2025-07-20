import { ConvexClient } from 'convex/browser';

if (!process.env.CONVEX_DEPLOYMENT) {
	throw new Error('CONVEX_DEPLOYMENT environment variable is not set!');
}

export const convex = new ConvexClient(process.env.CONVEX_DEPLOYMENT);