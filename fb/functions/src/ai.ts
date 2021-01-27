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
  console.log('decideMove player', playerIdx, '--------');
  console.log(room.grid);

  const option = minimax(room.grid, 0, playerIdx, playerIdx);
  console.log('Final option', option);
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

let counter = 0;
function log(depth: number, ...args: any[]) {
  console.log(counter, '- '.repeat(depth), ...args);
  counter++;
}

function minimax(
  grid: RoomPublic['grid'],
  depth: number,
  player: number,
  maximizingPlayer: number
): [number, { x: number; z: number }] {
  let bestOption: [number, { x: number; z: number }] = [
    -Infinity,
    randomValidMove(grid),
  ];

  for (let x = 0; x < 3; x++) {
    for (let z = 0; z < 3; z++) {
      const y = getDroppedY(grid, x, z);
      if (y !== -1) {
        const optionGrid = simulateMove(grid, x, z, player);

        if (checkVictory(player, optionGrid, x, y, z)) {
          const victoryOption: [number, { x: number; z: number }] = [
            100 / depth,
            { x, z },
          ];
          log(depth, `P${player} victory found`, victoryOption);
          return victoryOption;
        } else {
          if (depth >= 3) {
            return [0, { x, z }];
          }

          const option = minimax(
            optionGrid,
            depth + 1,
            getNextPlayer(3, player),
            maximizingPlayer
          );
          option[0] = -option[0];          

          if (option[0] > bestOption[0]) {
            bestOption = option;
            log(depth, 'New best option: ', bestOption);
          }
        }
      }
    }
  }

  log(depth, { player, bestOption });
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
