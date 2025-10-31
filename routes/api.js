const express = require("express");
const fetch = global.fetch;
const router = express.Router();

const BACKEND_URL = "http://localhost:8080";

router.use(async (req, res) => {
  try {
    const targetPath = req.originalUrl.replace(/^\/api/, "");
    const targetUrl = `${BACKEND_URL}${targetPath}`;

    const method = req.method;
    const options = { method, headers: {} };

    // Content-Type 중복 방지
    const contentType = req.headers["content-type"];
    if (contentType) {
      options.headers["Content-Type"] = contentType.split(",")[0].trim();
    }

    // 프론트에서 받은 쿠키를 백엔드로 전달
    if (req.headers.cookie) {
      options.headers.cookie = req.headers.cookie;
    }

    // multipart/form-data는 body를 만지지 않도록 수정
    const isMultipart = contentType?.startsWith("multipart/form-data");
    const isJson = contentType?.includes("application/json");

    if (!isMultipart && method !== "GET") {
      // JSON 요청만 body 변환
      if (isJson) {
        options.body = JSON.stringify(req.body);
      } else if (req.body && Object.keys(req.body).length > 0) {
        // 폼 데이터 등 나머지 일반 body
        options.body = new URLSearchParams(req.body).toString();
      }
    } else if (isMultipart) {
      // multipart는 원본 스트림 그대로 전달
      options.body = req;
      options.duplex = "half";
    }

    // 프록시 요청
    const response = await fetch(targetUrl, options);

    // 백엔드에서 받은 쿠키를 프론트 도메인 기준으로 다시 설정
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      res.setHeader("Set-Cookie", setCookie);
    }

    const contentTypeRes = response.headers.get("content-type");
    const data = contentTypeRes?.includes("application/json")
      ? await response.json()
      : await response.text();

    res.status(response.status).send(data);
  } catch (err) {
    console.error("api.js error:", err.message);
    res.status(500).json({ message: "백엔드 통신 실패", error: err.message });
  }
});

module.exports = router;
