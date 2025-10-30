import { apiFetch } from "./common/apiFetch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const postId = getPostIdFromUrl();
  const form = document.getElementById("postForm");
  const titleEl = document.getElementById("title");
  const contentEl = document.getElementById("content");
  const fileInput = document.getElementById("file");
  const fileName = document.getElementById("fileName");
  const titleText = document.querySelector(".form-title");

  if (postId) {
    // 수정 모드
    titleText.textContent = "게시글 수정";
    loadPostData(postId);
    form.addEventListener("submit", (e) => handleEdit(e, postId));
  } else {
    // 작성 모드
    titleText.textContent = "게시글 작성";
    form.addEventListener("submit", handleCreate);
  }
});

// 게시물 저장
async function handleCreate(e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const fileInput = document.getElementById("file");
  const formData = new FormData();

  formData.append("request", JSON.stringify({ title, content }));

  // 파일 추가
  if (fileInput.files.length > 0) {
    for (const file of fileInput.files) {
      formData.append("images", file);
    }
  }

  try {
    const data = await apiFetch("/api/posts", {
      method: "POST",
      body: formData,
    });

    if (!data) return;

    alert("게시글이 등록되었습니다.");
    window.location.href = "/posts"; // 목록 페이지로 이동
  } catch (err) {
    console.error(err);
    alert("게시글 등록 중 오류가 발생했습니다.");
  }
}

// 게시물 수정시 게시물 불러오기
async function loadPostData(postId) {
  try {
    const data = await apiFetch(`/api/posts/edit/${postId}`, {
      method: "GET",
    });

    if (!data) return;

    document.getElementById("title").value = data.title;
    document.getElementById("content").value = data.content;

    if (data.imageUrls && data.imageUrls.length > 0) {
      document.getElementById("fileName").textContent = data.imageUrls[0];
    }
  } catch (err) {
    console.error(err);
    alert("게시글 정보를 불러오지 못했습니다.");
  }
}

// 게시물 수정
async function handleEdit(e, postId) {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const fileInput = document.getElementById("file");

  const formData = new FormData();

  formData.append("request", JSON.stringify({ title, content }));

  for (const [key, value] of formData.entries()) {
    console.log("FormData:", key, value);
  }

  // TODO 파일 삭제 및 추가 관련 작업

  try {
    const data = await apiFetch(`/api/posts/${postId}`, {
      method: "PATCH",
      body: formData,
    });

    if (!data) return;

    alert("게시글이 수정되었습니다.");
    window.location.href = `/posts/${postId}`; // 수정 완료 후 상세 페이지로 이동
  } catch (err) {
    console.error(err);
    alert("게시글 수정 중 오류가 발생했습니다.");
  }
}

function getPostIdFromUrl() {
  const match = window.location.pathname.match(/\/posts\/edit\/(\d+)/);
  return match ? match[1] : null;
}
