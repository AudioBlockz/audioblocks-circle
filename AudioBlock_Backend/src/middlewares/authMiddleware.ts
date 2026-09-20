import { Request, Response, NextFunction } from "express";
import { PrivyClient } from "@privy-io/server-auth";
import AppDataSource from "../config/db";
import { User, UserRole } from "../entities/User";

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID as string,
  process.env.PRIVY_APP_SECRET as string
);

async function resolveUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const { userId: privyUserId } = await privy.verifyAuthToken(token);

  return AppDataSource.getRepository(User).findOneBy({ privyUserId });
}

function requireRole(role: UserRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await resolveUser(req);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid or missing token",
        });
      }

      if (user.role !== role) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: ${role} role required`,
        });
      }

      (req as any).user = user;
      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired token",
      });
    }
  };
}

export const authArtistMiddleware = requireRole(UserRole.ARTIST);
export const authListenerMiddleware = requireRole(UserRole.LISTENER);
export const authAdminMiddleware = requireRole(UserRole.ADMIN);

// Any logged-in user, regardless of role — for endpoints (like reading
// your own wallet balance) that every account type should be able to hit.
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing token",
      });
    }
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
    });
  }
}

// Attaches req.user when a valid token is present, but never rejects the
// request — for endpoints public to anonymous visitors that still want to
// personalize the response for a logged-in caller (e.g. "have I voted?").
export async function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await resolveUser(req);
    if (user) (req as any).user = user;
  } catch (error) {
    console.error("Optional auth error (ignored):", error);
  }
  next();
}
