import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"
import { User } from "../models/User";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("_id email firstName password");

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Credenciales inválidas" });

    // Generar tokens
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" }
    );

    await user.save();
    // Enviar refresh token como cookie segura
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // Enviar solo el accessToken al frontend
    res.json({
      message: "Inicio de sesión exitoso",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
      },
    });


  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(400).json({ message: "No hay token" });

    const user = await User.findOne({ refreshToken: token });
    if (user) {
      user.refreshToken = "";
      await user.save();
    }

    // Borrar la cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al cerrar sesión" });
  }
};

export const refreshTokenUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken; // puede venir por cookie o body

    if (!refreshToken) {
      return res.status(401).json({ message: "No se proporcionó refresh token" });
    }

    const secretKey = process.env.JWT_REFRESH_SECRET || "default_refresh_secret";

    // Validar el refresh token
    const decoded: any = jwt.verify(refreshToken, secretKey);

    // Buscar usuario en la BD y verificar que el token coincida
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Refresh token inválido o no autorizado" });
    }

    // Generar nuevo access token
    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
      },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: "2h" }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: "Refresh token inválido o expirado" });
  }
};

export const forgotPasswordUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    // 1️⃣ Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email no encontrado" });
    }

    // 2️⃣ Crear token temporal (válido 15 min)
    const secretKey = process.env.JWT_SECRET || "default_secret_key";
    const resetToken = jwt.sign({ id: user._id, email: user.email }, secretKey, {
      expiresIn: "15m",
    });

    // 3️⃣ Crear URL para resetear la contraseña
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    // 4️⃣ Configurar transporte de correo (usa variables de entorno en producción)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 5️⃣ Enviar el correo
    const mailOptions = {
      from: `"Soporte" <pumapoloharold123@gmail.com>`,
      to: user.email,
      subject: "Recuperación de contraseña",
      html: `
        <h2>Hola, ${user.firstName || "usuario"} 👋</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para continuar:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>Este enlace expirará en 15 minutos.</p>
        <br/>
        <p>Si tú no solicitaste este cambio, ignora este mensaje.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: "Se ha enviado un enlace para restablecer la contraseña por correo electrónico.",
      resetLink, // solo útil para pruebas locales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const resetPasswordUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const secretKey = process.env.JWT_SECRET || "default_secret_key";
    const decoded: any = jwt.verify(token, secretKey);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Restablecimiento de contraseña exitosa" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Token no válido o caducado" });
  }
};
