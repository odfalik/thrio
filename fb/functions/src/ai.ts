import { RoomPublic } from '../../../interfaces';
import {
  checkVictory,
  cloneGrid,
  getDroppedY,
  getNextPlayer,
  getRandInt,
} from './helpers';

export function decideMove(
  room: RoomPublic
): { x: number; z: number } {
  const playerIdx = room.nextPlayerIdx;

  console.log('decideMove player', playerIdx);

  // Should we build an n-turn minimax tree???
  return decideMinimax(room.grid, playerIdx);
}

function simulateMove(
  grid: RoomPublic['grid'],
  x: number,
  z: number,
  playerIdx: number
): RoomPublic['grid'] {
  const y = getDroppedY(grid, x, z);
  if (y === -1) {
    console.error('Invalid simulateMove', x, z);
    return grid;
  } else {
    const clonedGrid: RoomPublic['grid'] = cloneGrid(grid);
    clonedGrid[x][y][z] = playerIdx;
    return clonedGrid;
  }
}

function decideMinimax(
  grid: RoomPublic['grid'],
  playerIdx: number
): { x: number; z: number } {
  console.log('decideMinimax');
  const [_eval, move] = minimax2(grid, 0, playerIdx, playerIdx);
  console.log('_eval', _eval, move);
  return move;
}

function minimax2(
  grid: RoomPublic['grid'],
  depth: number,
  player: number,
  maximizingPlayer: number
): [number, { x: number; z: number }] {
  let bestOption: [number, { x: number; z: number }] = [
    0,
    randomValidMove(grid),
  ];

  for (let x = 0; x < 3; x++) {
    for (let z = 0; z < 3; z++) {
      const y = getDroppedY(grid, x, z);
      if (y !== -1) {
        if (checkVictory(player, grid, x, y, z)) {
          return [1, { x, z }];
        } else {
          if (depth >= 5) return [0, { x, z }];

          const option = minimax2(
            simulateMove(grid, x, z, player),
            depth + 1,
            getNextPlayer(3, player),
            maximizingPlayer
          );

          if (option[0] > bestOption[0]) bestOption = option;
        }
      }
    }
  }

  return bestOption;
}

export function randomValidMove(grid: number[][][]) {
  let choice;
  const numLoops = 0;
  do {
    choice = { x: getRandInt(0, 2), z: getRandInt(0, 2) };
  } while (getDroppedY(grid, choice.x, choice.z) === -1 && numLoops < 25);
  return choice;
}
