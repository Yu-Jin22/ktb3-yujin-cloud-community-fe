import { Valid } from "./utils/valid.js";
import { FormHelper } from "./utils/formHelper.js";
import { message } from "./utils/message.js";
import { apiFetch } from "./common/apiFetch.js";
import { fileUploader } from "./common/fileUploader.js";

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

    if (data.profileUrl) {
      profilePreview.src = data.profileUrl;
      currentProfileUrl = data.profileUrl;
      resetBtn.style.display = "block";
    } else {
      resetBtn.style.display = "none";
    }
  } catch (err) {
    console.error(" 회원정보 로드 실패:", err);
    alert("회원정보를 불러올 수 없습니다.");
  }

  // TODO. 이미지 압축 & 헤더사진 & S3 언제 돈나가나 체크 & 백엔드 예외처리

  // 기본 이미지로 변경
  resetBtn.addEventListener("click", async () => {
    if (!confirm("기본 이미지로 되돌리시겠습니까?")) return false;

    try {
      await apiFetch("/api/users/profile-image", {
        method: "DELETE",
      });
      profilePreview.src = "/assets/profile_default.webp";
      resetBtn.style.display = "none";
      localStorage.removeItem("profileUrl");
      // 헤더 이미지 반영
      headerProfile(profilePreview.src);
    } catch (err) {
      alert("기본 이미지로 변경 실패");
    }
  });

  // 닉네임 중복확인
  nickNameBtn.addEventListener("click", async (e) => {
    const nickname = nicknameInput.value.trim();
    if (!Valid.isValidNickname(nickname)) {
      alert(message.NICKNAME.INVALID);
      return false;
    }

    try {
      const data = await apiFetch("/api/users/nickname", {
        method: "POST",
        body: JSON.stringify({ nickname }),
      });

      if (data.ok === false) {
        alert(data.message);
        return false;
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
  profileFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm("프로필은 수정시 바로 변경됩니다. 변경하시겠습니까?"))
      return false;

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
    profilePreview.src = URL.createObjectURL(file);
    resetBtn.style.display = "block";

    // 4. S3 업로드 + DB 저장
    try {
      const res = await fileUploader.uploadProfileImage(file);
      if (!res) {
        alert("이미지 업로드 실패했습니다. 다시 시도해주세요.");
        console.error(err);
      }
      console.log("프로필 업로드 성공", res);
      localStorage.setItem("profileUrl", res.profileUrl);

      // 헤더 이미지 반영
      headerProfile(res.profileUrl);
    } catch (err) {
      alert("이미지 업로드 실패했습니다. 다시 시도해주세요.");
      console.error(err);
    }
  });

  // 닉네임 수정
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nickname = nicknameInput.value.trim();

    if (nickname === originalNickname) {
      alert("수정할 사항이 없습니다.");
      return false;
    }

    if (!Valid.isValidNickname(nickname)) {
      alert(message.NICKNAME.INVALID);
      nicknameInput.focus();
      return false;
    }

    if (!isCheckDuplicateNickname) {
      alert("닉네임 중복확인을 해주세요.");
      return false;
    }

    try {
      const data = await apiFetch("/api/users/nickname", {
        method: "PATCH",
        body: JSON.stringify({ nickname: nickname }),
      });

      if (data.ok === false) {
        alert(data.message);
        return;
      }

      alert("닉네임이 수정되었습니다.");
      nicknameInput.value = nickname;
      isCheckDuplicateNickname = false;
    } catch (err) {
      console.error("닉네임 수정 오류:", err);
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

function headerProfile(url) {
  const headerProfile = document.querySelector(".profile-img");
  if (headerProfile) {
    headerProfile.style.backgroundImage = `url(${url})`;
  }
}
