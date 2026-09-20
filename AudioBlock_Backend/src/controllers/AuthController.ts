import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRole } from '../entities/User';
import { signS3Url } from '../utils/s3';

export class AuthController {

    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    // Verifies the caller's Privy access token and ensures a matching app
    // user exists, creating one on first sign-in. Idempotent — safe to call
    // on every app load.
    sync = async (req: Request, res: Response) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: No token provided',
                });
            }
            const accessToken = authHeader.split(' ')[1];

            const { role, username } = req.body ?? {};
            // Only these two are self-serve at signup — admin must never be
            // assignable by an unauthenticated caller just because it's a
            // valid UserRole value.
            const SELF_SERVE_ROLES: string[] = [UserRole.LISTENER, UserRole.ARTIST];
            if (role && !SELF_SERVE_ROLES.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid role: ${role}`,
                });
            }

            const { user, isNewUser } = await this.authService.sync(accessToken, role, username);

            res.status(isNewUser ? 201 : 200).json({
                success: true,
                message: isNewUser ? 'User created successfully' : 'User synced successfully',
                user: {
                    ...user,
                    profileImage: signS3Url(user.profileImage),
                    pageCover: signS3Url(user.pageCover),
                },
                isNewUser,
            });
        } catch (error) {
            console.error('Auth sync error:', error);
            this.handleError(res, error);
        }
    }

    private handleError(res: Response, error: unknown): void {
        if (error instanceof Error) {
            console.error("Handled Error:", error.message, error.stack);

            res.status(400).json({ message: error.message });
        } else if (typeof error === 'string') {
            console.error("String Error:", error);
            res.status(400).json({ message: error });
        } else {
            console.error("Unknown Error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
