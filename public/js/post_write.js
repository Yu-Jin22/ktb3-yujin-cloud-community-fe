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

async function handleCreate(e) {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const fileInput = document.getElementById("file");
  const form = document.getElementById("postForm");
  const formData = new FormData();

  formData.append("request", JSON.stringify({ title, content }));

  // 파일 추가
  if (fileInput.files.length > 0) {
    for (const file of fileInput.files) {
      formData.append("images", file);
    }
  }

  try {
    // validInput(formData);
    for (const [key, value] of formData.entries()) {
      console.log("FormData:", key, value);
    }

    const res = await fetch("/api/posts", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!res.ok) throw new Error("게시글 등록 실패");
    alert("게시글이 등록되었습니다!");
    window.location.href = "/posts"; // 목록 페이지로 이동
  } catch (err) {
    console.error(err);
    alert("게시글 등록 중 오류가 발생했습니다.");
  }
}

// function validInput(data) {
//   if (!data.title) {
//     alert("제목은 필수입력입니다.");
//     return false;
//   } else if (!data.content) {
//     alert("내용은 필수입력입니다.");
//     return false;
//   }
// }

function getPostIdFromUrl() {
  const match = window.location.pathname.match(/\/posts\/edit\/(\d+)/);
  return match ? match[1] : null;
}
