const express = require("express");
const authCountroller = require("../controllers/auth.controller");
const orderController = require("../controllers/order.controller");
const router = express.Router();

router.post("/", authCountroller.authenticate, orderController.createOrder);
// 내 주문 목록 조회
router.get("/", authCountroller.authenticate, orderController.readOrderList);
// 모든 주문 목록 조회 (관리자)
router.get(
  "/admin",
  authCountroller.authenticate,
  authCountroller.checkAdminPermission,
  orderController.readOrderListForAdmin
);
router.get(
  "/:id",
  authCountroller.authenticate,
  orderController.readOrderDetail
);
router.put(
  "/:id",
  authCountroller.authenticate,
  authCountroller.checkAdminPermission,
  orderController.updateOrder
);

module.exports = router;
