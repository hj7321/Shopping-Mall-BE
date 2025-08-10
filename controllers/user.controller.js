const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const userController = {};
require("dotenv").config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

userController.createUser = async (req, res) => {
  try {
    let { email, password, name, level } = req.body;
    const user = await User.findOne({ email: email });
    if (user) {
      throw new Error("이미 가입된 유저입니다.");
    }
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const newUser = new User({
      email,
      password,
      name,
      level: level || "customer",
    });
    await newUser.save();
    return res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

userController.loginWithEmail = async (req, res) => {
  try {
    let { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new Error("이메일 또는 비밀번호가 일치하지 않습니다.");
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new Error("이메일 또는 비밀번호가 일치하지 않습니다.");
    }

    const token = user.generateToken();
    return res
      .status(200)
      .json({ status: "success", user: user.toJSON(), token });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

userController.loginWithGoogle = async (req, res) => {
  // 백엔드에서 로그인하기
  // 토큰값을 읽어와서 유저 정보를 뽑아내고 email
  // (1) 이미 로그인을 한 적이 있는 유저 => 로그인 시키고, 토큰값 주면 됨!
  // (2) 처음 로그인 시도를 한 유저 => 유저 정보 먼저 새로 생성하고, 토큰값 주면 됨!
  try {
    const { token } = req.body;
    const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const { email, name } = ticket.getPayload();
    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = "" + Math.floor(Math.random() * 10000000);
      const salt = await bcrypt.genSalt(10);
      const newPassword = await bcrypt.hash(randomPassword, salt);
      user = new User({
        name,
        email,
        password: newPassword,
      });
      await user.save();
    }
    const sessionToken = await user.generateToken();
    res.status(200).json({ status: "success", user, token: sessionToken });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

userController.getUser = async (req, res) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "failed", message: "User not found" });
    }
    res.status(200).json({ status: "success", user });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

module.exports = userController;
