const orderController = {};
const Order = require("../models/Order");
const productController = require("./product.controller");
const { randomStringGenerator } = require("../utils/randomStringGenerator");

const ADMIN_PAGE_SIZE = 3;
const USER_PAGE_SIZE = 5;

orderController.createOrder = async (req, res) => {
  try {
    // 프론트엔드에서 데이터 보낸거 받아와 userId, totalPrice, shipTo, contact, orderList
    const { userId } = req;
    const { shipTo, contact, totalPrice, orderList } = req.body;

    // 1. 주문하려는 모든 상품의 재고를 먼저 확인함
    const insufficientStockItems = await productController.checkItemListStock(
      orderList
    );
    // 2. 재고가 부족한 상품이 있으면 에러를 반환하고, 재고 감소는 일어나지 않음
    if (insufficientStockItems.length > 0) {
      const errorMessage = insufficientStockItems.reduce(
        (total, item) => (total += item.message),
        ""
      );
      return res.status(400).json({ status: "failed", message: errorMessage });
    }
    // 3. 모든 상품의 재고가 충분하면, 재고를 감소시킴
    await productController.decreaseItemListStock(orderList);
    // 4. 재고 감소가 성공하면, 주문을 생성함
    const newOrder = new Order({
      userId,
      totalPrice,
      shipTo,
      contact,
      items: orderList,
      orderNum: randomStringGenerator(),
    });

    await newOrder.save();
    res.status(200).json({ status: "success", orderNum: newOrder.orderNum });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

orderController.readOrderList = async (req, res) => {
  try {
    const { userId } = req;
    const { ordernum, page = 1 } = req.query;
    const condition = { userId: userId };

    if (ordernum) {
      condition.orderNum = { $regex: new RegExp(ordernum, "i") };
    }

    const totalCount = await Order.find(condition).countDocuments();
    const totalPageNum = Math.ceil(totalCount / USER_PAGE_SIZE);
    const orderList = await Order.find(condition)
      .sort({ createdAt: -1 })
      .skip((page - 1) * USER_PAGE_SIZE)
      .limit(USER_PAGE_SIZE)
      .populate("items.productId")
      .lean();

    res
      .status(200)
      .json({ status: "success", data: orderList, totalPageNum, totalCount });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

orderController.readOrderListForAdmin = async (req, res) => {
  try {
    const { ordernum, page = 1 } = req.query;
    const condition = {};

    if (ordernum) {
      condition.orderNum = { $regex: new RegExp(ordernum, "i") };
    }

    const totalCount = await Order.find(condition).countDocuments();
    const totalPageNum = Math.ceil(totalCount / ADMIN_PAGE_SIZE);
    const orderList = await Order.find(condition)
      .sort({ createdAt: -1 })
      .skip((page - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE)
      .populate("items.productId")
      .lean();

    res
      .status(200)
      .json({ status: "success", data: orderList, totalPageNum, totalCount });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

orderController.readOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findOne({ _id: orderId })
      .populate("items.productId")
      .lean();

    if (!order) {
      return res
        .status(404)
        .json({ status: "failed", message: "주문 정보를 찾을 수 없습니다." });
    }
    res.status(200).json({ status: "success", data: order });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

orderController.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: id },
      { $set: { status: status } },
      { new: true }
    ).populate("items.productId");
    if (!updatedOrder) {
      return res.status(404).json({
        status: "failed",
        message: "주문 정보 업데이트에 실패했습니다.",
      });
    }
    res.status(200).json({ status: "success", data: updatedOrder });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

module.exports = orderController;
