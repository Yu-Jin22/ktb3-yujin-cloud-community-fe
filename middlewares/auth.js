function enforceAuthRules(req, res, next) {
  const hasSession = !!req.cookies?.JSESSIONID;
  // console.log("로그인 상태:", hasSession, "요청 경로:", req.path);

  // 로그인하지 않은 경우 → /login으로 강제 이동
  if (!hasSession) {
    if (req.path === "/login" || req.path === "/signup") {
      return next(); // 로그인/회원가입은 예외
    }
    return res.redirect("/login");
  }

  // 로그인한 경우 → /login, /signup 접근 시 차단
  if (req.path === "/login" || req.path === "/signup") {
    return res.redirect("/posts");
  }

  next();
}

module.exports = enforceAuthRules;
