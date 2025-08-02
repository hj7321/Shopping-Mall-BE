const express = require("express");
const userController = require("../controllers/user.controller");
const authCountroller = require("../controllers/auth.controller");
const router = express.Router();

router.post("/", userController.createUser); // 회원가입
router.post("/login", userController.loginWithEmail); // 로그인
router.get("/me", authCountroller.authenticate, userController.getUser); // 토큰이 valid한 토큰인지, 이 토큰값을 가지고 유저를 찾아서 리턴

module.exports = router;
