import app from "../src/app.js";
import { env } from "../src/config/env.js";
import { connectDb } from "../src/config/db.js";

export default async function handler(req, res) {
	await connectDb(env.mongoUri);
	return app(req, res);
}
