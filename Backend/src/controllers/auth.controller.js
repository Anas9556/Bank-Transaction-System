import userModel from "../models/user.model.js";
import emailService from "../services/email.service.js";
import jwt from "jsonwebtoken";
const sessionDurationMs = 3 * 24 * 60 * 60 * 1000;

function issueSession(res, user, statusCode) {
  const token = jwt.sign({
    userID: user._id
  }, process.env.JWT_SECRET, { expiresIn: "3d" });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: sessionDurationMs,
    path: '/'
  });

  return res.status(statusCode).json({
    user: {
      _id: user._id,
      email: user.email,
      emailL: user.email,
      name: user.name,
      systemUser: Boolean(user.systemUser)
    },
    token
  });
}

async function userRegisterController(req, res) {
  const { email, password, name } = req.body;
  const isExists = await userModel.findOne({ email });

  if (isExists) {
    return res.status(422).json({
      message: 'Email already registered',
      status: 'Failed'
    });
  }

  const user = await userModel.create({
    email, password, name
  });

  issueSession(res, user, 201);
  await emailService.sendRegistrationEmail(user.name, user.email);
}

async function userLoginController(req, res) {
  const {email, password} = req.body;

  const user = await userModel.findOne({ email }).select("+password +systemUser")

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      message: 'Invalid email or password'
    })
  }

  return issueSession(res, user, 200);
}

async function currentUserController(req, res) {
  res.status(200).json({
    user: {
      _id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      systemUser: Boolean(req.user.systemUser)
    }
  });
}

export default {
  userRegisterController,
  userLoginController,
  currentUserController
};
