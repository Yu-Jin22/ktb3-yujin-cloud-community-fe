import { message } from "./utils/message.js";
import { apiFetch } from "./common/apiFetch.js";

document.addEventListener("DOMContentLoaded", () => {
  const profileArea = document.querySelector(".profile-area");
  const profileImgDiv = document.querySelector(".profile-img");
  const dropdown = document.getElementById("dropdown");
  const logoutBtn = document.getElementById("logoutBtn");
  const backBtn = document.getElementById("backBtn");

  if (window.IS_LOGGED_IN) {
    profileArea.style.display = "flex";
    const storedProfile = localStorage.getItem("profileUrl");

    if (storedProfile) {
      profileImgDiv.style.backgroundImage = `url(${storedProfile})`;
    }
  } else {
    profileArea.style.display = "none";
  }

  profileArea.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("show");
  });

  // 로그아웃
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      const data = await apiFetch("/api/auth", {
        method: "DELETE",
        credentials: "include",
      });

      if (data.ok === false) {
        alert(data.message);
        return;
      }

      localStorage.removeItem("profileUrl");
      alert("로그아웃되었습니다.");

      location.href = "/login";
    } catch (err) {
      console.error("로그아웃 요청 오류:", err);
      alert(message.COMMON.SERVER_ERROR);
    }
  });

  // 뒤로가기 제어
  backBtn.addEventListener("click", () => {
    if (window.IS_LOGGED_IN) {
      // 로그인 상태라면 무조건 게시글 목록으로
      location.href = "/posts";
    } else {
      history.back(); // 비로그인이라면 그냥 뒤로가기
    }
  });
});
