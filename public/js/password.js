import { Valid } from "./utils/valid.js";
import { FormHelper } from "./utils/formHelper.js";
import { message } from "./utils/message.js";
import { apiFetch } from "./common/apiFetch.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("memberForm");
  const currentPwInput = document.getElementById("currentPassword");
  const newPwInput = document.getElementById("password");
  const confirmPwInput = document.getElementById("newPasswordConfirm");

  // 실시간 비밀번호 검사
  FormHelper.attachValidation(
    currentPwInput,
    Valid.isValidPassword,
    message.PASSWORD.INVALID
  );

  FormHelper.attachValidation(
    newPwInput,
    Valid.isValidPassword,
    message.PASSWORD.INVALID
  );

  // 실시간 비번,비번확인 일치 검사
  confirmPwInput.addEventListener("input", () => {
    const confirmPw = confirmPwInput.value.trim();

    if (!Valid.isSamePassword(newPwInput.value.trim(), confirmPw)) {
      FormHelper.showError(confirmPwInput, message.PASSWORD.NOT_MATCH);
    } else {
      FormHelper.clearError(confirmPwInput);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = currentPwInput.value.trim();
    const newPassword = newPwInput.value.trim();
    const newPasswordConfirm = confirmPwInput.value.trim();

    if (!Valid.isValidPassword(currentPassword)) {
      alert(message.PASSWORD.INVALID);
      currentPwInput.focus();
      return;
    }

    if (!Valid.isValidPassword(newPassword)) {
      alert(message.PASSWORD.INVALID);
      newPwInput.focus();
      return;
    }

    if (!Valid.isSamePassword(newPassword, newPasswordConfirm)) {
      alert(message.PASSWORD.NOT_MATCH);
      confirmPwInput.focus();
      return;
    }

    try {
      const data = await apiFetch("/api/auth/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newPasswordConfirm,
        }),
      });

      if (!data) return;

      if (data.message) {
        alert("비밀번호 수정이 완료되었습니다.");
        currentPwInput.value = null;
        newPwInput.value = null;
        confirmPwInput.value = null;
      } else {
        alert(
          data.message || "비밀번호 수정에 실패했습니다. 다시 시도해주세요."
        );
      }
    } catch (err) {
      console.error("비밀번호 수정 오류:", err);
      alert(message.COMMON.SERVER_ERROR);
    }
  });
});
