const express = require("express");
const cartController = require("../controllers/cart.controller");
const authCountroller = require("../controllers/auth.controller");
const router = express.Router();

router.post("/", authCountroller.authenticate, cartController.addItemToCart);
router.get("/", authCountroller.authenticate, cartController.getCart);
router.get("/qty", authCountroller.authenticate, cartController.getCartQty);
router.put("/", authCountroller.authenticate, cartController.updateCart);
router.delete("/", authCountroller.authenticate, cartController.deleteCart);
router.post(
  "/checkStock",
  authCountroller.authenticate,
  cartController.checkCartStock
);

module.exports = router;
