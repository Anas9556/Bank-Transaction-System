import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";

function verifyRequestToken(req, res) {
  const authorization = req.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  const token = req.cookies?.token || bearerToken;

  if (!token) {
    res.status(401).json({
      message: 'Unauthorized access, token not found'
    });
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401).json({
      message: 'Unauthorized access, token is invalid'
    });
    return null;
  }
}

async function authMiddleware(req, res, next) {
  const decoded = verifyRequestToken(req, res);
  if (!decoded) {
    return;
  }

  const user = await userModel.findById(decoded.userID);
  if (!user) {
    return res.status(401).json({
      message: 'Unauthorized access, user no longer exists'
    });
  }

  req.user = user;
  return next();
}

async function authSystemUserMiddleware(req, res, next) {
  const decoded = verifyRequestToken(req, res);
  if (!decoded) {
    return;
  }

  const user = await userModel.findById(decoded.userID).select('+systemUser');
  if (!user) {
    return res.status(401).json({
      message: 'Unauthorized access, user no longer exists'
    });
  }

  if (!user.systemUser) {
    return res.status(403).json({
      message: 'Forbidden access, user is not a system user'
    });
  }

  req.user = user;
  return next();
}

export default { authMiddleware, authSystemUserMiddleware };