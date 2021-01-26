export interface Player {
    name: string,
    host?: boolean,
    bot?: boolean,
}

export interface Room {
    public: RoomPublic,
    secret?: {
        players: { uid: string }[]
    }
}

export interface RoomPublic {
    grid: number[][][],
    lastMove?: { x: number, y: number, z: number } & string,
    nextPlayerIdx: number,
    roomCode?: string,
    players?: Player[],
    victor?: number | null,
    status?: string,        // "waiting", "playing"
    config?: RoomConfig,
    timestamp: number,
}

export interface RoomConfig {
    public: boolean,
    gridsize: number,
    players: number,    // number of humans + number of bots
    bots?: number,
    timer: string,
}

export interface User {
    token?: string;
    prefs?: {
        graphics: number,
        doubleTap: boolean,
    }
}