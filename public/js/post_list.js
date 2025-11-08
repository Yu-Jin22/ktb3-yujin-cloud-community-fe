import { Format } from "./utils/format.js";
import { apiFetch } from "./common/apiFetch.js";

let cursor = null; // 마지막 게시물 ID (커서)
let loading = false; // 중복 요청 방지용
let isEnd = false; // 더 이상 게시물이 없을 때 true
const size = 10;

document.addEventListener("DOMContentLoaded", async () => {
  const postList = document.getElementById("postList");
  const loadingSpinner = document.getElementById("loadingSpinner");

  // 1, 첫번쨰 페이지 불러오기
  await loadPosts(postList, loadingSpinner);

  // 2. 스크롤 이벤트 등록
  window.addEventListener("scroll", async () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    // 스크롤이 거의 맨 아래 왔을 때
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      await loadPosts(postList, loadingSpinner);
    }
  });
});

async function loadPosts(postList, loadingSpinner) {
  if (loading || isEnd) return; // 중복/마지막 페이지 방지
  loading = true;
  loadingSpinner.classList.remove("hidden");

  try {
    // 커서 기반 요청
    const query = cursor ? `?cursor=${cursor}&size=${size}` : `?size=${size}`;
    const posts = await apiFetch(`/api/posts${query}`, { method: "GET" });

    if (!posts || !posts.posts) return;

    // 새 게시글 추가 렌더링
    renderPosts(posts.posts, postList, true);

    // 다음 커서값 갱신 (마지막 게시물의 ID)
    if (posts.posts.length > 0) {
      cursor = posts.posts[posts.posts.length - 1].postId;
    }

    // 응답이 page size보다 적다면 마지막 페이지임
    if (posts.posts.length < size) {
      isEnd = true;
      loadingSpinner.classList.add("hidden");
    }
  } catch (err) {
    console.error("게시글 불러오기 오류:", err);
    postList.insertAdjacentHTML(
      "beforeend",
      `<li>게시글을 불러오지 못했습니다. 다시 시도해주세요.</li>`
    );
  } finally {
    loading = false;
    if (!isEnd) loadingSpinner.classList.add("hidden");
  }
}

// 게시글 랜더링 함수
function renderPosts(posts, postList, append = false) {
  if (!posts || posts.length === 0) {
    if (!append) {
      postList.innerHTML = `<li>등록된 게시글이 없습니다.</li>`;
    }
    return;
  }

  // 초기 로드 시에만 비움
  if (!append) postList.innerHTML = "";

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
