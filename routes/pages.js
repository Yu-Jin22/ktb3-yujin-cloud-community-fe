const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const router = express.Router();

// 공통 템플릿 폴더 (layout, header, footer)
const LAYOUT_PATH = path.join(__dirname, "../layout");

// 페이지 컴포넌트 폴더 (login, posts 등)
const COMPONENT_PATH = path.join(__dirname, "../public/component");

// 파일 읽기 함수
async function loadTemplate(filePath) {
  return fs.readFile(filePath, "utf8");
}

// 공통 레이아웃, 헤더 랜더링 함수
async function renderPage(options = {}) {
  try {
    // 레이아웃 랜더링
    const [layout] = await Promise.all([
      loadTemplate(path.join(LAYOUT_PATH, "layout.html")),
    ]);
    // 공통 헤더 랜더링
    const header = await loadTemplate(path.join(COMPONENT_PATH, "header.html"));

    // 페이지 컴포넌트 랜더링 - 여러개 조합가능하게
    let content = "";
    if (options.components && Array.isArray(options.components)) {
      for (const comp of options.components) {
        const compHtml = await loadTemplate(
          path.join(COMPONENT_PATH, `${comp}.html`)
        );
        content += compHtml + "\n";
      }
    }
    // console.log("랜더페이지 내부 컨텐트" + content);

    // CSS / JS 포함
    let extraCSS = "";
    if (options.css) {
      extraCSS = options.css
        .map((href) => `<link rel="stylesheet" href="${href}">`)
        .join("\n");
    }
    let extraJS = "";
    if (options.js) {
      extraJS = options.js
        .map((src) => `<script type="module" src="${src}" defer></script>`)
        .join("\n");
    }

    // 템플릿 조립
    const html = layout
      .replace("{{title}}", options.title || "아무 말 대잔치")
      .replace("{{extraCSS}}", extraCSS)
      .replace("{{extraJS}}", extraJS)
      .replace("{{header}}", header)
      .replace("{{content}}", content);

    return html;
  } catch (err) {
    console.error("renderPage 오류:", err.message);
    throw new Error(`페이지 렌더링 실패: ${pageName}`);
  }
}

// 기본 페이지
router.get("/", (req, res) => {
  return res.redirect("/posts");
});

// 로그인 페이지
router.get("/login", async (req, res) => {
  const html = await renderPage({
    title: "로그인",
    components: ["login"],
    css: ["/css/form.css"],
    js: ["/js/login.js"],
  });
  res.send(html);
});

// 회원가입 페이지
router.get("/signup", async (req, res) => {
  const html = await renderPage({
    title: "회원가입",
    components: ["signup"],
    css: ["/css/form.css"],
    js: ["/js/signup.js"],
  });
  res.send(html);
});

// 회원 정보 수정 페이지
router.get("/member/edit", async (req, res) => {
  const html = await renderPage({
    title: "회원정보 수정",
    components: ["member_edit"],
    css: ["/css/form.css", "/css/member.css"],
    // js: ["/js/login.js"]
  });
  res.send(html);
});

// 비밀번호 수정 페이지
router.get("/member/password", async (req, res) => {
  const html = await renderPage({
    title: "회원정보 수정",
    components: ["member_pw_edit"],
    css: ["/css/form.css", "/css/member.css"],
    // js: ["/js/login.js"]
  });
  res.send(html);
});

// 게시글 목록 페이지
router.get("/posts", async (req, res) => {
  const html = await renderPage({
    title: "게시글",
    components: ["post"],
    css: ["/css/post.css"],
    // js: ["/js/login.js"]
  });
  res.send(html);
});

// 게시글 작성 페이지
router.get("/posts/write", async (req, res) => {
  const html = await renderPage({
    title: "게시글 작성",
    components: ["post_write"],
    css: ["/css/post.css", "/css/form.css"],
    js: ["/js/post_write.js"],
  });
  res.send(html);
});

// 게시물 상세 페이지
router.get("/posts/:id", async (req, res) => {
  const postId = req.params.id;
  const html = await renderPage({
    title: "게시글 상세",
    components: ["post_detail", "comment"],
    css: ["/css/post.css", "/css/form.css"],
    // js: ["/js/login.js"]
  });
  res.send(html);
});

// 게시글 수정 페이지
router.get("/posts/edit/:id", async (req, res) => {
  const postId = req.params.id;
  const html = await renderPage({
    title: "게시글 수정",
    components: ["post_write"],
    css: ["/css/post.css", "/css/form.css"],
    js: ["/js/post_write.js"],
  });
  res.send(html);
});

module.exports = router;
