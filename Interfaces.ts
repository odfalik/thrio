export interface Player {
    name: string,
    host?: boolean,
}

export interface Room {
    timestamp: number,
    public: RoomPublic,
    secret?: {
        players: { uid: string }[]
    }
}

export interface RoomPublic {
    grid: number[][][],
    nextPlayerIdx: number,
    roomCode?: string,
    players?: Player[],
    waiting?: any[],
    victor?: number | null,
    config?: RoomConfig,
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