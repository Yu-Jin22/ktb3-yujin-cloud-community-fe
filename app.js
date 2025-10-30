const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
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

// JWT 로그인 여부 확인 미들웨어 (페이지 접근 제어)
// 여기서는 단순히 쿠키 존재 여부만 봄 -> fetch할때 유효성 검사하니까
app.use((req, res, next) => {
  // API 요청은 패스 (fetch 프록시 요청은 Spring이 검사함)
  if (req.path.startsWith("/api")) {
    return next();
  }

  // 크롬/시스템용 요청은 무시
  if (req.path.startsWith("/.well-known")) return next();

  // 쿠키에 토큰 존재 여부 확인
  const { accessToken, refreshToken } = req.cookies;
  const isLoggedIn = !!(accessToken || refreshToken);

  // 공개 페이지 목록
  const openPaths = ["/login", "/signup"];

  // 로그인된 사용자가 공개 페이지 접근할 때 차단
  if (isLoggedIn && openPaths.includes(req.path)) {
    console.log(`로그인 상태로 ${req.path} 접근 시도하여 차단 → /posts`);
    return res.redirect("/posts");
  }

  // 비로그인 사용자가 보호 페이지 접근할 때 차단
  if (!isLoggedIn && !openPaths.includes(req.path)) {
    console.log(`비로그인 상태로 ${req.path} 접근 시도하여 차단 → /login`);
    return res.redirect("/login");
  }

  next();
});

// 라우터 연결
app.use("/", routes);

// 서버 실행
app.listen(PORT, () =>
  console.log(`Front Server running on http://localhost:${PORT}`)
);
