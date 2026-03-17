import express, { Request, Response } from 'express';
const { createServer } = require('http');
import * as dotenv from 'dotenv';
import path from "path";
import prisma from './config/prisma';
import config from './config/configSetup';
import redis from './config/redis';
import cors from 'cors';
import { logRoutes } from './middlewares/logRoutes';
import { isAuthorized } from './middlewares/authorize';
import index from './routes/index';
import auth from './routes/auth';
import general from './routes/general';
import admin from './routes/admin'
import publicRoutes from './routes/public';
import "reflect-metadata";
import { initSocket } from './chat';
// Job hook functions (onJobStatusUpdate, onJobCreate) are now called explicitly in controllers
import client from "prom-client";
import responseTime from "response-time";

const app = express();
const server = createServer(app);

// -------------------- PROMETHEUS SETUP --------------------
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metrics
const apiResponseHistogram = new client.Histogram({
    name: "api_response_time_ms",
    help: "API response time in ms",
    labelNames: ["method", "route", "status_code"],
    buckets: [50, 100, 300, 500, 1000, 2000], // ms
});

const dbConnectionsGauge = new client.Gauge({
    name: "pg_active_connections",
    help: "Number of active PostgreSQL connections",
});

const dbUptimeGauge = new client.Gauge({
    name: "pg_uptime_seconds",
    help: "PostgreSQL server uptime in seconds",
});

const dbConnectionsTotal = new client.Gauge({
    name: "pg_connections_total",
    help: "Total number of connection attempts to PostgreSQL",
});

// Register metrics
register.registerMetric(apiResponseHistogram);
register.registerMetric(dbConnectionsGauge);
register.registerMetric(dbUptimeGauge);
register.registerMetric(dbConnectionsTotal);

// Middleware to track response times
app.use(
    responseTime((req: Request, res: Response, time: any) => {
        apiResponseHistogram
            .labels(req.method, req.route?.path || req.url, res.statusCode.toString())
            .observe(time);
    })
);

const getDBMetrics = async () => {
    try {
        const activeConns: any[] = await prisma.$queryRaw`SELECT count(*)::int as count FROM pg_stat_activity WHERE state = 'active'`;
        dbConnectionsGauge.set(activeConns[0]?.count || 0);

        const totalConns: any[] = await prisma.$queryRaw`SELECT count(*)::int as count FROM pg_stat_activity`;
        dbConnectionsTotal.set(totalConns[0]?.count || 0);

        const uptime: any[] = await prisma.$queryRaw`SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time()))::int as uptime FROM pg_postmaster_start_time()`;
        dbUptimeGauge.set(uptime[0]?.uptime || 0);
    } catch (err) {
        console.error("Error fetching DB metrics:", err);
    }
}

app.get("/metrics", async (req: Request, res: Response) => {
    try {
        await getDBMetrics();

        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        console.error("Error gathering metrics:", err);
        res.status(500).send("Error gathering metrics");
    }
});

app.get("/metrics/json", async (req: Request, res: Response) => {
    try {
        await getDBMetrics();

        res.set("Content-Type", register.contentType);
        res.json(await register.getMetricsAsJSON());
    } catch (err) {
        console.error("Error gathering metrics:", err);
        res.status(500).send("Error gathering metrics");
    }
});

// ----------------------------------------------------------

app.use(express.json());
app.use(cors({ origin: true }));

app.use("/uploads/", express.static(path.join(__dirname, "../public/uploads")));

app.use(logRoutes);

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Hello, world! This API is working!' });
});

app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: true, message: 'Server is running' });
});

// Public routes (no authentication required)
app.use("/api/public", publicRoutes);

// Authenticated routes
app.all('/api/*', isAuthorized);

app.use("/api", index);
app.use("/api/auth/", auth);
app.use("/api/admin/", admin);
app.use("/api/", general);

initSocket(server);

prisma.$connect().then(() => {
    console.log("✅ Connected to PostgreSQL database via Prisma!");
    server.listen(
        config.PORT || 5000,
        config.DEV_HOST || '0.0.0.0',
        () => console.log(`Server is running on http://${config.DEV_HOST}:${config.PORT}`)
    );
}).catch((err: any) => {
    console.error('❌ Error connecting to the database', err);
    process.exit(1);
});

export default app;
