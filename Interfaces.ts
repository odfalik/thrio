export interface Player {
    name: string,
    host?: boolean,
}

export interface Room {
    roomCode?: string,
    time: number,
    grid: number[][][],
    players?: Player[],
    nextPlayer?: number,
    waiting?: any[],
    victor?: number,
}