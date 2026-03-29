import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";

const app = express();

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) {
				return callback(null, true);
			}

			if (env.clientOrigins.includes(origin)) {
				return callback(null, true);
			}

			return callback(new Error("CORS blocked for this origin"));
		}
	})
);
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/staff", staffRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
