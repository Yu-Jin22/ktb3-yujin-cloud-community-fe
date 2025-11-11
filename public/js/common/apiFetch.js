const BACKEND_URL = "http://localhost:8080";
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

    const res = await fetch(BACKEND_URL + url, fetchOptions);

    // 인증 만료 감지

    if (res.status === 401) {
      console.warn("Access Token 만료 → refresh 시도");

      // refreshToken은 HttpOnly 쿠키로 자동 전송됨
      const refreshRes = await fetch(BACKEND_URL + "/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      // refresh 실패 → 로그인 만료
      if (!refreshRes.ok) {
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
        window.location.href = "/login";
        return null;
      }

      // refresh 성공 → 새 accessToken 쿠키 적용됨 → 원래 요청 재시도
      res = await fetch(BACKEND_URL + url, fetchOptions);
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
