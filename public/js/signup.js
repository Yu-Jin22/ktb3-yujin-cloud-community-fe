import { Valid } from "./utils/valid.js";
import { FormHelper } from "./utils/formHelper.js";
import { message } from "./utils/message.js";
import { apiFetch } from "./common/apiFetch.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const pwInput = document.getElementById("password");
  const confirmPwInput = document.getElementById("confirmPassword");
  const nicknameInput = document.getElementById("nickname");
  const emailCheckBtn = document.getElementById("checkEmailBtn");
  const nickNameBtn = document.getElementById("checkNicknameBtn");
  const signupForm = document.getElementById("signupForm");
  let isCheckDuplicateEmail = false;
  let isCheckDuplicateNickname = false;

  // 실시간 이메일검사
  FormHelper.attachValidation(
    emailInput,
    Valid.isValidEmail,
    message.EMAIL.INVALID
  );
  // 실시간 비밀번호 검사
  FormHelper.attachValidation(
    pwInput,
    Valid.isValidPassword,
    message.PASSWORD.INVALID
  );
  // 실시간 닉네임 검사
  FormHelper.attachValidation(
    nicknameInput,
    Valid.isValidNickname,
    message.NICKNAME.INVALID
  );

  // 실시간 비번,비번확인 일치 검사
  confirmPwInput.addEventListener("input", () => {
    const confirmPw = confirmPwInput.value.trim();

    if (!Valid.isSamePassword(pwInput.value.trim(), confirmPw)) {
      FormHelper.showError(confirmPwInput, message.PASSWORD.NOT_MATCH);
    } else {
      FormHelper.clearError(confirmPwInput);
    }
  });

  // 이메일 중복확인
  emailCheckBtn.addEventListener("click", async (e) => {
    const email = emailInput.value.trim();
    if (!Valid.isValidEmail(email)) {
      alert(message.EMAIL.INVALID);
      return;
    }

    try {
      const data = await apiFetch("/api/users/email", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (!data) return;

      if (!data.isDuplicate) {
        isCheckDuplicateEmail = true;
        alert("사용가능한 이메일입니다.");
      } else {
        isCheckDuplicateEmail = false;
        FormHelper.showError(emailInput, message.EMAIL.DUPLICATE);
      }
    } catch (err) {
      isCheckDuplicateEmail = false;
      console.error("이메일 중목 확인 오류:", err);
      alert(message.COMMON.SERVER_ERROR);
    }
  });

  // 닉네임 중복확인
  nickNameBtn.addEventListener("click", async (e) => {
    const nickname = nicknameInput.value.trim();
    if (!Valid.isValidNickname(nickname)) {
      alert(message.NICKNAME.INVALID);
      return;
    }

    try {
      const data = await apiFetch("/api/users/nickname", {
        method: "POST",
        body: JSON.stringify({ nickname }),
      });

      if (!data) return;

      if (!data.isDuplicate) {
        isCheckDuplicateNickname = true;
        alert("사용가능한 닉네임입니다.");
      } else {
        isCheckDuplicateNickname = false;
        FormHelper.showError(nicknameInput, message.NICKNAME.DUPLICATE);
      }
    } catch (err) {
      isCheckDuplicateNickname = false;
      console.error("닉네임 중복 확인 오류:", err);
      alert(message.COMMON.SERVER_ERROR);
    }
  });

  // 이메일 입력값이 바뀌면 중복확인 초기화
  emailInput.addEventListener("input", () => {
    isCheckDuplicateEmail = false;
  });

  // 닉네임 입력값이 바뀌면 중복확인 초기화
  nicknameInput.addEventListener("input", () => {
    isCheckDuplicateNickname = false;
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = pwInput.value.trim();
    const confirmPassword = confirmPwInput.value.trim();
    const nickname = nicknameInput.value.trim();

    // 1. 유효성 검사
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
    if (!Valid.isSamePassword(password, confirmPassword)) {
      alert(message.PASSWORD.NOT_MATCH);
      confirmPwInput.focus();
      return;
    }
    if (!Valid.isValidNickname(nickname)) {
      alert(message.NICKNAME.INVALID);
      nicknameInput.focus();
      return;
    }

    // 2. 중복확인 상태 체크
    if (!isCheckDuplicateEmail) {
      alert("이메일 중복확인을 해주세요.");
      return;
    }
    if (!isCheckDuplicateNickname) {
      alert("닉네임 중복확인을 해주세요.");
      return;
    }

    // 3. 서버로 회원가입 요청
    try {
      const data = await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ email, password, confirmPassword, nickname }),
      });

      if (!data) return;

      if (data.message) {
        alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
        location.href = "/login";
      } else {
        alert(data.message || "회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (err) {
      console.error("회원가입 요청 오류:", err);
      alert(message.COMMON.SERVER_ERROR);
    }
  });
});
