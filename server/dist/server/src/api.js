"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const apiRouter = express_1.Router();
/** getRooms$ */
apiRouter.get('/rooms', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const rooms = Object.values((yield admin
        .database()
        .ref('rooms')
        .orderByChild('public/status')
        .equalTo('waiting')
        .get()).val() || {});
    const availableRoomPublics = rooms
        ? rooms
            .filter((r) => { var _a; return (_a = r.public.config) === null || _a === void 0 ? void 0 : _a.public; })
            .sort((a, b) => b.public.timestamp - a.public.timestamp)
            .slice(0, 15)
            .map((room) => {
            var _a;
            room.public['hostName'] = (_a = room.public.players) === null || _a === void 0 ? void 0 : _a.find((p) => p.host).name;
            return room.public;
        })
        : [];
    return res.send(availableRoomPublics);
}));
/** newRoom$ */
apiRouter.post('/rooms', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const roomCode = makeId(4);
    const hostName = (yield admin.auth().getUser(res.locals.user.uid))
        .displayName;
    const _reset = yield resetRoom(roomCode, {
        roomCode: roomCode,
        players: [{ name: hostName, host: true }],
        config: Object.assign({}, req.body),
        status: 'waiting',
    }, {
        players: [{ uid: res.locals.user.uid }],
    });
    return res.send({ roomCode });
}));
function resetRoom(roomCode, publicOverwrites, secretOverwrites) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        const roomRef = admin.database().ref('rooms/' + roomCode);
        let room = (yield roomRef.get()).val();
        const grid = [
            [
                [-1, -1, -1],
                [-1, -1, -1],
                [-1, -1, -1],
            ],
            [
                [-1, -1, -1],
                [-1, -1, -1],
                [-1, -1, -1],
            ],
            [
                [-1, -1, -1],
                [-1, -1, -1],
                [-1, -1, -1],
            ],
        ];
        room = {
            public: Object.assign({ config: (_a = room === null || room === void 0 ? void 0 : room.public) === null || _a === void 0 ? void 0 : _a.config, players: ((_b = room === null || room === void 0 ? void 0 : room.public) === null || _b === void 0 ? void 0 : _b.players) || [], timestamp: Date.now(), nextPlayerIdx: ((_c = room === null || room === void 0 ? void 0 : room.public) === null || _c === void 0 ? void 0 : _c.victor) || 0, roomCode: (_d = room === null || room === void 0 ? void 0 : room.public) === null || _d === void 0 ? void 0 : _d.roomCode, grid, victor: null, lastMove: 'reset', status: 'playing' }, publicOverwrites),
            secret: Object.assign({ players: ((_e = room === null || room === void 0 ? void 0 : room.secret) === null || _e === void 0 ? void 0 : _e.players) || [] }, secretOverwrites),
        };
        roomRef.set(room);
    });
}
/** joinRoom$ */
apiRouter.get('/rooms/:roomCode/join', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    if (!((_a = req.params) === null || _a === void 0 ? void 0 : _a.roomCode))
        res.status(400).send('No room code supplied');
    const roomRef = admin.database().ref('rooms/' + req.params.roomCode);
    const room = (yield roomRef.get()).val();
    if (room) {
        const playerIdx = (_c = (_b = room.secret) === null || _b === void 0 ? void 0 : _b.players) === null || _c === void 0 ? void 0 : _c.findIndex((p) => { var _a; return p.uid === ((_a = res.locals.user) === null || _a === void 0 ? void 0 : _a.uid); });
        const inRoom = playerIdx !== undefined && playerIdx !== -1;
        const roomCode = room.public.roomCode;
        if (inRoom) {
            res.send({ roomCode, playerIdx });
        }
        else {
            if (room.public.status !== 'waiting') {
                // Joining a full room (make spectator)
                return res.send({ roomCode, playerIdx: -1 });
            }
            yield roomRef
                .child('secret/players')
                .update([
                ...(room.secret ? room.secret.players : []),
                { uid: res.locals.user.uid },
            ]);
            let newPlayerName = (yield admin.auth().getUser(res.locals.user.uid)).displayName ||
                'GUEST';
            /* Check if another player with same name is in room */
            if ((_d = room.public.players) === null || _d === void 0 ? void 0 : _d.some((p) => p.name === newPlayerName)) {
                newPlayerName += '2';
            }
            const status = ((_f = (_e = room.public) === null || _e === void 0 ? void 0 : _e.players) === null || _f === void 0 ? void 0 : _f.length) === 3 - 1 ? 'playing' : 'waiting';
            const publicUpdate = {
                players: [
                    // Add new player
                    ...(room.public.players ? room.public.players : []),
                    {
                        name: newPlayerName.trim(),
                    },
                ],
                status,
            };
            const _update = yield roomRef.child('public').update(publicUpdate);
            return res.send({ playerIdx: publicUpdate.players.length - 1, roomCode });
        }
    }
    else {
        return res.status(400).send('Could not get room ' + req.params.roomCode);
    }
}));
/** resetRoom$ */
apiRouter.get('/rooms/:roomCode/reset', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h;
    if (!((_g = res.locals.user) === null || _g === void 0 ? void 0 : _g.uid))
        return res.status(403).send('Must be authenticated to reset room');
    if (!((_h = req.params) === null || _h === void 0 ? void 0 : _h.roomCode))
        return res.status(400).send('Room code is required');
    const roomRef = admin.database().ref('rooms/' + req.params.roomCode);
    if ((yield roomRef.child('public/status').get()).val() !== 'over')
        return res.status(400).send("Can only reset a status:'over' room");
    if ((yield roomRef.child('secret/players/0/uid').get()).val() !==
        res.locals.user.uid)
        return res.status(403).send('Only host may reset room');
    return res.send(resetRoom(req.params.roomCode));
}));
/** makeMove$ */
apiRouter.post('/rooms/:roomCode/move', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    const roomRef = admin.database().ref('rooms/' + req.params.roomCode);
    const roomSnap = yield roomRef.get();
    if (!roomSnap.exists()) {
        return res.status(400).send('Room does not exist');
    }
    const room = yield roomSnap.val();
    const playerIdx = (_j = room.secret) === null || _j === void 0 ? void 0 : _j.players.findIndex((p) => { var _a; return p.uid === ((_a = res.locals.user) === null || _a === void 0 ? void 0 : _a.uid); });
    const nextPlayerIdx = room.public.nextPlayerIdx;
    if (nextPlayerIdx === playerIdx) {
        const grid = room.public.grid;
        // check bottom up (gravity) if space in column
        let y = -1;
        for (let yCheck = 0; yCheck < 3; yCheck++) {
            if (grid[req.body.x][yCheck][req.body.z] < 0) {
                // unoccupied
                y = yCheck;
                break;
            }
        }
        if (y === -1) {
            return res.status(400).send('Invalid move -- column is full');
        }
        else {
            const victory = checkVictory(playerIdx, grid, req.body.x, y, req.body.z);
            const roomUpdate = {};
            roomUpdate[`public/timestamp`] = Date.now();
            roomUpdate[`public/grid/${req.body.x}/${y}/${req.body.z}`] = nextPlayerIdx;
            roomUpdate[`public/lastMove`] = { x: req.body.x, y, z: req.body.z };
            roomUpdate['public/nextPlayerIdx'] = victory
                ? -1
                : nextPlayerIdx + 1 === 3
                    ? 0
                    : nextPlayerIdx + 1;
            roomUpdate['public/victor'] = victory ? playerIdx : null;
            if (victory)
                roomUpdate['public/status'] = 'over';
            yield roomRef.update(roomUpdate);
        }
    }
    else {
        return res.status(403).send(`Not your turn, ${nextPlayerIdx}:${playerIdx}`);
    }
}));
exports.default = apiRouter;
function makeId(len = 3) {
    let result = '';
    const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const charactersLength = characters.length;
    for (let i = 0; i < len; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function checkVictory(player, grid, x, y, z) {
    const vectors = [];
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
    return vectors === null || vectors === void 0 ? void 0 : vectors.some((v) => {
        let counter = 1;
        countMatches(false);
        countMatches(true);
        return counter === grid.length;
        function countMatches(invert) {
            const m = invert ? -1 : 1;
            let cx = x + v.x * m;
            let cy = y + v.y * m;
            let cz = z + v.z * m;
            while (checkExists(grid.length, cx, cy, cz) &&
                grid[cx][cy][cz] === player) {
                cx += v.x * m;
                cy += v.y * m;
                cz += v.z * m;
                counter++;
            }
            function checkExists(sideLen, _x, _y, _z) {
                return (_x >= 0 &&
                    _x < sideLen &&
                    _y >= 0 &&
                    _y < sideLen &&
                    _z >= 0 &&
                    _z < sideLen);
            }
        }
    });
}
