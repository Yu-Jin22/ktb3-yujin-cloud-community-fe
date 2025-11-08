export async function apiFetch(url, options = {}) {
  try {
    const fetchOptions = {
      credentials: "include",
      ...options,
      headers: options.headers || {},
    };

    // FormData일 경우 Content-Type 자동 설정 금지
    if (!(options.body instanceof FormData)) {
      fetchOptions.headers["Content-Type"] =
        fetchOptions.headers["Content-Type"] || "application/json";
    }

    const res = await fetch(url, fetchOptions);

    // 인증 만료 감지
    if (res.status === 401) {
      alert("로그인이 만료되었습니다. 다시 로그인 해주세요.");
      location.href = "/login";
      return null;
    }

    // 서버 에러 등 일반 오류 처리
    if (!res.ok) {
      const msg = `요청 실패 (${res.status})`;
      console.error(msg);
      throw new Error(msg);
    }

    // 정상 응답(JSON)
    return await res.json();
  } catch (err) {
    console.error("apiFetch error:", err);
    throw err;
  }
}
