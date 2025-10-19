import { Format } from "./utils/format.js";

document.addEventListener("DOMContentLoaded", async () => {
  const postId = getPostIdFromUrl();
  const titleEl = document.getElementById("postTitle");
  const profileEl = document.getElementById("profileImg");
  const authorEl = document.getElementById("postAuthor");
  const dateEl = document.getElementById("postDate");
  const contentEl = document.getElementById("postContent");
  const likeEl = document.getElementById("likeCount");
  const viewEl = document.getElementById("viewCount");
  const commentEl = document.getElementById("commentCount");
  const editBtn = document.getElementById("editBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const imageContainer = document.getElementById("imageContainer");

  try {
    const res = await fetch(`/api/posts/${postId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("게시글을 불러오는데 실패했습니다.");
    }

    const data = await res.json();

    // 화면에 데이터 표시
    titleEl.textContent = data.title;
    authorEl.textContent = data.authorNickname;
    profileEl.src =
      data.authorProfileImageUrl || "/assets/profile_default.webp";
    dateEl.textContent = Format.formatDate(data.createdAt);
    contentEl.textContent = data.content;

    likeEl.textContent = `❤️ ${Format.formatCount(data.likeCount)} 좋아요`;
    viewEl.textContent = `👁 ${Format.formatCount(data.hit)} 조회수`;
    commentEl.textContent = `💬 ${Format.formatCount(data.commentCount)} 댓글`;

    // 작성자 여부에 따라 수정/삭제 버튼 제어
    editBtn.style.display = data.author ? "inline-block" : "none";
    deleteBtn.style.display = data.author ? "inline-block" : "none";

    // 이미지 렌더링 함수 호출
    renderPostImages(imageContainer, data.imageUrls);
  } catch (err) {
    console.error(" 게시글 불러오기 오류:", err);
    titleEl.textContent = "게시글을 불러올 수 없습니다.";
  }
});

function getPostIdFromUrl() {
  const path = window.location.pathname;
  const segments = path.split("/");
  return segments[segments.length - 1];
}

function renderPostImages(container, imageUrls) {
  // 기존 이미지 초기화
  container.innerHTML = "";

  // 이미지 배열이 없거나 비어있으면 숨기기
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    container.style.display = "none";
    return;
  }

  // 이미지가 있으면 컨테이너 표시
  container.style.display = "block";

  imageUrls.forEach((url) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "게시물 이미지";
    img.className = "detail-image";
    container.appendChild(img);
  });
}
