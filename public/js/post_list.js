import { Format } from "./utils/format.js";

document.addEventListener("DOMContentLoaded", async () => {
  const postList = document.getElementById("postList");
  const loadingMsg = document.getElementById("loadingMsg");

  try {
    loadingMsg.hidden = false;
    const res = await fetch("/api/posts", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("게시글을 불러오는데 실패했습니다.");
    }

    const posts = await res.json();
    renderPosts(posts.posts, postList);
  } catch (err) {
    console.error(" 게시글 불러오기 오류:", err);
    postList.innerHTML = `<li>게시글을 불러오지 못했습니다.<br> 다시 시도해주세요.</li>`;
  } finally {
    loadingMsg.hidden = true;
  }
});

// 게시글 랜더링 함수
function renderPosts(posts, postList) {
  if (!posts || posts.length === 0) {
    postList.innerHTML = `<li>등록된 게시글이 없습니다.</li>`;
    return;
  }

  // 게시물 목록 초기화
  postList.innerHTML = "";

  // for문으로 li그리기
  posts.forEach((post) => {
    const li = document.createElement("li");
    li.className = "post-item";

    const profileImg =
      post.authorProfileImageUrl || "/assets/profile_default.webp";

    li.innerHTML = `
        <p class="post-title">${post.title}</p>
        <div class="post-meta">
            <div class="post-counts">
                <span>좋아요 ${Format.formatCount(post.likeCount)}</span>
                <span>댓글 ${Format.formatCount(post.commentCount)}</span>
                <span>조회수 ${Format.formatCount(post.hit)}</span>
            </div>
            <span class="post-date">${Format.formatDate(post.createdAt)}</span>
        </div>
        <div class="post-author">
            <img src="${profileImg}" alt="작성자" class="author-img"/>
            <span class="nickname">${post.authorNickname}</span>
        </div>
        `;

    // li 클릭 시 상세 페이지로 이동
    li.addEventListener("click", () => goToDetail(post.postId));

    postList.appendChild(li);
  });
}

function goToDetail(postId) {
  location.href = `/posts/${postId}`;
}
