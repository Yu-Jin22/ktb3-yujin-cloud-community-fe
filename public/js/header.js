import { message } from "./utils/message.js";
import { apiFetch } from "./common/apiFetch.js";

document.addEventListener("DOMContentLoaded", () => {
  // 임시로 로그아웃 구현을 위해 프로필 클릭시 로그아웃되게 해놓음
  const sampleLogout = document.getElementById("sampleLogout");

  // 로그아웃
  sampleLogout.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      const data = await apiFetch("/api/auth", {
        method: "DELETE",
        credentials: "include",
      });

      if (!data) return;

      alert("로그아웃되었습니다.");

      location.href = "/login";
    } catch (err) {
      console.error("로그아웃 요청 오류:", err);
      alert(message.COMMON.SERVER_ERROR);
    }
  });
});
