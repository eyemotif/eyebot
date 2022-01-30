type GambleInfo = {
    Info: {
        pointNameSing: string,
        pointNamePlur: string,
        gambleMin?: number,
        gambleMax?: number,
        chatReward: number,
        chatRewardCooldown: number
    },
    Multipliers: Record<string, number>,
    Users: Record<string, number>
}
