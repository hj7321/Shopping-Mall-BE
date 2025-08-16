const Product = require("../models/Product");

const PAGE_SIZE = 10;
const productController = {};

productController.createProduct = async (req, res) => {
  try {
    const {
      sku,
      name,
      size,
      image,
      category,
      description,
      price,
      stock,
      status,
    } = req.body;
    if (!image) {
      return res.status(400).json({
        status: "failed",
        message: "이미지를 등록해주세요.",
      });
    }
    if (!price || price <= 0) {
      return res.status(400).json({
        status: "failed",
        message: "가격을 입력해 주세요.",
      });
    }
    if (!stock || Object.keys(stock).length === 0) {
      return res.status(400).json({
        status: "failed",
        message: "재고를 추가해주세요.",
      });
    }
    const product = new Product({
      sku,
      name,
      size,
      image,
      category,
      description,
      price,
      stock,
      status,
    });
    await product.save();
    res.status(200).json({ status: "success", product });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.sku) {
      return res.status(400).json({
        status: "failed",
        message: "이미 등록된 Sku입니다. 다른 Sku를 입력해주세요.",
      });
    }
    res.status(400).json({
      status: "failed",
      message: "상품 등록 중 오류가 발생했습니다. 다시 시도해주세요.",
    });
  }
};

productController.readProducts = async (req, res) => {
  try {
    const { page, name, category } = req.query;
    const condition = { isDeleted: false };

    if (name) condition.name = { $regex: new RegExp(name, "i") };
    if (category) condition.category = category;

    let query = Product.find(condition);
    let response = { status: "success" };

    // 최종 페이지 개수 = 전체 데이터 개수 / 페이지 사이즈
    const totalProductCount = await Product.find(condition).countDocuments();
    const totalPageNum = Math.ceil(totalProductCount / PAGE_SIZE);
    response.totalPageNum = totalPageNum;

    if (page) query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);

    const productList = await query.exec();
    response.data = productList;
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

productController.readProductDetail = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ status: "failed", message: "상품을 찾을 수 없습니다." });
    }
    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

productController.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      sku,
      name,
      size,
      image,
      price,
      description,
      category,
      stock,
      status,
    } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        sku,
        name,
        size,
        image,
        price,
        description,
        category,
        stock,
        status,
      },
      { new: true }
    );
    if (!updatedProduct) {
      return res
        .status(404)
        .json({ status: "failed", message: "상품을 찾을 수 없습니다." });
    }
    res.status(200).json({ status: "success", data: updatedProduct });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

productController.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res
        .status(404)
        .json({ status: "failed", message: "상품을 찾을 수 없습니다." });
    }
    res.status(200).json({ status: "success", data: deletedProduct });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

// 재고 확인 로직
productController.checkStock = async (item) => {
  // 내가 사려는 아이템 재고 정보 들고 오기
  const product = await Product.findById(item.productId);
  if (!product) {
    return { isVerify: false, message: "상품을 찾을 수 없습니다." };
  }
  // 내가 사려는 아이템 qty, 재고 비교
  if (product.stock[item.size] < item.qty) {
    // 재고가 불충분하면 불충분 메시지와 함께 데이터 반환
    return {
      isVerify: false,
      message: `${product.name}의 ${item.size} 재고가 부족합니다.`,
    };
  }
  // // 재고가 충분하면, 재고에서 qty를 빼고 성공한 결과 반환
  // const newStock = { ...product.stock };
  // newStock[item.size] -= item.qty;
  // product.stock = newStock;
  // await product.save();
  return { isVerify: true };
};

// 재고 감소 로직
productController.decreaseStock = async (item) => {
  const product = await Product.findById(item.productId);
  if (product.stock[item.size] < item.qty) {
    throw new Error(`${product.name}의 ${item.size} 재고가 부족합니다.`);
  }
  const newStock = { ...product.stock };
  newStock[item.size] -= item.qty;
  product.stock = newStock;
  await product.save();
};

// 모든 상품의 재고를 확인하는 함수
productController.checkItemListStock = async (itemList) => {
  const insufficientStockItems = []; // 재고가 불충분한 아이템 저장
  // 재고 확인 로직
  for (const item of itemList) {
    const stockCheck = await productController.checkStock(item);
    if (!stockCheck.isVerify) {
      insufficientStockItems.push({ item, message: stockCheck.message });
    }
  }
  return insufficientStockItems;
};

// 모든 상품의 재고를 감소시키는 함수
productController.decreaseItemListStock = async (itemList) => {
  await Promise.all(
    itemList.map(async (item) => {
      await productController.decreaseStock(item);
    })
  );
};

module.exports = productController;
