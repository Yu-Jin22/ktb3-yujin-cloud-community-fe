const BACKEND_URL = window.__API_BASE_URL__;
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
        localStorage.removeItem("profileUrl");
        window.location.href = "/login";
        return null;
      }

      // refresh 성공 → 새 accessToken 쿠키 적용됨 → 원래 요청 재시도
      res = await fetch(BACKEND_URL + url, fetchOptions);
    }

    // 정상 응답
    if (res.ok) {
      return await res.json();
      // const json = await res.json();
      // return { ok: true, data: json };
    }

    // 비즈니스 오류 (400~499)
    if (res.status >= 400 && res.status < 500) {
      let message = "요청을 처리할 수 없습니다.";

      try {
        const errorBody = await res.json();
        message = errorBody.message || message;
      } catch (e) {
        // JSON parse 실패 시 기본 메시지 유지
      }

      return { ok: false, message };
    }

    // 서버 오류 (500~599)
    return {
      ok: false,
      message: "서버 오류가 발생했습니다.",
    };
  } catch (err) {
    console.error("apiFetch network error:", err);
    return {
      ok: false,
      message: "네트워크 오류가 발생했습니다.",
    };
  }
}
