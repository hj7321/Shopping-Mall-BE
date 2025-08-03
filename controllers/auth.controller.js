const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const authCountroller = {};

authCountroller.authenticate = async (req, res, next) => {
  try {
    const tokenString = req.headers.authorization;
    if (!tokenString) {
      return res
        .status(401)
        .json({ status: "failed", message: "Authorization token is missing." });
    }
    const token = tokenString.replace("Bearer ", "");
    jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
      if (error) {
        return res
          .status(401)
          .json({ status: "failed", message: "Invalid or expired token." });
      }
      req.userId = payload._id;
      next();
    });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

authCountroller.checkAdminPermission = async (req, res, next) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);
    if (user.level !== "admin") throw new Error("No Permission");
    next();
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

module.exports = authCountroller;
