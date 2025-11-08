import { Format } from "./utils/format.js";
import { apiFetch } from "./common/apiFetch.js";

// 페이징 상태
let commentPage = 0;
const commentSize = 4;
let commentLoading = false;
let commentEnd = false;

// 댓글 이벤트 등록 여부
let commentEventListenerAdded = false;

// 현재 수정 중인 댓글 ID를 저장
let editingCommentId = null;

// 첫 페이지 로드 + 버튼 이벤트 연결
export async function initCommentPaging(postId) {
  // 상태 초기화
  commentPage = 0;
  commentEnd = false;
  commentLoading = false;

  const list = document.getElementById("commentList");
  const btn = document.getElementById("loadMoreComments");

  // 목록 비우기
  list.innerHTML = "";

  // 첫 페이지 로드
  await loadComments(postId, { append: true });

  // 더보기 버튼 세팅
  if (btn) {
    btn.onclick = async () => {
      await loadComments(postId, { append: true });
    };
  }

  // 수정/삭제 이벤트 델리게이션은 한 번만
  if (!commentEventListenerAdded) {
    setupCommentEventListeners(postId);
    commentEventListenerAdded = true;
  }
}

// 댓글 로드 함수
export async function loadComments(postId, { append = false } = {}) {
  if (commentLoading || commentEnd) return;

  const list = document.getElementById("commentList");
  const btn = document.getElementById("loadMoreComments");
  const spinner = document.getElementById("commentSpinner");

  commentLoading = true;
  if (spinner) spinner.classList.remove("hidden");
  if (btn) btn.style.display = "none";

  try {
    const query = `?page=${commentPage}&size=${commentSize}`;
    const data = await apiFetch(`/api/posts/${postId}/comments${query}`, {
      method: "GET",
    });
    if (!data) return;

    const items = data.content ?? [];

    if (!append) list.innerHTML = "";
    renderComments(items, list);

    // 다음 페이지 준비
    commentPage += 1;

    // 마지막 여부 체크
    if (data.last === true || items.length < commentSize) {
      commentEnd = true;
      // 버튼 없애고 종료 메시지
      const box = document.getElementById("commentLoadBox");
      if (box) box.style.display = "none";
    } else {
      // 아직 남음 → 버튼 다시 노출
      if (btn) btn.style.display = "block";
    }
  } catch (err) {
    console.error("댓글 불러오기 오류:", err);
    if (list.children.length === 0) {
      list.innerHTML = `<li class="error">댓글을 불러오지 못했습니다.</li>`;
    }
  } finally {
    commentLoading = false;
    if (spinner) spinner.classList.add("hidden");
  }
}

function renderComments(comments, commentList) {
  if (!comments || comments.length === 0) {
    if (commentList.children.length === 0) {
      commentList.innerHTML = `<li class="empty">댓글이 존재하지 않습니다.</li>`;
    }
    return;
  }

  comments.forEach((comment) => {
    const li = document.createElement("li");
    li.className = "comment-item";
    li.dataset.id = comment.commentId;

    li.innerHTML = `
      <div class="comment-meta">
        <div class="comment-author">
          <img src="${
            comment.authorProfileImageUrl || "/assets/profile_default.webp"
          }" alt="작성자" />
          <span>${comment.authorNickname}</span>
          <span>${Format.formatDate(comment.createdAt)}</span>
        </div>
        <div class="comment-actions">
          ${
            comment.author
              ? `<button data-id="${comment.commentId}" class="edit-btn">수정</button>
                 <button data-id="${comment.commentId}" class="delete-btn">삭제</button>`
              : ""
          }
        </div>
      </div>
      <p class='comment-text'>${comment.comment}</p>
    `;

    commentList.appendChild(li);
  });
}

// 댓글 작성
export async function createComment(postId) {
  const commentInput = document.getElementById("commentInput");
  const commentText = commentInput.value.trim();

  // 입력 검증
  if (!commentText) {
    alert("댓글 내용을 입력해주세요.");
    commentInput.focus();
    return;
  }

  if (commentText.length > 500) {
    alert("댓글은 500자 이하로 입력해주세요.");
    commentInput.focus();
    return;
  }

  try {
    const data = await apiFetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({
        comment: commentText,
      }),
    });
    if (!data) return;

    // 입력 초기화
    commentInput.value = "";

    // 작성 후에는 첫 페이지부터 다시 로드
    await refreshCommentsFromStart(postId);
  } catch (err) {
    console.error("댓글 작성 오류:", err);
    alert(err.message || "댓글 작성 중 오류가 발생했습니다.");
  }
}

// 댓글 이벤트 리스너 설정
function setupCommentEventListeners(postId) {
  const list = document.getElementById("commentList");

  list.addEventListener("click", async (e) => {
    const t = e.target;

    if (t.classList.contains("delete-btn")) {
      const id = t.dataset.id;
      await handleDeleteComment(postId, id);
    }

    if (t.classList.contains("edit-btn")) {
      const id = t.dataset.id;
      handleEditComment(id);
    }
  });
}

// 댓글 삭제 처리
async function handleDeleteComment(postId, commentId) {
  if (!confirm("해당 댓글을 삭제하시겠습니까?")) return;

  try {
    const data = await apiFetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
    });

    if (!data) return;

    alert("댓글이 삭제되었습니다.");

    // 삭제 후에도 목록을 처음부터 새로 가져옴
    await refreshCommentsFromStart(postId);
  } catch (err) {
    console.error("댓글 삭제 오류:", err);
    alert(err.message || "댓글 삭제 중 오류가 발생했습니다.");
  }
}

