import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const userObject = v.object({
    name: v.string(),
    steamId: v.string()
});

export default defineSchema({
    players: defineTable({
        steamId: v.string(),
        steamName: v.string(),
        playtimeSeconds: v.number(),
        killCount: v.number(),
        deathCount: v.number(),
        bankBalance: v.optional(v.number()),
        cashAmount: v.optional(v.number()),
        goldAmount: v.optional(v.number()),
        famePoints: v.optional(v.number()),
        isBanned: v.boolean(),
        bannedUntil: v.optional(v.number()),
        banReason: v.optional(v.string()),
        firstSeenAt: v.number(),
        lastSeenAt: v.number()
    })
        .index('by_steamId', ['steamId']),

    server: defineTable({
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
                rewards: v.object({
                    cash: v.number(),
                    gold: v.number(),
                    fame: v.number()
                }),
                lastSeenSector: v.optional(v.string()),
                lastSeenKeypad: v.optional(v.string())
            })
        ),
        updatedAt: v.number()
    }),

    kills: defineTable({
        killer: v.object({ name: v.string(), steamId: v.string() }),
        victim: v.object({ name: v.string(), steamId: v.string() }),
        timestamp: v.string(),
        distance: v.optional(v.string())
    }),

    connections: defineTable({
        type: v.union(v.literal('connect'), v.literal('disconnect')),
        user: userObject,
        playDuration: v.optional(v.number())
    }),

    admin_logs: defineTable({
        user: userObject,
        command: v.string(),
        timestamp: v.optional(v.string())
    }),

    chat_logs: defineTable({
        user: v.optional(v.object({ name: v.optional(v.string()), steamId: v.optional(v.string()) })),
        message: v.string(),
        channel: v.optional(v.string()),
        timestamp: v.optional(v.string())
    }),

    lockpicking: defineTable({
        user: userObject,
        success: v.boolean(),
        lockpickable: v.string(),
        teleportCmd: v.string()
    }),

    interactions: defineTable({
        type: v.string(),
        user: userObject,
        description: v.string()
    })
});