import { Format } from "./utils/format.js";
import { apiFetch } from "./common/apiFetch.js";

// 댓글 이벤트 등록 여부
let commentEventListenerAdded = false;

// 현재 수정 중인 댓글 ID를 저장
let editingCommentId = null;

// 댓글 로드 함수
export async function loadComments(postId) {
  const commentEl = document.getElementById("commentList");
  const cancelBtn = document.getElementById("cancelEditBtn");
  cancelBtn.style.display = "none";

  try {
    const data = await apiFetch(`/api/posts/${postId}/comments`, {
      method: "GET",
    });

    if (!data) return;

    commentEl.innerHTML = "";

    if (!data.content || data.content.length === 0) {
      commentEl.innerHTML = `<li class="empty">댓글이 존재하지 않습니다.</li>`;
      return;
    }

    data.content.forEach((comment) => {
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
      commentEl.appendChild(li);
    });

    // 이벤트 리스너를 한 번만 등록
    if (!commentEventListenerAdded) {
      setupCommentEventListeners(postId);
      commentEventListenerAdded = true;
    }
  } catch (err) {
    console.error("댓글 불러오기 오류:", err);
    commentEl.innerHTML = `<li class="error">댓글을 불러오지 못했습니다.</li>`;
  }
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

    // 입력창 초기화
    commentInput.value = "";

    // 댓글 목록 새로고침
    await loadComments(postId);
  } catch (err) {
    console.error("댓글 작성 오류:", err);
    alert(err.message || "댓글 작성 중 오류가 발생했습니다.");
  }
}

// 댓글 이벤트 리스너 설정
function setupCommentEventListeners(postId) {
  const commentEl = document.getElementById("commentList");

  commentEl.addEventListener("click", async (e) => {
    const target = e.target;

    // 삭제 버튼 클릭
    if (target.classList.contains("delete-btn")) {
      const commentId = target.dataset.id;
      await handleDeleteComment(postId, commentId);
    }

    // 수정 버튼 클릭
    if (target.classList.contains("edit-btn")) {
      const commentId = target.dataset.id;
      handleEditComment(commentId);
    }
  });
}

// 댓글 삭제 처리
async function handleDeleteComment(postId, commentId) {
  if (!confirm("해당 댓글을 삭제하시겠습니까?")) {
    return;
  }

  try {
    const data = await apiFetch(`/api/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
    });

    if (!data) return;

    alert("댓글이 삭제되었습니다.");

    // 댓글 목록 새로고침
    await loadComments(postId);
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

    // 댓글 목록 새로고침
    await loadComments(postId);
  } catch (err) {
    console.error("댓글 수정 오류:", err);
    alert(err.message || "댓글 수정 중 오류가 발생했습니다.");
  }
}