// 댓글 수정
function handleEditComment(commentId) {
  // 이미 다른 댓글을 수정 중이면 해제
  if (editingCommentId && editingCommentId !== commentId) {
    const prevCommentItem = document.querySelector(
      `.comment-item[data-id="${editingCommentId}"]`
    );
    if (prevCommentItem) {
      toggleCommentButtons(prevCommentItem, false);
    }
  }

  const editBtn = document.querySelector(`.edit-btn[data-id="${commentId}"]`);

  if (!editBtn) {
    alert("댓글을 찾을 수 없습니다.");
    return;
  }

  const commentItem = editBtn.closest(".comment-item");

  // 댓글 내용 가져오기
  const commentTextEl = commentItem.querySelector(".comment-text");
  const commentText = commentTextEl.textContent;

  // 입력창에 댓글 내용 설정
  const commentInput = document.getElementById("commentInput");
  commentInput.value = commentText;
  commentInput.focus();

  // 수정 모드 활성화
  editingCommentId = commentId;

  // 폼 UI 업데이트
  updateFormUI(true);

  // 해당 댓글의 버튼만 비활성화
  toggleCommentButtons(commentItem, true);

  // 입력창으로 스크롤
  commentInput.scrollIntoView({ behavior: "smooth", block: "center" });
}

// 댓글 버튼 활성화/비활성화 토글
function toggleCommentButtons(commentItem, disable) {
  commentItem.classList.toggle("editing", disable);

  const buttons = commentItem.querySelectorAll(".edit-btn, .delete-btn");
  buttons.forEach((btn) => (btn.disabled = disable));
}

// 댓글 작성 폼 초기화
export function initCommentForm(postId) {
  const commentForm = document.getElementById("commentForm");
  const commentInput = document.getElementById("commentInput");
  const submitBtn = document.querySelector(
    "#commentForm button[type='submit']"
  );
  const cancelBtn = document.getElementById("cancelEditBtn");

  if (!commentForm || !commentInput) {
    console.error("댓글 폼 요소를 찾을 수 없습니다.");
    return;
  }

  // 초기 상태: 취소 버튼 숨김
  cancelBtn.style.display = "none";

  // 폼 제출 이벤트
  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (editingCommentId) {
      // 수정 모드
      await updateComment(postId, editingCommentId);
    } else {
      // 작성 모드
      await createComment(postId);
    }
  });

  // 취소 버튼 클릭
  cancelBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    cancelEdit();
  });

  // Enter 키로 제출 (Shift+Enter는 줄바꿈)
  commentInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (editingCommentId) {
        await updateComment(postId, editingCommentId);
      } else {
        await createComment(postId);
      }
    }
  });
}

// 수정 모드 취소
function cancelEdit() {
  // 입력창 초기화
  const commentInput = document.getElementById("commentInput");
  commentInput.value = "";

  // 수정 중이던 댓글의 버튼 활성화
  if (editingCommentId) {
    const commentItem = document.querySelector(
      `.comment-item[data-id="${editingCommentId}"]`
    );
    if (commentItem) {
      toggleCommentButtons(commentItem, false);
    }
  }

  // 수정 중인 댓글 ID 초기화
  editingCommentId = null;

  // 폼 UI 업데이트
  updateFormUI(false);
}

function updateFormUI(isEditMode) {
  const submitBtn = document.querySelector(
    "#commentForm button[type='submit']"
  );
  const cancelBtn = document.getElementById("cancelEditBtn");
  const commentForm = document.getElementById("commentForm");

  if (isEditMode) {
    // 수정 모드
    submitBtn.textContent = "댓글 수정";
    cancelBtn.style.display = "inline-block";
    commentForm.classList.add("edit-mode");
  } else {
    // 작성 모드
    submitBtn.textContent = "댓글 등록";
    cancelBtn.style.display = "none";
    commentForm.classList.remove("edit-mode");
  }
}

// 댓글 수정
async function updateComment(postId, commentId) {
  const commentInput = document.getElementById("commentInput");
  const commentText = commentInput.value.trim();

  // 입력 검증
  if (!commentText) {
    alert("댓글 내용을 입력해주세요.");
    commentInput.focus();
    return;
  }

  if (commentText.length > 500) {
    alert("댓글은 500자 이하로 입력해주세요.");
    commentInput.focus();
    return;
  }

  try {
    const data = await apiFetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({
        comment: commentText,
      }),
    });

    if (!data) return;
    alert("댓글이 수정되었습니다.");

    // 수정 모드 해제
    cancelEdit();

    // 1. 기존 댓글 DOM 찾기
    const commentItem = document.querySelector(
      `.comment-item[data-id="${commentId}"]`
    );
    if (commentItem) {
      // 2. 수정된 내용만 반영
      const textEl = commentItem.querySelector(".comment-text");
      textEl.textContent = data.comment;
    }

    // 4. 버튼 활성화
    if (commentItem) toggleCommentButtons(commentItem, false);

    // 5. 수정 후 입력창 초기화
    commentInput.value = "";
  } catch (err) {
    console.error("댓글 수정 오류:", err);
    alert(err.message || "댓글 수정 중 오류가 발생했습니다.");
  }
}

async function refreshCommentsFromStart(postId) {
  commentPage = 0;
  commentEnd = false;
  const list = document.getElementById("commentList");
  const box = document.getElementById("commentLoadBox");
  if (box) {
    box.innerHTML = `
      <button id="loadMoreComments" class="btn-more">댓글 더보기</button>
      <div id="commentSpinner" class="loading-spinner hidden"><div class="spinner"></div></div>
    `;
  }
  list.innerHTML = "";
  await initCommentPaging(postId);
}
