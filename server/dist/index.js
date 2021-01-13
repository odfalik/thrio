"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./pre-start"); // Must be the first import
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const api_1 = __importDefault(require("./api"));
const logger_1 = __importDefault(require("./logger"));
const auth_1 = __importDefault(require("./auth"));
const cors_1 = __importDefault(require("cors"));
const app = express_1.default();
app.use(cors_1.default());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(cookie_parser_1.default());
// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan_1.default('dev'));
}
// Security
if (process.env.NODE_ENV === 'production') {
    app.use(helmet_1.default());
}
app.use('*', auth_1.default);
app.use('/api', api_1.default);
// Print API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
    logger_1.default.err(err, true);
    return res.status(400).json({
        error: err.message,
    });
});
// Start the server
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    logger_1.default.info('Express server started on port: ' + port);
});
