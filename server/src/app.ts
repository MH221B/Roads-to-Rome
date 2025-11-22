// src/app.ts
import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.route";

const app = express();

app.use(cors({
	origin: process.env.CLIENT_URL || "http://localhost:5173",
	credentials: true
}));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

// Session Middleware
app.use(
	session({
		secret: process.env.SESSION_SECRET || "defaultsecret",
		resave: false, // Don't save session if unmodified
		saveUninitialized: false, // Don't create session until something stored
		cookie: {
			secure: process.env.NODE_ENV === "production", // True in production (HTTPS)
			httpOnly: true, // Prevents JS on client from reading the cookie (XSS protection)
			maxAge: 1000 * 60 * 60 * 24, // 1 Day
		},
	})
);

// Routes
app.use("/api/auth", authRouter);

export default app;
