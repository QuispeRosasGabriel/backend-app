import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IUser, User } from "../models/User";

export interface AuthRequest extends Request {
  user?: Partial<IUser>;
}

const ACCESS_SECRET = process.env.JWT_SECRET || "access_secret_key";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_key";

// Generador de nuevo access token
const generateAccessToken = (user: IUser) => {
  return jwt.sign({ id: user._id }, ACCESS_SECRET, { expiresIn: "15m" }); // 15 minutos
};

// Middleware principal
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const refreshToken = req.cookies?.refreshToken;

  if (!token) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  try {
    // Verificar access token
    const decoded = jwt.verify(token, ACCESS_SECRET) as { id: string };

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    req.user = user;
    next();

  } catch (error: any) {
    // Si el token expiró
    if (error.name === "TokenExpiredError") {
      if (!refreshToken) {
        return res.status(401).json({ message: "Token expirado. Inicia sesión nuevamente." });
      }

      try {
        // Verificar el refresh token
        const decodedRefresh = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string };
        const user = await User.findById(decodedRefresh.id).select("-password");
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        // Generar nuevo access token
        const newAccessToken = generateAccessToken(user);

        // Devolverlo al frontend (cabecera y respuesta)
        res.setHeader("x-access-token", newAccessToken);

        req.user = user;
        next();
      } catch (refreshError) {
        return res.status(401).json({ message: "Refresh token inválido o expirado." });
      }
    } else {
      // Cualquier otro error
      return res.status(401).json({ message: "Token inválido." });
    }
  }
};
