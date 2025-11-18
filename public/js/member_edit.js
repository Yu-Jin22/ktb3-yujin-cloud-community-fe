import { Valid } from "./utils/valid.js";
import { FormHelper } from "./utils/formHelper.js";
import { message } from "./utils/message.js";
import { apiFetch } from "./common/apiFetch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("memberForm");
  const emailInput = document.getElementById("email");
  const nicknameInput = document.getElementById("nickname");
  const profileFileInput = document.getElementById("profileFile");
  const profilePreview = document.getElementById("profilePreview");
  const resetBtn = document.getElementById("resetProfileBtn");
  const withdrawBtn = document.getElementById("withdrawBtn");
  const nickNameBtn = document.getElementById("checkNicknameBtn");

  let currentProfileUrl = "/assets/profile_default.webp";
  let resetToDefault = false;
  let isCheckDuplicateNickname = false;
  let originalNickname = "";

  // 실시간 닉네임 검사
  FormHelper.attachValidation(
    nicknameInput,
    Valid.isValidNickname,
    message.NICKNAME.INVALID
  );

  // 회원 정보 불러오기
  try {
    const data = await apiFetch("/api/users/me", {
      method: "GET",
    });

    if (data.ok === false) {
      alert(data.message);
      return;
    }

    // 회원정보 뿌리기
    emailInput.value = data.email;
    nicknameInput.value = data.nickname;
    originalNickname = data.nickname;

    if (data.profileImageUrl) {
      profilePreview.src = data.profileImageUrl;
      currentProfileUrl = data.profileImageUrl;
    }
  } catch (err) {
    console.error(" 회원정보 로드 실패:", err);
    alert("회원정보를 불러올 수 없습니다.");
  }

  // 기본 이미지로 변경
  resetBtn.addEventListener("click", () => {
    profilePreview.src = "/assets/profile_default.webp";
    profileFileInput.value = "";
    resetToDefault = true;
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

      if (data.ok === false) {
        alert(data.message);
        return;
      }

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

  // 닉네임 입력값이 바뀌면 중복확인 초기화
  nicknameInput.addEventListener("input", () => {
    isCheckDuplicateNickname = false;
  });

  // 이미지 클릭 → 파일창 열기
  profilePreview.addEventListener("click", () => {
    profileFileInput.click();
  });

  // 프로필 미리보기 변경 + 확장자 검사
  profileFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. 확장자 검사
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    const fileExt = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      alert("이미지 파일은 jpg, jpeg, png, webp 형식만 업로드할 수 있습니다.");
      profileFileInput.value = "";
      return;
    }

    // 2. 파일 사이즈 제한 (예: 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("이미지 파일 크기는 최대 5MB까지 가능합니다.");
      profileFileInput.value = "";
      return;
    }

    // 3. 미리보기 처리
    const reader = new FileReader();
    reader.onload = (event) => {
      profilePreview.src = event.target.result;
      resetToDefault = false;
    };
    reader.readAsDataURL(file);
  });

  // 회원정보 수정 (닉네임 + 프로필 이미지)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nickname = nicknameInput.value.trim();

    // TODO 프로필이미지도 변경사항 추가해야함
    if (nickname === originalNickname) {
      alert("수정할 사항이 없습니다.");
      return;
    }

    if (!Valid.isValidNickname(nickname)) {
      alert(message.NICKNAME.INVALID);
      nicknameInput.focus();
      return;
    }

    if (!isCheckDuplicateNickname) {
      alert("닉네임 중복확인을 해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("nickname", nickname);

    for (const [key, value] of formData.entries()) {
      console.log("FormData:", key, value);
    }

    // 프로필 이미지 업로드
    // const file = profileFileInput.files[0];
    // if (resetToDefault) {
    //   formData.append("deleteProfileImage", "true"); // 이미지 삭제를 백엔드에게 알리기
    // } else if (file) {
    //   formData.append("profileImage", file);
    // }

    try {
      const data = await apiFetch("/api/users/me", {
        method: "PATCH",
        body: formData,
      });

      if (data.ok === false) {
        alert(data.message);
        return;
      }

      alert("회원정보가 수정되었습니다.");
      window.location.reload();
    } catch (err) {
      console.error("회원정보 수정 오류:", err);
      alert(message.COMMON.SERVER_ERROR);
    }
  });

  // 회원 탈퇴
  withdrawBtn.addEventListener("click", async () => {
    if (
      !confirm(
        nicknameInput.value +
          " 님, 정말 탈퇴하시겠습니까? \n탈퇴 시 모든 회원 정보와 서비스 이용 기록은 삭제되며 복구할 수 없습니다."
      )
    )
      return;

    try {
      const data = await apiFetch("/api/users/withdraw", {
        method: "DELETE",
      });

      if (data.ok === false) {
        alert(data.message);
        return;
      }

      alert("회원 탈퇴가 완료되었습니다.");
      window.location.href = "/login";
    } catch (err) {
      console.error("회원 탈퇴 오류:", err);
      alert("회원 탈퇴 중 오류가 발생했습니다.");
    }
  });
});
