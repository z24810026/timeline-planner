// ✅ 必要な Firebase SDK のインポート
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// ✅ Firebase 設定情報（あなたのプロジェクト専用の情報）
const firebaseConfig = {
  apiKey: "AIzaSyBs7FCx0GdKBWjmrWo5e-7qHx3GXPJXlRc",
  authDomain: "aswell-demo-kusuri.firebaseapp.com",
  projectId: "aswell-demo-kusuri",
  storageBucket: "aswell-demo-kusuri.appspot.com",
  messagingSenderId: "160028783489",
  appId: "1:160028783489:web:d3416cb4dab00a6cbbae80",
  measurementId: "G-DVJVYGCX5R"
};

// ✅ Firebase 初期化
const app = initializeApp(firebaseConfig);

// ✅ Firestore のインスタンス取得
export const db = getFirestore(app);

// ✅ 作業データを Firebase に更新する関数（移動・編集時に使用）
export const updateScheduleToFirebase = async ({
  id,
  code,
  stuff,
  date,
  process,
  updated_at,
}: {
  id: string;
  code: string;
  stuff: string;
  date: string;
  process: string;
  updated_at: Date;
}) => {
  try {
    console.log("📤 Firebase 更新資料送出：", {
      id,
      code,
      stuff,
      date,
      process,
      updated_at,
    });

    await setDoc(doc(db, "schedules", id), {
      id,
      code,
      stuff,
      date,
      process,
      updated_at,
    });

    console.log("✅ Firebase 更新成功");
  } catch (err) {
    console.error("❌ Firebase 寫入失敗", err);
  }
};
