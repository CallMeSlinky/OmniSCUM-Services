import { FunctionReference } from "convex/server";

export type GameEventMutation = FunctionReference<"mutation", "public", any, any>;

export interface ConnectionEvent {
	type: 'connect' | 'disconnect';
	user: {
		name: string;
		steamId: string;
	};
	playDuration?: number;
}

export interface KillFeed {
    victim: {
        name: string;
        steamId: string;
    };
    killer: {
        name: string;
        steamId: string;
    };
    timestamp: string;
    distance: string;
}

export interface Chat {
    user: {
        name?: string
        steamId?: string
    }
    channel?: string
    timestamp?: string
    message: string
}

export interface BountyReward {
	cash: number;
	gold: number;
	fame: number;
}

export interface AdminCommandEvent {
	user: {
		name: string;
		steamId: string;
	};
	command: string;
	timestamp: string;
}

export interface Bounty {
	targetUserId: string;
	targetName: string;
	rewards: BountyReward;
    lastSeenSector?: string;
    lastSeenKeypad?: string;
}

interface BaseInteractionEvent {
	user: {
		name: string;
		steamId: string;
	};
}

export interface LockpickEvent extends BaseInteractionEvent {
	type: 'lockpicking';
	success: boolean;
    lockpickable: string;
    teleportCmd: string;
}

export type InteractionEvent = LockpickEvent

export interface ScumServerData {
    serverSettings: any;
    playerList: { name: string; steamId: string }[];
    bounties: Bounty[];
}

export interface ScumCommand {
	type: 'announce';
	message: string;
}