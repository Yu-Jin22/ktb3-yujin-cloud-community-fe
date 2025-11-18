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

    if (!Valid.isValidEmail(email)) {
      alert(message.EMAIL.INVALID);
      emailInput.focus();
      return;
    }

    if (!Valid.isValidPassword(password)) {
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

      if (data.ok === false) {
        alert(data.message);
        return;
      }

      location.href = "/posts";
    } catch (err) {
      console.error("로그인 요청 오류:", err);
      alert(message.COMMON.SERVER_ERROR);
    }
  });
});
