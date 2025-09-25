const jwt = require('jsonwebtoken');
const { promisify } = require('util');
require("dotenv").config();
const sign = promisify(jwt.sign);

function createAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' });
}
function createRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' });
}
function createEmailVerificationToken(payload) {
  return jwt.sign(payload, process.env.JWT_EMAIL_VERIFY_SECRET, { expiresIn: '1d' });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}
function verifyEmailToken(token) {
  return jwt.verify(token, process.env.JWT_EMAIL_VERIFY_SECRET);
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  createEmailVerificationToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyEmailToken,
};
