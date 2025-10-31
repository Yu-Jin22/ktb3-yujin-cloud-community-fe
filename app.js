const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const enforceAuthRules = require("./middlewares/auth");
const routes = require("./routes");

const app = express();
const PORT = 3000;

// 로그인 여부 판단을 위한 쿠키 파서
app.use(cookieParser());

// POST 요청 바디 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 리소스 제공 (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// 로그인 체크 미들웨어 적용
app.use((req, res, next) => {
  // /api 로 시작하는 요청은 패스 (API 프록시 요청은 로그인 검사 제외)
  if (req.path.startsWith("/api")) {
    return next();
  }

  // 그 외 요청은 enforceAuthRules 미들웨어 적용
  enforceAuthRules(req, res, next);
});

// 라우터 연결
app.use("/", routes);

// 서버 실행
app.listen(PORT, () =>
  console.log(`Front Server running on http://localhost:${PORT}`)
);
