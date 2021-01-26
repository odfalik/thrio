import { RoomPublic } from "../../../interfaces";

export function checkDraw(grid: RoomPublic['grid']): boolean {
  if (grid.every((x) => x.every((y) => y.every((val) => val !== -1)))) return true;
  return false
}


export function checkVictory(
  player: number,
  grid: RoomPublic['grid'], // assumed to already contain the move we're checking
  x: number,
  y: number,
  z: number
): boolean {
  const vectors: { x: number; y: number; z: number }[] = [];
  vectors.push({ x: 0, y: 0, z: 1 }); // 1D
  for (let _z = -1; _z <= 1; _z++) {
    // 2D
    vectors.push({ x: 1, y: 0, z: _z });
  }
  for (let _x = -1; _x <= 1; _x++) {
    // Top hemisphere
    for (let _z = -1; _z <= 1; _z++) {
      vectors.push({ x: _x, y: 1, z: _z });
    }
  }

  return vectors?.some((v) => {
    let counter = 1;

    countMatches(false);
    countMatches(true);

    return counter === grid.length;

    function countMatches(invert: boolean) {
      const m = invert ? -1 : 1;
      let cx = x + v.x * m;
      let cy = y + v.y * m;
      let cz = z + v.z * m;

      while (
        checkExists(grid.length, cx, cy, cz) &&
        grid[cx][cy][cz] === player
      ) {
        cx += v.x * m;
        cy += v.y * m;
        cz += v.z * m;
        counter++;
      }

      function checkExists(
        sideLen: number,
        _x: number,
        _y: number,
        _z: number
      ): boolean {
        return (
          _x >= 0 &&
          _x < sideLen &&
          _y >= 0 &&
          _y < sideLen &&
          _z >= 0 &&
          _z < sideLen
        );
      }
    }
  });
}

export function getNextPlayer(numPlayers: number = 3, playerIdx: number) {
  return playerIdx + 1 === numPlayers
    ? 0
    : playerIdx + 1
}


/** Check bottom up (gravity) for space in column
 * @return y value; -1 if no space
 * */
export function getDroppedY(grid: RoomPublic['grid'], x: number, z: number): number {
  for (let yCheck = 0; yCheck < 3; yCheck++) {
    if (grid[x][yCheck][z] < 0) {
      // unoccupied
      return yCheck;
    }
  }
  return -1;
}

export function cloneGrid(grid: RoomPublic['grid']): RoomPublic['grid'] {
  return JSON.parse(JSON.stringify(grid));
  const len = grid.length,
  copy = new Array(len);
  for (var i = 0; i < len; ++i)
    copy[i] = grid[i].slice(0);
  return copy;
}


export function makeId(len = 3) {
  let result = '';
  const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const charactersLength = characters.length;
  for (let i = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


export function getRandInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}


export function delay(ms: number){
  return new Promise(resolve => setTimeout(resolve, ms))
}