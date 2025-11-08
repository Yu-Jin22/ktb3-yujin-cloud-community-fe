import { Format } from "./utils/format.js";
import { initCommentPaging, initCommentForm } from "./comment.js";
import { apiFetch } from "./common/apiFetch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const postId = getPostIdFromUrl();
  const titleEl = document.getElementById("postTitle");
  const likeEl = document.getElementById("likeCount");
  const editBtn = document.getElementById("editBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const imageContainer = document.getElementById("imageContainer");
  let isLiked = false;

  try {
    const data = await apiFetch(`/api/posts/${postId}`, {
      method: "GET",
    });

    if (!data) return;

    // 게시글 데이터 렌더링
    renderPostDetail(data);

    // 좋아요 초기 상태 설정
    isLiked = data.liked;
    updateLikeUI(likeEl, isLiked, data.likeCount);

    // 좋아요 버튼 클릭 이벤트
    likeEl.addEventListener("click", async () => {
      await toggleLike(postId, likeEl);
    });

    // 이미지 렌더링 함수 호출
    renderPostImages(imageContainer, data.imageUrls);

    // 댓글 불러오기
    await initCommentPaging(postId);

    // 댓글 작성 폼 초기화
    initCommentForm(postId);

    // 삭제 버튼
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("해당 게시글을 삭제하시겠습니까?")) return;

      try {
        const data = await apiFetch(`/api/posts/${postId}`, {
          method: "DELETE",
        });

        if (!data) return;
        alert("게시물 삭제가 완료되었습니다.");

        window.location.href = "/posts";
      } catch (err) {
        console.error("게시물 삭제 오류:", err);
        alert("게시물 삭제 중 오류가 발생했습니다.");
      }
    });

    // 수정 버튼
    editBtn.addEventListener("click", async () => {
      goToUpdate(postId);
    });
  } catch (err) {
    console.error(" 게시글 불러오기 오류:", err);
    titleEl.textContent = "게시글을 불러올 수 없습니다.";
  }
});

function renderPostDetail(data) {
  document.getElementById("postTitle").textContent = data.title;
  document.getElementById("postAuthor").textContent = data.authorNickname;
  document.getElementById("profileImg").src =
    data.authorProfileImageUrl || "/assets/profile_default.webp";
  document.getElementById("postDate").textContent = Format.formatDate(
    data.createdAt
  );
  document.getElementById("postContent").textContent = data.content;
  document.getElementById("viewCount").textContent = `👁 ${Format.formatCount(
    data.hit
  )} 조회수`;
  document.getElementById(
    "commentCount"
  ).textContent = `💬 ${Format.formatCount(data.commentCount)} 댓글`;

  // 작성자 여부
  const editBtn = document.getElementById("editBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  editBtn.style.display = data.author ? "inline-block" : "none";
  deleteBtn.style.display = data.author ? "inline-block" : "none";

  renderPostImages(document.getElementById("imageContainer"), data.imageUrls);
}

function updateLikeUI(likeEl, liked, likeCount) {
  if (liked) {
    likeEl.innerHTML = `❤️ ${Format.formatCount(likeCount)} 좋아요`;
  } else {
    likeEl.innerHTML = `🤍 ${Format.formatCount(likeCount)} 좋아요`;
  }
}

async function toggleLike(postId, likeEl) {
  try {
    const data = await apiFetch(`/api/posts/${postId}/like`, {
      method: "POST",
    });

    if (!data) return;

    updateLikeUI(likeEl, data.liked, data.likeCount);
  } catch (err) {
    console.error("좋아요 토글 오류:", err);
    alert("좋아요 요청 중 오류가 발생했습니다.");
  }
}

function goToUpdate(postId) {
  location.href = `/posts/edit/${postId}`;
}

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
