// 이메일 유효성 검사
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+/;
  return regex.test(email);
}

// 비밀번호 유효성 검사
export function isValidPassword(password) {
  const regex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=])[A-Za-z\d!@#$%^&*()_+\-=]{8,20}$/;
  return regex.test(password);
}

// 비밀번호 일치 검사
export function isSamePassword(password1, password2) {
  return password1 === password2;
}

// 닉네임 유효성 검사
export function isValidNickname(nickname) {
  const regex = /^[A-Za-z0-9가-힣]{1,10}$/;
  return regex.test(nickname);
}

// 객체로 묶어서 export
export const Valid = {
  isValidEmail,
  isValidPassword,
  isValidNickname,
  isSamePassword,
};
