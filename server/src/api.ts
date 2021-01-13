import { Room, RoomPublic } from './../../interfaces';
import { Router } from 'express';
import * as admin from 'firebase-admin';

const apiRouter = Router();

apiRouter.get('/get-rooms', async (req, res) => {

  const rooms: Room[] = Object.values(
    (
      await admin
        .database()
        .ref('rooms')
        .orderByChild('public/status')
        .equalTo('waiting')
        .get()
    ).val() || {}
  );

  const availableRoomPublics: RoomPublic[] = rooms
    ? rooms
        .filter((r) => r.public.config?.public)
        .sort((a, b) => b.public.timestamp - a.public.timestamp)
        .slice(0, 15)
        .map((room: any) => {
          room.public['hostName'] = room.public.players?.find(
            (p: any) => p.host
          ).name;
          return room.public;
        })
    : [];

  res.send(availableRoomPublics);
});
// apiRouter.post('/join-room');
// apiRouter.post('/new-room');
// apiRouter.post('/reset-room');
// apiRouter.post('/make-move');
// apiRouter.post('/save-token');

export default apiRouter;
