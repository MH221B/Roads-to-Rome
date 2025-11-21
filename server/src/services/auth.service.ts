import Role from "../enums/user.enum";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import sendEmail from "./email.service";
import { User } from "../models/user.model";
const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 10;

interface IAuthService {
	Login(
		email: string,
		password: string
	): Promise<{ accessToken: string; refreshToken: string }>;
	Register(
		email: string,
		password: string,
		role: Role
	): Promise<{ message: string }>;
	RefreshToken(token: string): Promise<{ accessToken: string }>;
  // logout currently just clears cookie client-side, but placeholder for future server-side token invalidation with Redis
	Logout(userId: string): Promise<{ message: string }>;
	ForgotPassword(email: string): Promise<{ message: string }>;
	ResetPassword(
		token: string,
		newPassword: string
	): Promise<{ message: string }>;
}

const authService: IAuthService = {
	async Login(
		email: string,
		password: string
	): Promise<{ accessToken: string; refreshToken: string }> {
		//check if user exists
		const user = await User.findOne({ email });
		if (!user) {
			throw new Error("User not found");
		}
		//validate password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			throw new Error("Invalid credentials");
		}
		//generate tokens
		const accessToken = jwt.sign(
			{ userId: user._id, role: user.role },
			process.env.ACCESS_TOKEN_SECRET as string,
			{ expiresIn: "1h" } as SignOptions
		);
		const refreshToken = jwt.sign(
			{ userId: user._id, role: user.role },
			process.env.REFRESH_TOKEN_SECRET as string,
			{ expiresIn: "7d" } as SignOptions
		);
		return { accessToken, refreshToken };
	},

	async Register(
		email: string,
		password: string,
		role: Role
	): Promise<{ message: string }> {
		//check if user exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			throw new Error("User already exists");
		}
		//hash password
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		//create user
		const newUser = new User({
			email,
			password: hashedPassword,
			role,
		});
		await newUser.save();
		return { message: "User registered successfully" };
	},

  async Logout(userId: string) {
    // Placeholder for future server-side token invalidation (e.g. Redis)
    return { message: "Logged out successfully" };
  },

	async RefreshToken(token: string): Promise<{ accessToken: string }> {
		const decoded = jwt.verify(
			token,
			process.env.REFRESH_TOKEN_SECRET as string
		) as { userId: string };
		
		//fetch user to get role
		const user = await User.findById(decoded.userId);
		if (!user) {
			throw new Error("User not found");
		}
		//generate new access token
		const accessToken = jwt.sign(
			{ userId: user._id, role: user.role },
			process.env.ACCESS_TOKEN_SECRET as string,
			{ expiresIn: "1h" } as SignOptions
		);
		return { accessToken };
	},

	async ForgotPassword(email: string): Promise<{ message: string }> {
		// Check if user exists
		const user = await User.findOne({ email });
		if (!user) {
			throw new Error("User not found");
		}
		// Generate a password reset token (valid for 1 hour)
		const resetToken = jwt.sign(
			{ userId: user._id },
			process.env.RESET_PASSWORD_SECRET as string,
			{ expiresIn: "1h" } as SignOptions
		);
		// Send email with reset link
		const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
		const emailText = `You requested a password reset. Click the link to reset your password: ${resetLink}`;
		await sendEmail(email, "Password Reset Request", emailText);
		return { message: "Password reset link has been sent to your email" };
	},

	async ResetPassword(
		token: string,
		newPassword: string
	): Promise<{ message: string }> {
		const decoded = jwt.verify(
			token,
			process.env.RESET_PASSWORD_SECRET as string
		) as { userId: string };
		const user = await User.findById(decoded.userId);
		if (!user) {
			throw new Error("User not found");
		}
		const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
		await User.findByIdAndUpdate(decoded.userId, {
			password: hashedPassword,
		});
		return { message: "Password has been reset successfully" };
	},
};

export default authService;
