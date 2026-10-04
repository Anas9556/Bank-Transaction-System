import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";


async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if(!token) {
    return res.status(401).json({
      message: 'Unauthorized access, token not found'
    })
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.userID);

    req.user = user;

    return next();

  } catch(err) {
    return res.status(401).json({
      message: 'Unauthorized access, token is invalid'
    })
  }
}

export default { authMiddleware };