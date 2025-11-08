const express = require("express");
const setCookieParser = require("set-cookie-parser");
const fetch = global.fetch;
const router = express.Router();

const BACKEND_URL = "http://localhost:8080";

/**
 * 공통 유틸 함수들
 */
const parseAccessToken = (cookieHeader) => {
  if (!cookieHeader) return null;
  const tokenPair = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("accessToken="));
  return tokenPair ? tokenPair.split("=")[1] : null;
};

// Node 환경의 fetch마다 headers 구조가 달라서 쿠키를 안전하게 꺼내기 위해 분기태움
const extractSetCookies = (headers) => {
  try {
    if (!headers) return [];

    // undici (Node 18+) 환경 - 현재는 여기탐
    if (typeof headers.getSetCookie === "function") {
      return headers.getSetCookie();
    }

    // node-fetch 환경
    if (typeof headers.raw === "function") {
      return headers.raw()["set-cookie"] || [];
    }

    // plain object (headers가 일반 객체일 때)
    if (headers["set-cookie"]) {
      return Array.isArray(headers["set-cookie"])
        ? headers["set-cookie"]
        : [headers["set-cookie"]];
    }

    // 마지막 fallback: Headers 객체일 수도 있음
    if (headers.get) {
      const sc = headers.get("set-cookie");
      if (sc) return setCookieParser.splitCookiesString(sc);
    }
  } catch (e) {
    console.error("extractSetCookies error:", e.message);
  }

  return [];
};

const forwardCookies = (res, headers) => {
  const cookies = extractSetCookies(headers);
  cookies.forEach((c) => res.append("Set-Cookie", c));
  return cookies;
};

/**
 * 공통 fetch 요청 함수
 */
const proxyFetch = async (url, options) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
    throw err;
  }
};

/**
 * 쿠키 삭제하는 함수
 */
function clearAuthCookies(res, message = "REFRESH_TOKEN_EXPIRED") {
  res.setHeader("Set-Cookie", [
    "accessToken=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
    "refreshToken=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict",
  ]);
  return res.status(401).json({ message });
}

router.use(async (req, res) => {
  try {
    const targetUrl = `${BACKEND_URL}${req.originalUrl.replace(/^\/api/, "")}`;
    const { method } = req;
    const headers = {};
    const contentType = req.headers["content-type"];

    if (contentType) headers["Content-Type"] = contentType.split(",")[0].trim();

    // 쿠키 및 Authorization 헤더 설정
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      headers.cookie = cookieHeader;
      const accessToken = parseAccessToken(cookieHeader);
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // body 처리
    const isMultipart = contentType?.startsWith("multipart/form-data");
    const isJson = contentType?.includes("application/json");
    const options = { method, headers };

    if (isMultipart) {
      options.body = req;
      options.duplex = "half";
    } else if (method !== "GET") {
      if (isJson) options.body = JSON.stringify(req.body);
      else if (req.body && Object.keys(req.body).length > 0)
        options.body = new URLSearchParams(req.body).toString();
    }

    // 기본 프록시 요청
    let response = await proxyFetch(targetUrl, options);

    // AccessToken 만료 시 Refresh 보내서 재발급
    if (response.status === 401) {
      console.log("⚠️ Access Token 만료 → Refresh 토큰으로 재발급 시도");

      const refreshRes = await proxyFetch(`${BACKEND_URL}/auth/refresh`, {
        method: "POST",
        headers: { cookie: cookieHeader },
      });

      if (!refreshRes.ok) {
        console.log("❌ Refresh Token 만료 또는 유효하지 않음 → 로그인 필요");
        // 쿠키 삭제
        return clearAuthCookies(res);
      }

      // 새로운 access, refresh토큰 쿠키로 갱신
      const newCookies = forwardCookies(res, refreshRes.headers);

      // 새 AccessToken 추출
      const newAccessToken = newCookies
        .map((c) => c.split(";")[0])
        .find((c) => c.startsWith("accessToken="))
        ?.split("=")[1];

      if (!newAccessToken) {
        console.warn("⚠️ 새 Access Token 파싱 실패" + newAccessToken);
        // 쿠키삭제
        return clearAuthCookies(res);
      }

      // 새 AccessToken으로 재요청
      headers["Authorization"] = `Bearer ${newAccessToken}`;
      response = await proxyFetch(targetUrl, options);
    }

    // 백엔드 Set-Cookie 전달
    forwardCookies(res, response.headers);

    // 응답 전송
    const contentTypeRes = response.headers.get("content-type");
    const data = contentTypeRes?.includes("application/json")
      ? await response.json()
      : await response.text();

    res.status(response.status).send(data);
  } catch (err) {
    console.error("api.js error:", err.message);
    res.status(500).json({ message: "백엔드 통신 실패", error: err.message });
  }
});

module.exports = router;
