const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

const userModel = require("../models/user.model");
const {
  createAccessToken,
  createRefreshToken,
  createEmailVerificationToken,
  verifyEmailToken,
  verifyRefreshToken,
} = require("../utils/tokens.utils");
const { sendMail } = require("../utils/mailer.utils");

const UserRouter = express.Router();

const SALT_ROUNDS = 12;
const MAX_FAILED = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// Registration
UserRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, voterId } = req.body;
    if (!name || !email || !password || !voterId)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await userModel.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const existingVoter = await userModel.findOne({ voterId });
    if (existingVoter)
      return res.status(409).json({ error: "Voter ID already registered" });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new userModel({
      name,
      email,
      passwordHash,
      voterId,
      emailVerified: false,
    });
    await user.save();

    // send email verification
    // const token = createEmailVerificationToken({ id: user._id, email: user.email });
    // const verifyLink = `${process.env.APP_URL}/auth/verify-email?token=${token}`;
    // await sendMail({
    //   to: user.email,
    //   subject: 'Verify your email',
    //   html: `<p>Hi ${user.name},</p>
    //          <p>Click to verify your email: <a href="${verifyLink}">Verify Email</a></p>
    //          <p>If link doesn't work, use token: ${token}</p>`,
    // });

    return res
      .status(201)
      .json({ message: "Registered. Check email for verification link." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Verify email
UserRouter.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Missing token");
  try {
    const payload = verifyEmailToken(token);
    const user = await userModel.findById(payload.id);
    if (!user) return res.status(404).send("User not found");
    user.emailVerified = true;
    await user.save();
    return res.send("Email verified successfully. You can now login.");
  } catch (err) {
    console.error(err);
    return res.status(400).send("Invalid or expired token");
  }
});

// Login
UserRouter.post("/login", async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (user.isLocked()) {
      return res
        .status(423)
        .json({
          error: "Account temporarily locked due to too many failed attempts",
        });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED) {
        user.lockUntil = Date.now() + LOCK_TIME;
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // password matched: reset counters
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // ensure email verified
    // if (!user.emailVerified) {
    //   await user.save();
    //   return res.status(403).json({ error: 'Email not verified' });
    // }

    // If MFA enabled, verify TOTP
    // if (user.mfa.enabled) {
    //   if (!mfaToken) {
    //     return res.status(206).json({ needMfa: true, message: 'MFA token required' });
    //   }
    //   const verified = speakeasy.totp.verify({
    //     secret: user.mfa.secret,
    //     encoding: 'base32',
    //     token: mfaToken,
    //     window: 1,
    //   });
    //   if (!verified) {
    //     await user.save();
    //     return res.status(401).json({ error: 'Invalid MFA token' });
    //   }
    // }

    // create tokens
    const accessToken = createAccessToken({
      id: user._id,
      email: user.email,
      role: user.role,
      voterId: user.voterId,
    });
    const refreshToken = createRefreshToken({
      id: user._id,
      email: user.email,
      role: user.role,
      voterId: user.voterId,
    });

    // store hashed refresh token in DB (simple store)
    user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
    await user.save();

    // return tokens (in prod, put refresh token in httpOnly cookie)
    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        voterId: user.voterId,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Refresh token
UserRouter.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ error: "Missing refresh token" });

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await userModel.findById(payload.id);
    if (!user) return res.status(401).json({ error: "Invalid token user" });

    const tokenExists = user.refreshTokens.some(
      (r) => r.token === refreshToken
    );
    if (!tokenExists)
      return res.status(401).json({ error: "Refresh token revoked" });

    // create new access token
    const accessToken = createAccessToken({ id: user._id, email: user.email });

    return res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Logout (revoke refresh token)
UserRouter.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ error: "Missing refresh token" });

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      // token invalid - just respond success to avoid token scanning
      return res.json({ success: true });
    }

    const user = await userModel.findById(payload.id);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (r) => r.token !== refreshToken
      );
      await user.save();
    }
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Enable MFA - generate secret & QR
UserRouter.post("/mfa/setup", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const secret = speakeasy.generateSecret({ length: 20 });

    // store temp secret in DB (not enabling until verified)
    user.mfa.tempSecret = secret.base32;
    await user.save();

    const otpauth = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `${process.env.APP_URL}:${user.email}`,
      encoding: "base32",
    });
    const qr = await qrcode.toDataURL(otpauth);

    res.json({ qr, secret: secret.base32 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Verify & enable MFA
UserRouter.post("/mfa/verify", async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token)
      return res.status(400).json({ error: "Missing fields" });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const tempSecret = user.mfa.tempSecret || user.mfa.secret;
    const verified = speakeasy.totp.verify({
      secret: tempSecret,
      encoding: "base32",
      token,
      window: 1,
    });
    if (!verified) return res.status(400).json({ error: "Invalid token" });

    // enable MFA
    user.mfa.secret = tempSecret;
    user.mfa.enabled = true;
    delete user.mfa.tempSecret;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = UserRouter;
