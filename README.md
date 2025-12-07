# 🛍️ Closet Lounge

## 📌 프로젝트 소개

Closet Lounge는 패션에 관심 있는 사용자들이 모여 소통하는 폐쇄형 패션 커뮤니티 서비스입니다.
누구나 익명으로 글을 남길 수 있는 일반 커뮤니티와 달리, 이 서비스는 회원가입을 필수로 하며 모든 활동이 로그인 기반으로 이루어지는 비익명 환경을 제공합니다.
취향이 비슷한 사용자들끼리 깊이 있는 패션 정보, 스타일링 팁, 코디 리뷰 등을 공유하도록 설계했습니다.

프론트엔드는 백엔드 기능들을 사용자에게 자연스럽게 제공하기 위해 **Node.js 기반 MPA 구조(Express)** 로 구현되었으며,
로그인 상태 관리, 게시물/댓글 인터랙션, 이미지 업로드, 무한 스크롤 등
커뮤니티 서비스에서 필요한 기능들을 직관적인 UI 흐름과 함께 제공합니다.

또한 REST API 호출을 단순화하기 위해 **공통 API 모듈(apiFetch)** 을 구축하였고,
게시물 목록은 **커서 기반 무한 스크롤**,
게시물 상세 댓글은 **페이지네이션 기반 “더보기”**,
회원 정보는 **로컬스토리지를 활용한 상태 동기화 전략**으로 UX를 강화했습니다.

## 🚀 주요 기능 요약

### 인증 & 인가 (JWT 기반)

- 로그인/회원가입 요청 처리 및 입력값 검증
- HttpOnly 쿠키 기반 토큰 관리
- 인증이 필요한 페이지 접근 시 자동 리다이렉트 처리

### 회원 기능

- 회원가입 / 로그인 / 로그아웃
- 프로필 수정 UI 렌더링 및 이미지 실시간 미리보기
- 프로필 이미지 업로드 후 로컬 상태 동기화 (헤더 즉시 반영)

### 게시물 기능

- 게시물 목록을 커서 기반 무한 스크롤로 렌더링
- 게시물 상세 UI 구성 및 동적 댓글 영역 렌더링
- 좋아요/댓글 클릭 시 실시간 DOM 업데이트
- 이미지 업로드 후 presigned URL 활용하여 S3 업로드 처리

### 파일 업로드 기능

- 파일 선택 → presigned URL 요청 → S3 직접 업로드 과정 프론트에서 제어
- 업로드 성공 후 백엔드에 업로드 완료 정보 전달

## 서비스 화면

`홈`

`게시물 목록`

`게시물 작성 / 상세 / 수정 / 삭제`

`댓글 목록 / 등록 / 수정 /삭제`

`프로필 수정 / 비밀번호 수정 / 회원 탈퇴 / 로그아웃`

## 💻 기술 스택

| 분야      | 기술                                 |
| --------- | ------------------------------------ |
| Language  | JavaScript (Vanilla)                 |
| Runtime   | Node.js                              |
| Framework | Express.js (MPA)                     |
| Styling   | CSS                                  |
| Infra     | AWS EC2 / ALB / S3 / 외부 DNS        |
| Deploy    | GitHub Actions → EC2 배포 파이프라인 |

## 📂 폴더 구조

<details>
<summary>폴더 구조 보기/숨기기</summary>

```
ktb3-yujin-cloud-community-fe/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD 설정
├── assets/                     # 정적 이미지 파일
├── layout/
│   └── layout.html             # 기본 HTML 레이아웃 템플릿
├── public/                     # 정적 파일 (클라이언트 사이드)
│   ├── component/              # 재사용 가능한 HTML 컴포넌트
│   │   ├── header.html
│   │   ├── footer.html
│   │   ├── login.html
│   │   ├── signup.html
│   │   ├── post_list.html
│   │   ├── post_detail.html
│   │   ├── post_write.html
│   │   ├── comment.html
│   │   ├── member_edit.html
│   │   └── member_pw_edit.html
│   ├── css/                    # 스타일시트
│   │   ├── common.css          # 공통 스타일
│   │   ├── variables.css       # CSS 변수 정의
│   │   ├── header.css
│   │   ├── footer.css
│   │   ├── form.css
│   │   ├── post.css
│   │   └── member.css
│   └── js/                     # 클라이언트 JavaScript
│       ├── common/             # 공통 모듈
│       │   ├── apiFetch.js     # API 통신 래퍼 (인증, 에러 처리)
│       │   └── fileUploader.js # S3 파일 업로드 로직
│       ├── utils/              # 유틸리티 함수
│       │   ├── format.js       # 날짜/텍스트 포맷팅
│       │   ├── valid.js        # 입력값 검증
│       │   ├── message.js      # 메시지 표시
│       │   └── formHelper.js   # 폼 헬퍼
│       ├── login.js            # 로그인 페이지
│       ├── signup.js           # 회원가입 페이지
│       ├── header.js           # 헤더 인터랙션
│       ├── post_list.js        # 게시물 목록 (무한 스크롤)
│       ├── post_detail.js      # 게시물 상세
│       ├── post_write.js       # 게시물 작성/수정
│       ├── comment.js          # 댓글 기능 (페이지네이션)
│       ├── member_edit.js      # 회원정보 수정
│       └── password.js         # 비밀번호 변경
├── routes/                     # Express 라우팅
│   ├── index.js                # 라우터 통합
│   └── pages.js                # 페이지 렌더링 로직 (SSR)
├── app.js                      # Express 서버 진입점
├── package.json                # 프로젝트 의존성 및 스크립트
├── Dockerfile                  # Docker 이미지 빌드 설정
├── docker-compose.yml          # Docker Compose 설정
└── README.md
```

</details>

## 👩‍💻 트러블슈팅

## ▶️ 시연 영상

## Backend 보기

[Backend Github 링크](https://github.com/Yu-Jin22/ktb3-yujin-cloud-community-be)

## 프로젝트 후기

- 이번 프로젝트는 바닐라 자바스크립트로만 프론트엔드를 구현하면서
  DOM 렌더링, 이벤트 흐름, 비동기 fetch 처리의 구조를 훨씬 깊게 이해하게 된 경험이었습니다.
- 특히 로그인 상태 관리, 무한 스크롤, 댓글 더보기, 이미지 업로드 등
  단순 UI 이상의 기능을 구현하면서
  “프론트엔드에서 데이터를 어떻게 구성해 백엔드와 주고받아야 하는지”를
  자연스럽게 고민하게 되었습니다. 또한 백엔드와 실제로 연동해보니
  API 설계 방식에 따라 프론트 구현 난이도가 크게 달라지는 것을 체감했고,
  프론트-백엔드 사이의 데이터를 맞춰서 보내주는 것의 중요성을 배울 수 있었습니다.
- 아쉬운 점도 있지만,
  순수 JavaScript만으로 하나의 커뮤니티 서비스를 완성해 보면서
  웹 애플리케이션이 어떻게 동작하는지 전체 흐름을 이해할 수 있었던 의미 있는 경험이었습니다.
