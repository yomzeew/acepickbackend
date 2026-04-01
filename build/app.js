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
const express_1 = __importDefault(require("express"));
const { createServer } = require('http');
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("./config/prisma"));
const configSetup_1 = __importDefault(require("./config/configSetup"));
const redis_1 = __importDefault(require("./config/redis"));
const cors_1 = __importDefault(require("cors"));
const logRoutes_1 = require("./middlewares/logRoutes");
const authorize_1 = require("./middlewares/authorize");
const rateLimiter_1 = require("./middlewares/rateLimiter");
const index_1 = __importDefault(require("./routes/index"));
const auth_1 = __importDefault(require("./routes/auth"));
const general_1 = __importDefault(require("./routes/general"));
const admin_1 = __importDefault(require("./routes/admin"));
const public_1 = __importDefault(require("./routes/public"));
require("reflect-metadata");
const chat_1 = require("./chat");
// Job hook functions (onJobStatusUpdate, onJobCreate) are now called explicitly in controllers
const prom_client_1 = __importDefault(require("prom-client"));
const response_time_1 = __importDefault(require("response-time"));
const app = (0, express_1.default)();
const server = createServer(app);
// -------------------- PROMETHEUS SETUP --------------------
const register = new prom_client_1.default.Registry();
prom_client_1.default.collectDefaultMetrics({ register });
// Custom metrics
const apiResponseHistogram = new prom_client_1.default.Histogram({
    name: "api_response_time_ms",
    help: "API response time in ms",
    labelNames: ["method", "route", "status_code"],
    buckets: [50, 100, 300, 500, 1000, 2000], // ms
});
const dbConnectionsGauge = new prom_client_1.default.Gauge({
    name: "pg_active_connections",
    help: "Number of active PostgreSQL connections",
});
const dbUptimeGauge = new prom_client_1.default.Gauge({
    name: "pg_uptime_seconds",
    help: "PostgreSQL server uptime in seconds",
});
const dbConnectionsTotal = new prom_client_1.default.Gauge({
    name: "pg_connections_total",
    help: "Total number of connection attempts to PostgreSQL",
});
// Register metrics
register.registerMetric(apiResponseHistogram);
register.registerMetric(dbConnectionsGauge);
register.registerMetric(dbUptimeGauge);
register.registerMetric(dbConnectionsTotal);
// Middleware to track response times
app.use((0, response_time_1.default)((req, res, time) => {
    var _a;
    apiResponseHistogram
        .labels(req.method, ((_a = req.route) === null || _a === void 0 ? void 0 : _a.path) || req.url, res.statusCode.toString())
        .observe(time);
}));
const getDBMetrics = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const activeConns = yield prisma_1.default.$queryRaw `SELECT count(*)::int as count FROM pg_stat_activity WHERE state = 'active'`;
        dbConnectionsGauge.set(((_a = activeConns[0]) === null || _a === void 0 ? void 0 : _a.count) || 0);
        const totalConns = yield prisma_1.default.$queryRaw `SELECT count(*)::int as count FROM pg_stat_activity`;
        dbConnectionsTotal.set(((_b = totalConns[0]) === null || _b === void 0 ? void 0 : _b.count) || 0);
        const uptime = yield prisma_1.default.$queryRaw `SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time()))::int as uptime FROM pg_postmaster_start_time()`;
        dbUptimeGauge.set(((_c = uptime[0]) === null || _c === void 0 ? void 0 : _c.uptime) || 0);
    }
    catch (err) {
        console.error("Error fetching DB metrics:", err);
    }
});
app.get("/metrics", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield getDBMetrics();
        res.set("Content-Type", register.contentType);
        res.end(yield register.metrics());
    }
    catch (err) {
        console.error("Error gathering metrics:", err);
        res.status(500).send("Error gathering metrics");
    }
}));
app.get("/metrics/json", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield getDBMetrics();
        res.set("Content-Type", register.contentType);
        res.json(yield register.getMetricsAsJSON());
    }
    catch (err) {
        console.error("Error gathering metrics:", err);
        res.status(500).send("Error gathering metrics");
    }
}));
// ----------------------------------------------------------
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: true }));
app.use("/uploads/", express_1.default.static(path_1.default.join(__dirname, "../public/uploads")));
app.use(logRoutes_1.logRoutes);
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hello, world! This API is working!' });
});
app.get('/api/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let redisStatus = 'not configured';
    if (redis_1.default) {
        try {
            const pong = yield redis_1.default.ping();
            redisStatus = pong === 'PONG' ? 'connected' : 'error';
        }
        catch (_a) {
            redisStatus = 'disconnected';
        }
    }
    res.status(200).json({ status: true, message: 'Server is running', redis: redisStatus });
}));
// Global API rate limiter (100 req/min per IP)
app.use('/api', rateLimiter_1.apiLimiter);
// Public routes (no authentication required)
app.use("/api/public", public_1.default);
// Authenticated routes
app.all('/api/*', authorize_1.isAuthorized);
app.use("/api", index_1.default);
app.use("/api/auth/", auth_1.default);
app.use("/api/admin/", admin_1.default);
app.use("/api/", general_1.default);
(0, chat_1.initSocket)(server);
prisma_1.default.$connect().then(() => {
    console.log("✅ Connected to PostgreSQL database via Prisma!");
    server.listen(configSetup_1.default.PORT || 5000, configSetup_1.default.DEV_HOST || '0.0.0.0', () => console.log(`Server is running on http://${configSetup_1.default.DEV_HOST}:${configSetup_1.default.PORT}`));
}).catch((err) => {
    console.error('❌ Error connecting to the database', err);
    process.exit(1);
});
exports.default = app;
