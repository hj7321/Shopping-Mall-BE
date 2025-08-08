const express = require("express");
const authCountroller = require("../controllers/auth.controller");
const orderController = require("../controllers/order.controller");
const router = express.Router();

router.post("/", authCountroller.authenticate, orderController.createOrder);

module.exports = router;
