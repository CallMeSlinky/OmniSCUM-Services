import type { DataModel } from '@omni-scum/convex-backend/convex/_generated//dataModel';

export type KillFeed = DataModel['kills']['document'];
export type ConnectionEvent = DataModel['connections']['document'];
export type Chat = DataModel['chat_logs']['document'];
export type AdminCommandEvent = DataModel['admin_logs']['document'];
export type LockpickEvent = DataModel['lockpicking']['document'];
export type GenericInteractionEvent = DataModel['interactions']['document'];
export type InteractionEvent = LockpickEvent | GenericInteractionEvent;

type ServerDoc = DataModel['server']['document'];
export type ScumServerData = ServerDoc;
export type Bounty = ServerDoc['bounties'][number];
export type BountyReward = Bounty['rewards'];

export interface ScumCommand {
	type: 'announce';
	message: string;
}