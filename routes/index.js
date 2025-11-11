// page.js, api.js를 합치는 라우팅 허브

const express = require("express");
const router = express.Router();

// 각 기능 라우터 연결
const pagesRouter = require("./pages");

// 나머지 URL은 pages.js로 전달
router.use("/", pagesRouter);

module.exports = router;
