import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateToken = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && typeof authHeader === 'string' ? authHeader.split(" ")[1] : undefined;

	if (!token) {
		res.status(401).json({ message: "Access token required" });
		return;
	}

	try {
		const secret =
			process.env.ACCESS_TOKEN_SECRET || "default_access_secret";
		const decoded = jwt.verify(token, secret);
		(req as any).user = decoded;
		next();
	} catch (error) {
		res.status(403).json({ message: "Invalid or expired token" });
	}
};
