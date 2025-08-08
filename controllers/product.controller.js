const Product = require("../models/Product");

const PAGE_SIZE = 1;
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
    const { page, name } = req.query;
    const condition = name ? { name: { $regex: name, $options: "i" } } : {};
    let query = Product.find(condition);
    let response = { status: "success" };

    // 최종 페이지 개수 = 전체 데이터 개수 / 페이지 사이즈
    const totalProductCount = await Product.find(condition).countDocuments();
    const totalPageNum = Math.ceil(totalProductCount / PAGE_SIZE);
    response.totalPageNum = totalPageNum;

    if (page) {
      query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
    }
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

module.exports = productController;
