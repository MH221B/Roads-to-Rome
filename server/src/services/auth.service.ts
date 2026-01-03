import fs from 'fs/promises';
import path from 'path';
import Role from '../enums/user.enum';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import sendEmail from './email.service';
import { User } from '../models/user.model';
const saltRounds = process.env.NODE_ENV === 'test' ? 1 : 15;

interface IAuthService {
  Login(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string; locked: boolean }>;
  Register(
    email: string,
    password: string,
    role: Role,
    username?: string,
    fullName?: string
  ): Promise<{ message: string }>;
  RefreshToken(token: string): Promise<{ accessToken: string; locked: boolean }>;
  // logout currently just clears cookie client-side, but placeholder for future server-side token invalidation with Redis
  Logout(userId: string): Promise<{ message: string }>;
  ForgotPassword(email: string): Promise<{ message: string }>;
  ResetPassword(token: string, newPassword: string): Promise<{ message: string }>;
  GetGithubOAuthUrl(): string;
  GithubLogin(
    code: string
  ): Promise<{ accessToken: string; refreshToken: string; locked: boolean }>;
  GetProfile(userId: string): Promise<{
    id: string;
    email: string;
    username?: string;
    fullName?: string;
    role: Role;
    budget: number;
    createdAt: Date;
  }>;
}

const authService: IAuthService = {
  async Login(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string; locked: boolean }> {
    //check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    //validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    //generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '1h' } as SignOptions
    );
    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: '7d' } as SignOptions
    );

    // NOTE: Do not log tokens in production. If needed, log only non-sensitive info for debugging.
    return { accessToken, refreshToken, locked: user.locked || false };
  },

  async Register(
    email: string,
    password: string,
    role: Role,
    username?: string,
    fullName?: string
  ): Promise<{ message: string }> {
    // check if email or username already exists
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      throw new Error('User already exists');
    }
    if (username) {
      const existingByUsername = await User.findOne({ username });
      if (existingByUsername) {
        throw new Error('Username already exists');
      }
    }
    //hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    //create user
    const newUser = new User({
      email,
      password: hashedPassword,
      role,
      username,
      fullName,
    });
    await newUser.save();
    return { message: 'User registered successfully' };
  },

  async Logout(userId: string) {
    // Placeholder for future server-side token invalidation (e.g. Redis)
    return { message: 'Logged out successfully' };
  },

  async RefreshToken(token: string): Promise<{ accessToken: string; locked: boolean }> {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as {
      userId: string;
    };

    //fetch user to get role
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }
    //generate new access token
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '1h' } as SignOptions
    );
    return { accessToken, locked: user.locked || false };
  },

  async ForgotPassword(email: string): Promise<{ message: string }> {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    // Generate a password reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.RESET_PASSWORD_SECRET as string,
      { expiresIn: '1h' } as SignOptions
    );
    // Send email with reset link
    // Use path param so it matches client route `/reset-password/:token`
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const emailText =
      'You requested a password reset.\n\n' +
      `Use the link below to choose a new password: ${resetLink}\n` +
      'If you did not request this, you can safely ignore this email. The link is valid for 1 hour.';

    let emailHtml: string | undefined;
    try {
      const templatePath = path.resolve(__dirname, '..', '..', 'templates', 'password-reset.html');
      const template = await fs.readFile(templatePath, 'utf8');
      emailHtml = template.replace(/{{RESET_LINK}}/g, resetLink);
    } catch (err) {
      console.error('Failed to load password reset email template', err);
    }

    await sendEmail(email, 'Password Reset Request', emailText, emailHtml);
    return { message: 'Password reset link has been sent to your email' };
  },

  async ResetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET as string) as {
      userId: string;
    };
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await User.findByIdAndUpdate(decoded.userId, {
      password: hashedPassword,
    });
    return { message: 'Password has been reset successfully' };
  },

  GetGithubOAuthUrl(): string {
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
  },

  async GithubLogin(
    code: string
  ): Promise<{ accessToken: string; refreshToken: string; locked: boolean }> {
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      throw new Error('GitHub Client ID or Secret is not defined');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      error?: string;
      error_description?: string;
    };

    if (tokenData.error) {
      throw new Error(`GitHub Auth Error: ${tokenData.error_description}`);
    }

    const githubAccessToken = tokenData.access_token;

    // Get user emails
    const userResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user emails from GitHub');
    }

    const emails = (await userResponse.json()) as {
      email: string;
      primary: boolean;
      verified: boolean;
    }[];
    const primaryEmailObj = emails.find((email) => email.primary && email.verified);

    if (!primaryEmailObj) {
      throw new Error('No primary verified email found on GitHub account.');
    }

    const email = primaryEmailObj.email;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create user with random password since they use GitHub login
      const randomPassword =
        Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);
      // attempt to fetch github profile to populate username/fullName
      let githubLogin: string | undefined;
      let githubName: string | undefined;
      try {
        const profileResponse = await fetch('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${githubAccessToken}` },
        });
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          githubLogin = profile.login;
          githubName = profile.name;
        }
      } catch (err) {
        // ignore profile fetch errors; proceed with defaults
      }

      user = new User({
        email,
        password: hashedPassword,
        role: Role.STUDENT, // Default role for new users
        githubAutoGenerated: true,
        username: githubLogin ?? email.split('@')[0],
        fullName: githubName ?? "To be added by user",
      });
      await user.save();

      // Send the user an email containing the generated password so they can log in with email/password if needed
      // We do not store the plaintext password in DB; only the hashed password is stored for security.
      try {
        await sendEmail(
          email,
          'Welcome to Roads to Rome — GitHub Sign-In',
          `A new account was created for you via GitHub login. You may log in with your email: ${email} and this password: ${randomPassword}\n\n` +
            'It is recommended that you change your password after logging in.'
        );
      } catch (err) {
        // Don't block login just because email couldn't be sent; log for debugging
        console.error('Failed to send welcome email to user created via GitHub', err);
      }
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '1h' } as SignOptions
    );
    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: '7d' } as SignOptions
    );

    return { accessToken, refreshToken, locked: user.locked || false };
  },

  async GetProfile(userId: string) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: String(user._id),
      email: user.email,
      username: user.username,
      fullName: (user as any).fullName,
      role: user.role as Role,
      budget: typeof (user as any).budget === 'number' ? (user as any).budget : 0,
      createdAt: (user as any).createdAt,
    };
  },
};

export default authService;
