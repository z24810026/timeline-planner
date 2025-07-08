// ✅ /src/utils.ts
export default function getDayLabel(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // ✅ 統一成 Firebase 格式
  }
  