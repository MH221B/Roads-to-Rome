import Role from "../enums/user.enum";
import bcrypt from "bcryptjs";
import jwt, {SignOptions} from "jsonwebtoken";
import { User } from "../models/user.model";
const saltRounds = 15;

interface IAuthService {
  Login(email: string, password: string): Promise<{accessToken: string; refreshToken: string}>;
  Register(email: string, password: string, role: Role): Promise<{ message: string }>;
  RefreshToken(userId: string): Promise<{ accessToken: string }>;
}

const authService: IAuthService = {
  async Login(email: string, password: string): Promise<{accessToken: string; refreshToken: string}> {
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

  async Register(email: string, password: string, role: Role): Promise<{ message: string }> {
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
      role
    });
    await newUser.save();
    return { message: "User registered successfully" };
  },

  async RefreshToken(userId: string): Promise<{ accessToken: string }> {
    //fetch user to get role
    const user = await User.findById(userId);
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
  }
}

export default authService;