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

  console.log('decideMove player', playerIdx);

  // Should we build an n-turn minimax tree???
  return decideMinimax(room.grid, playerIdx);

  // Check for any immediate threats
  // for (let x = 0; x < 3; x++) {
  //   for (let z = 0; z < 3; z++) {
  //     const y = getDroppedY(room.grid, x, z);
  //     if (y !== -1) {
  //       const nextPlayerIdx = getNextPlayer(room.config?.players, playerIdx);
  //       const grid = simulateMove(room.grid, x, z, nextPlayerIdx);

  //       if (checkVictory(nextPlayerIdx, grid, x, y, z)) {
  //         console.log(
  //           `Immediate threat by p${nextPlayerIdx} at `,
  //           { x, y, z },
  //           grid
  //         );
  //         return { x, z };
  //       }
  //     }
  //   }
  // }

  // Random (valid) choice
  const choice = { x: 0, z: 0 };
  do {
    choice.x = getRandInt(0, 2);
    choice.z = getRandInt(0, 2);
  } while (getDroppedY(room.grid, choice.x, choice.z) === -1);

  console.log('Making random move', choice);
  return choice;
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
  console.log('BBBB');
  const [_eval, move] = minimax(
    grid,
    2,
    -Infinity,
    Infinity,
    playerIdx,
    playerIdx,
    -1,
    -1,
    -1,
    true
  );
  console.log('_eval', _eval, move);
  return move || { x: 0, z: 0};
}

function minimax(
  grid: RoomPublic['grid'],
  depth: number,
  alpha: number = Infinity,
  beta: number = -Infinity,
  player: number,
  maximizingPlayer: number,
  x: number,
  y: number,
  z: number,
  isRoot?: boolean
): [number, { x: number, z: number }?] {
  console.log('minimax(', { depth, player, x, y, z }, ')');
  
  /** Calculate static evaluation for current node state */
  if (!isRoot) {
    let staticEval = 0;
    let gameOver = false;
    // console.log(grid);
    if (checkVictory(player, grid, x, y, z)) {
      gameOver = true;
      if (player === maximizingPlayer) staticEval = 1.5;
      else staticEval = -1;
    }
    if (depth === 0 || gameOver) {
      console.log({ staticEval, x, y, z, player, gameOver });
      return [staticEval, { x, z }];
    }
  }

  const potentialMoves: { x: number; y: number, z: number }[] = [];
  for (let _x = 0; _x < 3; _x++) {
    for (let _z = 0; _z < 3; _z++) {
      const y = getDroppedY(grid, _x, _z);
      if (y !== -1)
        potentialMoves.push({ x: _x, y, z: _z });
    }
  }

  const nextPlayer = isRoot ? maximizingPlayer : getNextPlayer(3, player);
  if (player === maximizingPlayer) {
    let maxMove;
    let maxEval = -Infinity;
    for (let m = 0; m < potentialMoves.length; m++) {
      const move = potentialMoves[m];
      const child = simulateMove(grid, move.x, move.z, nextPlayer);
      const res = minimax(
        child,
        depth - 1,
        alpha,
        beta,
        nextPlayer,
        maximizingPlayer,
        move.x,
        move.y,
        move.z
      );
      if (isRoot) maxMove = maxEval < res[0] ? { x: move.x, z: move.z } : maxMove;
      maxEval = Math.max(maxEval, res[0]);
      if (beta <= alpha) break;
    }
    return [maxEval, maxMove];
  } else {
    let minMove;
    let minEval = Infinity;
    for (let m = 0; m < potentialMoves.length; m++) {
      const move = potentialMoves[m];
      const child = simulateMove(grid, move.x, move.z, nextPlayer);
      const res = minimax(
        child,
        depth - 1,
        alpha,
        beta,
        nextPlayer,
        maximizingPlayer,
        move.x,
        move.y,
        move.z
      );
      if (isRoot) minMove = minEval < res[0] ? minMove : { x: move.x, z: move.z };
      minEval = Math.min(minEval, res[0]);
      if (beta <= alpha) break;
    }
    return [minEval, minMove];
  }
}
