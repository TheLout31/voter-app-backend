const { verifyAccessToken } = require("../utils/tokens.utils");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);
    console.log(payload)
    req.user = {
      _id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

const adminMiddleware = (req, res, next) => {
  console.log("user Data ===>>", req.user);
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Restrict to voter only
const voterMiddleware = (req, res, next) => {
  console.log("req data frrom auth", req.user);
  if (req.user.role !== "voter") {
    
    return res.status(403).json({ error: "Voter access required" });
  }
  next();
};

module.exports = { requireAuth, adminMiddleware, voterMiddleware };
