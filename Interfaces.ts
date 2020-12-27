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
    roomCode?: string,
    time: number,
    grid: number[][][],
    players?: Player[],
    nextPlayer: number,
    waiting?: any[],
    victor?: number | null,
    isFull?: boolean,
}