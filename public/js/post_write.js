import { apiFetch } from "./common/apiFetch.js";
import { fileUploader } from "./common/fileUploader.js";

let selectedImageMeta = null;

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

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const fileName = document.getElementById("fileName");

    if (!file) {
      fileName.textContent = "파일을 선택해주세요.";
      selectedImageMeta = null;
      return;
    }

    // 1. 확장자 검사
    const allowed = ["jpg", "jpeg", "png", "webp"];
    const ext = file.name.split(".").pop().toLowerCase();

    if (!allowed.includes(ext)) {
      alert("이미지 파일은 jpg, jpeg, png, webp 형식만 업로드할 수 있습니다.");
      fileInput.value = "";
      fileName.textContent = "파일을 선택해주세요.";
      selectedImageMeta = null;
      return;
    }

    // 2. 사이즈 제한 (5MB)
    const max = 5 * 1024 * 1024;
    if (file.size > max) {
      alert("이미지 파일 크기는 최대 5MB까지 가능합니다.");
      fileInput.value = "";
      fileName.textContent = "파일을 선택해주세요.";
      selectedImageMeta = null;
      return;
    }

    // 3. 파일명 표시
    fileName.textContent = file.name;

    // 4. meta 정보 저장
    selectedImageMeta = {
      file,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  });
});

// 게시물 저장
async function handleCreate(e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const fileInput = document.getElementById("file");

  let uploadedFiles = [];
  // [{ key, originalName, fileSize, mimeType }]

  // Presigned 업로드
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];

    try {
      const keys = await fileUploader.uploadPostImages([file], null);

      uploadedFiles = [
        {
          key: keys[0], // presigned key
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        },
      ];
    } catch (err) {
      console.error(err);
      alert("이미지 업로드 실패");
      return;
    }
  }

  const body = {
    title,
    content,
    images: uploadedFiles,
    // ← 단일 업로드이지만 배열 형태
  };

  try {
    const data = await apiFetch("/api/posts", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    if (data.ok === false) {
      alert(data.message);
      return;
    }

    alert("게시글이 등록되었습니다.");
    window.location.href = "/posts";
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

    if (data.ok === false) {
      alert(data.message);
      return;
    }

    document.getElementById("title").value = data.title;
    document.getElementById("content").value = data.content;

    if (data.images && data.images.length > 0) {
      const img = data.images[0];

      document.getElementById("fileName").textContent =
        data.images[0]["fileName"];
    }
  } catch (err) {
    console.error(err);
    alert("게시글 정보를 불러오지 못했습니다.");
  }
}

// 게시물 수정
async function handleEdit(e, postId) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const fileInput = document.getElementById("file");

  let newImage = null;

  // 새 이미지 선택된 경우에만 S3 업로드
  if (fileInput.files.length > 0 && selectedImageMeta) {
    const file = selectedImageMeta.file;

    try {
      const keys = await fileUploader.uploadPostImages([file], postId);

      newImage = {
        key: keys[0],
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };
    } catch (err) {
      console.error(err);
      alert("이미지 업로드 실패");
      return;
    }
  }

  const body = {
    title,
    content,
  };

  // 새 이미지가 선택된 경우에만 newImage 포함
  if (newImage) {
    body.newImage = newImage;
  }

  try {
    const data = await apiFetch(`/api/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    if (data.ok === false) {
      alert(data.message);
      return;
    }

    alert("게시글이 수정되었습니다.");
    window.location.href = `/posts/${postId}`;
  } catch (err) {
    console.error(err);
    alert("게시글 수정 중 오류가 발생했습니다.");
  }
}

function getPostIdFromUrl() {
  const match = window.location.pathname.match(/\/posts\/edit\/(\d+)/);
  return match ? match[1] : null;
}
