import { apiFetch } from "./apiFetch.js";

export const fileUploader = {
  // Presigned URL 생성 요청
  async getPresignedUrl({ type, file, postId = null }) {
    const body = {
      type, // "profile" | "post"
      postId,
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    };

    return await apiFetch("/api/files/presigned", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  // S3에 실제 업로드
  async uploadToS3(uploadUrl, file) {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!res.ok) {
      throw new Error("S3 업로드 실패");
    }
  },

  // 프로필 이미지 업로드 (Presigned → S3 → 서버 메타데이터 저장)
  async uploadProfileImage(file) {
    // 1) presigned URL 요청
    const presigned = await this.getPresignedUrl({
      type: "profile",
      file,
    });

    // 2) S3 업로드
    await this.uploadToS3(presigned.uploadUrl, file);

    // 3) 서버 DB 저장
    const response = await apiFetch("/api/users/profile-image", {
      method: "PATCH",
      body: JSON.stringify({
        filePath: presigned.key,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }),
    });

    return response;
  },

  // 게시물 이미지 업로드 (게시물 작성 시점에 사용)
  async uploadPostImages(files, postId) {
    const uploadedKeys = [];

    for (const file of files) {
      const presigned = await this.getPresignedUrl({
        type: "post",
        file,
        postId: postId,
      });

      // S3 업로드
      await this.uploadToS3(presigned.uploadUrl, file);

      uploadedKeys.push(presigned.key);
    }

    return uploadedKeys; // 게시물 저장 시 서버로 전달
  },
};
