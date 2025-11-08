import { Valid } from "./utils/valid.js";
import { attachValidation } from "./utils/formHelper.js";
import { message } from "./utils/message.js";
import { apiFetch } from "./common/apiFetch.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const pwInput = document.getElementById("password");
  const loginForm = document.getElementById("loginForm");

  // 실시간 이메일검사
  attachValidation(emailInput, Valid.isValidEmail, message.EMAIL.INVALID);
  // 실시간 비밀번호 검사
  attachValidation(pwInput, Valid.isValidPassword, message.PASSWORD.INVALID);

  // 로그인 시키기
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;

    if (!Valid.isValidEmail) {
      alert(message.EMAIL.INVALID);
      emailInput.focus();
      return;
    }

    if (!Valid.isValidPassword) {
      alert(message.PASSWORD.INVALID);
      pwInput.focus();
      return;
    }

    try {
      const data = await apiFetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // apiFetch에서 401 처리 후 null 반환하므로 여기서는 data null 여부만 확인
      if (!data) return;

      location.href = "/posts";
    } catch (err) {
      console.error("로그인 요청 오류:", err);
      alert(message.COMMON.SERVER_ERROR);
    }
  });
});
