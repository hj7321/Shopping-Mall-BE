const User = require("../models/User");
const bcrypt = require("bcryptjs");
const userController = {};

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
    const user = await User.findOne({ email }, "-createdAt -updatedAt -__v");
    if (!user) {
      throw new Error("이메일이 존재하지 않습니다.");
    }
    const isPasswordSame = await bcrypt.compare(password, user.password);
    if (isPasswordSame) {
      const token = user.generateToken();
      return res.status(200).json({ status: "success", user, token });
    }
    throw new Error("비밀번호가 일치하지 않습니다.");
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

userController.getUser = async (req, res) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);
    if (user) {
      res.status(200).json({ status: "success", user });
    }
    throw new Error("Invalid Token");
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

module.exports = userController;
