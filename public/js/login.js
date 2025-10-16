import { Valid } from "./utils/valid.js";
import { attachValidation } from "./utils/formHelper.js";
import { message } from "./utils/message.js";

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
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // 백엔드 세션 쿠키 주고받기
      });

      const data = await res.json();
      // console.log("응답:", data);

      if (res.ok) {
        location.href = "/posts";
      } else {
        alert(data.message || "로그인 실패하였으니 다시 시도해주세요.");
      }
    } catch (err) {
      console.error("로그인 요청 오류:", err);
      alert(message.COMMON.SERVER_ERROR);
    }
  });
});
