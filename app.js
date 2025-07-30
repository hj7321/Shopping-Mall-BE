const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

const indexRouter = require("./routes/index");

require("dotenv").config();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyparser.json()); // req.body가 객체로 인식이 됨

app.use("/api", indexRouter);

const mongoURI = process.env.LOCAL_DB_ADDRESS;
mongoose
  .connect(mongoURI, { useNewUrlParser: true })
  .then(() => console.log("mongoose connected"))
  .catch((err) => console.log("DB connection failed", err));

app.listen(process.env.PORT || 5000, () => {
  console.log("server on");
});
