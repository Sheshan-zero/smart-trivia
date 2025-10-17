const jwt = require("jsonwebtoken");

const ACCESS_TTL_MIN = parseInt(process.env.ACCESS_TOKEN_TTL_MIN || "15", 10);
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "7", 10);

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: `${ACCESS_TTL_MIN}m` });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TTL_DAYS}d` });
}

function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccess, verifyRefresh };
