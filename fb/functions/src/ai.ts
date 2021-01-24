import { RoomPublic } from '../../../interfaces';
import { getDroppedY, getRandInt } from './helpers';

export function decideMove(room: RoomPublic): { x: number; z: number } {
  // const botIdx = room.nextPlayerIdx;

  // Random (valid) choice
  const choice = { x: 0, z: 0 };
  do {
    choice.x = getRandInt(0, 2);
    choice.z = getRandInt(0, 2);
  } while (getDroppedY(room, choice.x, choice.z) === -1);

  return choice;
}
