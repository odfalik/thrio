import { RoomPublic } from '../../../interfaces';
import {
  checkVictory,
  cloneGrid,
  getDroppedY,
  getNextPlayer,
  getRandInt,
} from './helpers';

export function decideMove(room: RoomPublic): { x: number; z: number } {
  const playerIdx = room.nextPlayerIdx;

  const option = minimax(room.grid, 0, playerIdx, playerIdx);
  console.log('Player', playerIdx, option[0][playerIdx], ':', option);
  return option[1];
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

function minimax(
  grid: RoomPublic['grid'],
  depth: number,
  player: number,
  maximizingPlayer: number
): [number[], { x: number; z: number }] {
  let bestOption: [number[], { x: number; z: number }] = [[], { x: 0, z: 0 }];
  let bestOptionVal = -Infinity;

  for (let x = 0; x < 3; x++) {
    for (let z = 0; z < 3; z++) {
      const y = getDroppedY(grid, x, z);
      if (y !== -1) {
        const optionGrid = simulateMove(grid, x, z, player);

        if (checkVictory(player, optionGrid, x, y, z)) {
          const valArr = [-10, -10, -10];
          valArr[player] = 10;
          const victoryOption: [number[], { x: number; z: number }] = [
            valArr,
            { x, z },
          ];
          return victoryOption;
        } else {
          if (depth >= 7) {
            return [[chaos(), chaos(), chaos()], { x, z }];
          }

          const option = minimax(
            optionGrid,
            depth + 1,
            getNextPlayer(3, player),
            maximizingPlayer
          );

          option[0] = option[0].map((val) => val / 2);
          const optionVal = tupleToVal(player, option[0]) + chaos();

          if (optionVal > bestOptionVal) {
            bestOptionVal = optionVal;
            bestOption = [option[0], { x, z }];
          }
        }
      }
    }
  }

  return bestOption;
}

function chaos(amt = 0.1) {
  return (Math.random() * amt) - (amt / 2);
}

function tupleToVal(player: number, tuple: number[]): number {
  

  return tuple.reduce(
    (accumulator, curr, idx) => accumulator + (idx === player ? curr : -curr),
    0
  );
}

export function randomValidMove(grid: number[][][]) {
  let choice;
  const numLoops = 0;
  do {
    choice = { x: getRandInt(0, 2), z: getRandInt(0, 2) };
  } while (getDroppedY(grid, choice.x, choice.z) === -1 && numLoops < 25);
  return choice;
}
