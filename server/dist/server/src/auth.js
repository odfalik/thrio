"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fb_1 = __importDefault(require("./fb"));
const getAuthToken = (req, res, next) => {
    var _a;
    if (((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[0]) === 'Bearer') {
        req.authToken = req.headers.authorization.split(' ')[1];
    }
    else {
        req.authToken = null;
    }
    next();
};
const authenticate = (req, res, next) => {
    getAuthToken(req, res, () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { authToken } = req;
            const uid = (yield fb_1.default.auth().verifyIdToken(authToken)).uid;
            req.user = yield fb_1.default.auth().getUser(uid);
            return next();
        }
        catch (e) {
            console.log(e);
            return res
                .status(401)
                .send({ error: 'You are not authorized to make this request' });
        }
    }));
};
exports.default = authenticate;
