export interface Player {
    name: string,
    host?: boolean,
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
    status?: string,
    config?: RoomConfig,
    timestamp: number,
}

export interface RoomConfig {
    public: boolean,
    dimensions: number,
    players: number,
    timer: string,
}

export interface User {
    token?: string;
}