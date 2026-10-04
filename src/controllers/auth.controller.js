import userModel from "../models/user.model.js";
import emailService from "../services/email.service.js";
import jwt from "jsonwebtoken";

async function userRegisterController(req, res) {

  const{email, password, name} = req.body;

  const isExists = await userModel.findOne({
    email: email
  });

  if(isExists) {
    return res.status(422).json({
      message: 'Email already registered',
      status: 'Failed'
    });
  }

  const user = await userModel.create({
    email, password, name
  });

  const token = jwt.sign({
    userID: user._id
  }, process.env.JWT_SECRET, {expiresIn: "3d"})

  res.cookie('token', token)

  res.status(201).json({
    user: {
      _id: user._id,
      emailL: user.email,
      name: user.name
    },
    token
  })

  await emailService.sendRegistrationEmail(user.name, user.email);

}

async function userLoginController(req, res) {
  const {email, password} = req.body;

  const user = await userModel.findOne({ email }).select("+password")

  if(!user) {
    return res.status(401).json({
      message: 'Email not found'
    })
  }

  const isValidPassword = await user.comparePassword(password);

  if(!isValidPassword) {
    return res.status(401).json({
      message: 'Password is INVALID'
    })
  }

  const token = jwt.sign({
    userID: user._id
  }, process.env.JWT_SECRET, {expiresIn: "3d"})

  res.cookie('token', token)

  res.status(200).json({
    user: {
      _id: user._id,
      emailL: user.email,
      name: user.name
    },
    token
  })
}

export default { userRegisterController, userLoginController };