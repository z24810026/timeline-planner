import { useState, useEffect } from "react"; // ✅ 加入 useEffect
import { db } from "../firebase";
import { collection, doc, updateDoc ,addDoc, getDocs, serverTimestamp } from "firebase/firestore"; // ✅ 加入 getDocs
import { DndContext } from "@dnd-kit/core";
import DroppableCell from "../components/DroppableCell";
import getDayLabel from "../utils"; // ✅ 不需要寫 .ts
import { processList } from "../constants";
import type { DragEndEvent } from "@dnd-kit/core";
import { updateScheduleToFirebase } from "../firebase"; // ← 路徑改成你實際位置



const SchedulePage = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [schedule, setSchedule] = useState<{ [key: string]: any[] }>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [codeSuggestions, setCodeSuggestions] = useState<string[]>([]);

  


  // 🆕 作業資料輸入欄位
  const [newTask, setNewTask] = useState({
    code: "",
    process: "",
    stuff: "",
    date: "",
  });

  // ✅ 作業追加（本地畫面 + Firebase 寫入）
    const handleAddTask = async () => {
        const { code, process, stuff, date } = newTask;
    
        if (!code || !process || !date) {
        alert("作業名・工程名・日付は必須です");
        return;
        }
    
        // 先更新 local state（可選）
        const key = `${date}_${process}`;
        setSchedule((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), { code, stuff }],
        }));
    
        // ✅ 再寫入 Firebase
        try {
        await addDoc(collection(db, "schedules"), {
            code,
            process,
            stuff,
            date,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
        alert("登録完了！");
        } catch (e) {
        console.error("Firestore への書き込みエラー：", e);
        alert("登録に失敗しました");
        }
    
        // 清空表單
        setNewTask({ code: "", process: "", stuff: "", date: "" });
        setShowAddForm(false);
    };
  
    
    useEffect(() => {
      const fetchData = async () => {
        if (!db) {
          console.error("⚠️ Firebase DB 尚未初始化");
          return;
        }
    
        const querySnapshot = await getDocs(collection(db, "schedules"));
    
        const newSchedule: { [key: string]: any[] } = {};
        const codeSet = new Set<string>(); // 🔹 用 Set 避免重複
    
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          data.id = doc.id;
    
          // 🔹 塞入行程表資料
          const key = `${data.date}_${data.process}`;
          (newSchedule[key] ??= []).push(data);
    
          // 🔹 收集所有 code
          if (data.code) {
            codeSet.add(data.code);
          }
        });
    
        setSchedule(newSchedule);                  // ✅ 更新畫面資料
        setCodeSuggestions(Array.from(codeSet));   // ✅ 更新候選字串清單
      };
    
      fetchData();
    }, []);
    
      
      


  // 🔄 上一週・下一週切替
    const handlePrevWeek = () => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() - 7);
    setStartDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(startDate);
        newDate.setDate(startDate.getDate() + 7);
        setStartDate(newDate);
    };

    const dates = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return getDayLabel(d);
    });

    const handleUpdateTask = async () => {
        if (!editingTask?.id) return;
      
        try {
          const ref = doc(db, "schedules", editingTask.id);
          await updateDoc(ref, {
            code: editingTask.code,
            stuff: editingTask.stuff,
            date: editingTask.date,
            process: editingTask.process,
            updated_at: serverTimestamp(),
          });
      
            // ✅ 本地資料同步
            const newSchedule = { ...schedule };

            // 先清除原來的位置（← 如果有資料才處理）
            for (const key in newSchedule) {
                if (newSchedule[key]) {
                    newSchedule[key] = (newSchedule[key] || []).filter(
                        (item) => item.id !== editingTask.id
                      );
                }
            }
            
            // 再插入新的位置（← 如果沒有就初始化）
            const newKey = `${editingTask.date}_${editingTask.process}`;
            if (!newSchedule[newKey]) {
                newSchedule[newKey] = [];
            }
            (newSchedule[newKey] || []).push(editingTask);
  
      
          setSchedule(newSchedule);
          setEditingTask(null);
          alert("更新成功！");
        } catch (err) {
          console.error("更新失敗", err);
          alert("更新に失敗しました");
        }
    };

    const findItemLocation = (itemId: string): string | undefined => {
        for (const key in schedule) {
          if (schedule[key]?.some((item) => item.id === itemId)) {
            return key;
          }
        }
        return undefined;
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !active.data.current) return;
      
        const draggedItem = active.data.current as {
            id: string;
            code: string;
            stuff: string;
          };
        const fromKey = findItemLocation(draggedItem.id);
        const toKey = over.id as string;
        if (!fromKey || !toKey || fromKey === toKey) return;
      
        const [dateRaw, processRaw] = toKey.split("_");
        const date = dateRaw ?? "";
        const process = processRaw ?? "";
      
        // ✅ 建立一筆新的資料（包含新的日期與工程）
        const updatedItem: {
            id: string;
            code: string;
            stuff: string;
            date: string;
            process: string;
            updated_at: Date;
          } = {
            ...draggedItem,
            date,
            process,
            updated_at: new Date(),
          };
          
          console.log("🧪 即將寫入 Firebase 的資料：", updatedItem);
          updateScheduleToFirebase(updatedItem);
          
      
        // ✅ 更新畫面 state
        setSchedule((prev) => {
          const newFromItems = prev[fromKey]?.filter((item) => item.id !== draggedItem.id) || [];
          const newToItems = [...(prev[toKey] || []), updatedItem];
          return {
            ...prev,
            [fromKey]: newFromItems,
            [toKey]: newToItems,
          };
        });
      };
      
      
          

          
    

  return (
        <div className="App">
        <div className="table-header">
            <h2>📅 工程日程表（日本時間）</h2>
            <div>
            <button onClick={() => setShowAddForm(true)} className="add-button">
                ＋ 作業を追加
            </button>
            <button onClick={handlePrevWeek}>← 前の週</button>
            <button onClick={handleNextWeek}>次の週 →</button>
            </div>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
           <table className="schedule-table">
            <thead>
                <tr>
                <th>工程</th>
                {dates.map((date) => (
                    <th key={date}>{date}</th>
                ))}
                </tr>
            </thead>
            <tbody>
                {processList.map((slot) => (
                <tr key={slot}>
                    <td>{slot}</td>
                    {dates.map((date) => {
                    const key = `${date}_${slot}`;
                    return (
                        <DroppableCell
                            key={key}
                            id={key}
                            items={schedule[key] || []}
                            onDoubleClickItem={(item) => setEditingTask(item)} // 🆕 傳入編輯資料
                        />
                    );
                    })}
                </tr>
                ))}
            </tbody>
            </table>
        </DndContext>

            {showAddForm && (
                <div className="add-task-form">
                <h3>🆕 作業の追加</h3>
                <input
                    type="text"
                    placeholder="作業名（コード）"
                    value={newTask.code}
                    onChange={(e) => setNewTask({ ...newTask, code: e.target.value })}
                />
                <select
                    value={newTask.process}
                    onChange={(e) => setNewTask({ ...newTask, process: e.target.value })}
                >
                    <option value="">工程名を選択</option>
                    {processList.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="担当者"
                    value={newTask.stuff}
                    onChange={(e) => setNewTask({ ...newTask, stuff: e.target.value })}
                />
                <input
                    type="date"
                    value={newTask.date}
                    onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                />
                <button onClick={handleAddTask}>追加</button>
                <button onClick={() => setShowAddForm(false)}>キャンセル</button>
                </div>
            )}

            {editingTask && (
            <div className="edit-task-form">
                <h3>✏️ 作業の編集</h3>

                <label>作業名（code）：</label>
                <input
                type="text"
                list="code-suggestions" // 🔹 指定 datalist ID
                value={editingTask.code}
                onChange={(e) =>
                    setEditingTask({ ...editingTask, code: e.target.value })
                }
                />
                 <datalist id="code-suggestions">
                {codeSuggestions
                    .filter((c) =>
                    c.toLowerCase().startsWith(
                        (editingTask?.code || newTask.code).toLowerCase()
                    )
                    )
                    .map((c, index) => (
                    <option key={index} value={c} />
                    ))}
                </datalist>

                <label>工程（process）：</label>
                <select
                value={editingTask.process}
                onChange={(e) =>
                    setEditingTask({ ...editingTask, process: e.target.value })
                }
                >
                {processList.map((p) => (
                    <option key={p} value={p}>
                    {p}
                    </option>
                ))}
                </select>

                <label>日付（date）：</label>
                <input
                type="date"
                value={editingTask.date}
                onChange={(e) =>
                    setEditingTask({ ...editingTask, date: e.target.value })
                }
                />
                <label>担当者（stuff）：</label>
                <input
                type="text"
                value={editingTask.stuff}
                onChange={(e) =>
                    setEditingTask({ ...editingTask, stuff: e.target.value })
                }
                />

                <button onClick={handleUpdateTask}>更新</button>
                <button onClick={() => setEditingTask(null)}>キャンセル</button>
            </div>
            )}

        </div>
    );
};

export default SchedulePage;
