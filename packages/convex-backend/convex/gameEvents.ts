import { mutation } from './_generated/server';
import { v } from 'convex/values';

const userObject = v.object({ name: v.string(), steamId: v.string() });

async function upsertPlayer(ctx: any, user: { name: string; steamId: string }) {
    const existingPlayer = await ctx.db
        .query('players')
        .withIndex('by_steamId', (q: any) => q.eq('steamId', user.steamId))
        .unique();

    if (existingPlayer) {
        await ctx.db.patch(existingPlayer._id, {
            steamName: user.name,
            lastSeenAt: Date.now()
        });
        return existingPlayer;
    } else {
        const newPlayerId = await ctx.db.insert('players', {
            steamId: user.steamId,
            steamName: user.name,
            playtimeSeconds: 0,
            killCount: 0,
            deathCount: 0,
            isBanned: false,
            firstSeenAt: Date.now(),
            lastSeenAt: Date.now()
        });
        return await ctx.db.get(newPlayerId);
    }
}

export const updateServer = mutation({
    args: {
        serverSettings: v.object({
            name: v.optional(v.string()),
            description: v.optional(v.string()),
            maxPlayers: v.optional(v.number()),
            playstyle: v.optional(v.string()),
            gameVersion: v.optional(v.string()),
            uptime: v.optional(v.number())
        }),
        playerList: v.array(v.object({ name: v.string(), steamId: v.string() })),
        bounties: v.array(
            v.object({
                targetUserId: v.string(),
                targetName: v.string(),
                rewards: v.object({ cash: v.number(), gold: v.number(), fame: v.number() }),
                lastSeenSector: v.optional(v.string()),
                lastSeenKeypad: v.optional(v.string())
            })
        )
    },
    handler: async (ctx, args) => {
        const existingStatus = await ctx.db.query('server').first();
        if (existingStatus) {
            await ctx.db.patch(existingStatus._id, { ...args, updatedAt: Date.now() });
        } else {
            await ctx.db.insert('server', { ...args, updatedAt: Date.now() });
        }
    }
});

export const logKill = mutation({
    args: {
        killer: userObject,
        victim: userObject,
        timestamp: v.string(),
        distance: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        await ctx.db.insert('kills', args);

        const killerPlayer = await upsertPlayer(ctx, args.killer);
        const victimPlayer = await upsertPlayer(ctx, args.victim);

        if (killerPlayer) {
            await ctx.db.patch(killerPlayer._id, { killCount: killerPlayer.killCount + 1 });
        }
        if (victimPlayer) {
            await ctx.db.patch(victimPlayer._id, { deathCount: victimPlayer.deathCount + 1 });
        }
    }
});

export const logConnection = mutation({
    args: {
        type: v.union(v.literal('connect'), v.literal('disconnect')),
        user: userObject,
        playDuration: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        await ctx.db.insert('connections', args);

        const player = await upsertPlayer(ctx, args.user);

        if (player && args.type === 'disconnect' && args.playDuration) {
            await ctx.db.patch(player._id, {
                playtimeSeconds: player.playtimeSeconds + args.playDuration
            });
        }
    }
});

export const logAdminCommand = mutation({
    args: {
        user: userObject,
        command: v.string(),
        timestamp: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        await ctx.db.insert('admin_logs', args);
    }
});

export const logChat = mutation({
    args: {
        user: v.optional(v.object({ name: v.optional(v.string()), steamId: v.optional(v.string()) })),
        message: v.string(),
        channel: v.optional(v.string()),
        timestamp: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        await ctx.db.insert('chat_logs', args);
    }
});

export const logLockpicking = mutation({
    args: {
        user: userObject,
        success: v.boolean(),
        lockpickable: v.string(),
        teleportCmd: v.string()
    },
    handler: async (ctx, args) => {
        await ctx.db.insert('lockpicking', args);
    }
});