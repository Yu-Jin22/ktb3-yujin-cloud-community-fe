import { Format } from "./utils/format.js";

export async function loadComments(postId) {
  const commentEl = document.getElementById("commentList");

  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("댓글을 불러오는데 실패했습니다.");
    const data = await res.json();

    commentEl.innerHTML = "";

    if (!data.content || data.content.length === 0) {
      commentEl.innerHTML = `<li class="empty">댓글이 존재하지 않습니다.</li>`;
      return;
    }

    data.content.forEach((comment) => {
      const li = document.createElement("li");
      console.log(comment);
      li.className = "comment-item";
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
        <p>${comment.comment}</p>
        `;
      commentEl.appendChild(li);
    });
  } catch (err) {
    console.error("댓글 불러오기 오류:", err);
    commentEl.innerHTML = `<li class="error">댓글을 불러오지 못했습니다.</li>`;
  }
}
