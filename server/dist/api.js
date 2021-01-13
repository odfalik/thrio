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
// import { Room, RoomPublic } from './../../interfaces';
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const apiRouter = express_1.Router();
apiRouter.get('/get-rooms', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    res.send(availableRoomPublics);
}));
// apiRouter.post('/join-room');
// apiRouter.post('/new-room');
// apiRouter.post('/reset-room');
// apiRouter.post('/make-move');
// apiRouter.post('/save-token');
exports.default = apiRouter;
