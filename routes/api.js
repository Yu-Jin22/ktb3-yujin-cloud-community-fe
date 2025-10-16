const express = require("express");
const fetch = global.fetch;

const { createProxyMiddleware } = require("http-proxy-middleware");

const router = express.Router();

const BACKEND_URL = "http://localhost:8080";

// router.use(async (req, res) => {
//   try {
//     const targetPath = req.originalUrl.replace(/^\/api/, "");
//     console.log("Proxying request to:", targetPath);
//     const targetUrl = `${BACKEND_URL}${targetPath}`;
//     const method = req.method;

//     let options = { method, headers: {} };

//     // multipart/form-data인 경우
//     if (req.is("multipart/form-data")) {
//       // multer 없이도 req.body를 직접 넘길 수 없으므로
//       // Express는 multipart를 처리하지 못하니까 req.pipe(fetch) 방식으로 넘긴다
//       const proxyRes = await fetch(targetUrl, {
//         method,
//         headers: req.headers, // 원본 헤더 유지 (boundary 포함)
//         body: req, // 요청 스트림 그대로 전달
//       });

//       const contentType = proxyRes.headers.get("content-type");
//       const data = contentType?.includes("application/json")
//         ? await proxyRes.json()
//         : await proxyRes.text();

//       return res.status(proxyRes.status).send(data);
//     }

//     // JSON 요청인 경우
//     if (method !== "GET" && req.body && Object.keys(req.body).length > 0) {
//       options.body = JSON.stringify(req.body);
//       options.headers["Content-Type"] = "application/json";
//     }

//     const response = await fetch(targetUrl, options);
//     const contentType = response.headers.get("content-type");
//     const data = contentType?.includes("application/json")
//       ? await response.json()
//       : await response.text();

//     res.status(response.status).send(data);
//   } catch (err) {
//     console.error("Proxy error:", err.message);
//     res.status(500).json({ message: "백엔드 통신 실패", error: err.message });
//   }
// });

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

    // JSON 요청 처리
    if (method !== "GET" && req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
    }

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
