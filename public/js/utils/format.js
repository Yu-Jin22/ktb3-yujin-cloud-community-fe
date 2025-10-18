// 숫자 단위 변환
export function formatCount(num) {
  if (num == null || isNaN(num)) return "0";

  if (num >= 1000000)
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";

  return num.toString();
}

// 날짜 형식 변환
export function formatDate(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export const Format = {
  formatCount,
  formatDate,
};
