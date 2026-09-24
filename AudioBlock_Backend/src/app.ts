import cookieParser from "cookie-parser";
import express, {
  Request,
  Response,
  RequestHandler,
  ErrorRequestHandler,
} from "express";
import morgan from "morgan";
import cors from "cors";
import redis from "./config/redis";
import authRoutes from "./routes/authRoutes";
import artistRoutes from "./routes/artistRoutes";
import twitterRoutes from "./routes/twitterRoutes";
import walletRoutes from "./routes/walletRoutes";
import SongRoutes from "./routes/SongRoutes";
import poolRoutes from "./routes/poolRoutes";
import collectionRoutes from "./routes/collectionRoutes";
import roomRoutes from "./routes/roomRoutes";
import { MulterError } from "multer";
import { FiatDepositController } from "./controllers/FiatDepositController";
import { RoomController } from "./controllers/RoomController";


// Route imports

// Initialize express app
const app = express();

// Apply middleware
// Apply global middlewares
app.use(cookieParser());
app.use(morgan("dev"));

// CORS configuration
// Next.js dev auto-increments its port (3000 -> 3001 -> 3002...) whenever a
// lower one is already taken by another process, so hardcoding one or two
// port numbers breaks the moment that happens. In development, allow any
// localhost/127.0.0.1 origin regardless of port; in production, only the
// explicit allowlist below.
const isLocalhostOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

// FRONTEND_URL already exists for building redirect links (see
// FiatDepositService/RoomTicketService) — reused here too, comma-separated,
// so pointing this at a new domain (or adding a preview deploy) is just an
// env var change, not a code edit + redeploy.
const productionAllowedOrigins: string[] = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header (curl, server-to-server calls) — allow.
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== "production" && isLocalhostOrigin(origin)) {
        return callback(null, true);
      }
      if (productionAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Authorization"],
    maxAge: 86400, // 24 hours
  }),
);

// Stripe webhooks must be registered BEFORE express.json() below — Stripe
// signs the exact raw request bytes, and a body that's already been parsed
// and would be re-serialized differently fails signature verification even
// though the payload is byte-identical in content.
const fiatDepositController = new FiatDepositController();
app.post(
  "/api/pool/deposit/fiat/stripe/webhook",
  express.raw({ type: "application/json" }),
  fiatDepositController.stripeWebhook
);

// Paystack's HMAC signature is likewise computed over the raw request
// bytes — same reasoning as the Stripe webhook above.
app.post(
  "/api/pool/deposit/fiat/paystack/webhook",
  express.raw({ type: "application/json" }),
  fiatDepositController.paystackWebhook
);

// Same raw-body requirement as the pool deposit webhooks above, for room
// ticket purchases paid by card/Naira.
const roomController = new RoomController();
app.post(
  "/api/rooms/ticket/stripe/webhook",
  express.raw({ type: "application/json" }),
  roomController.stripeWebhook
);
app.post(
  "/api/rooms/ticket/paystack/webhook",
  express.raw({ type: "application/json" }),
  roomController.paystackWebhook
);

app.use(express.json());


// Add timeout configurations
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000); // 30 seconds
  next();
});



// Log application startup


// Define routes
app.use("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/artist", artistRoutes);

// Dynamic wallet routes
app.use("/api/wallet", walletRoutes);

// Song wallet
app.use("/api/song", SongRoutes);

// Community pool: deposits, voting, admin-triggered payout
app.use("/api/pool", poolRoutes);

// Multi-artist collections: create, invite/accept, attach songs
app.use("/api/collections", collectionRoutes);

// Listening rooms: artist-hosted paid access to unreleased tracks + reviews
app.use("/api/rooms", roomRoutes);


//TWITTER CALLBACK ROUTE
app.use("/api/auth/twitter", twitterRoutes);


app.get('/redis-test', async (req, res) => {
  await redis.set('greeting', 'hello world');
  const value = await redis.get('greeting');
  res.send({ value });
});


// Error handling middleware
const customErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Multer throws these for oversized/malformed uploads (e.g. a photo over
  // the configured limit) — worth a clear 400 instead of a bare 500, since
  // the message is meant to be shown to the user, not just logged.
  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "That file is too large. Please upload an image under 8MB."
        : err.message;
    return res.status(400).json({ error: "Bad Request", message });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
};

app.use(customErrorHandler);

// Handle 404 errors
app.use(((req: Request, res: Response) => {
  console.log("404 - Route not found:", req.originalUrl);
  res.status(404).json({
    error: "error",
    message: `Route ${req.originalUrl} not found`,
  });
}) as RequestHandler);

// Export app
export default app;
