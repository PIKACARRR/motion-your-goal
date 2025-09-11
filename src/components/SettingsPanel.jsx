import React, { useState, useEffect } from "react";
import "../style/SettingsPanel.css";
import { toast } from "react-toastify";

export default function SettingsPanel({ onClose = () => {}, onSaved = () => {}, globalAccessToken, googleEmail = "" }) {
  // 取得登入用的 accessToken
  const accessToken = globalAccessToken;

  // 表單狀態，初始化時從 localStorage 讀取
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem("settingsPanelForm");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // googleAccount 以 props 為主
        return { ...parsed, googleAccount: googleEmail };
      } catch {
        // 解析失敗則用預設值
        return {
          age: "",
          gender: "",
          height: "",
          weight: "",
          experience: "",
          intensity: "",
          workIntensity: "",
          googleAccount: googleEmail,
        };
      }
    }
    return {
      age: "",
      gender: "",
      height: "",
      weight: "",
      experience: "",
      intensity: "",
      workIntensity: "",
      googleAccount: googleEmail,
    };
  });

  // 處理表單輸入變更，並即時存到 localStorage
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      localStorage.setItem("settingsPanelForm", JSON.stringify(updated));
      return updated;
    });
  };
  
  // 每次 googleEmail 變動時，更新 googleAccount 並存到 localStorage
  useEffect(() => {
    setForm((prev) => {
      const updated = { ...prev, googleAccount: googleEmail };
      localStorage.setItem("settingsPanelForm", JSON.stringify(updated));
      return updated;
    });
  }, [googleEmail]);

  // 必填欄位判斷（所有欄位都必填）
  const isAllInfoFilled =
    form.age && form.gender && form.height && form.weight &&
    form.experience && form.intensity && form.workIntensity;

  /** 🔹 計算 BMI */
  const calcBMI = (weight, height) => {
    const h = height / 100; // cm → m
    return weight / (h * h);
  };

  /** 🔹 年齡分數 */
  const getAgeScore = (age) => {
    if (age >= 12 && age <= 18) return 8;
    if (age >= 19 && age <= 30) return 10;
    if (age >= 31 && age <= 45) return 7;
    if (age >= 46 && age <= 64) return 5;
    return 4;
  };

  /** 🔹 BMI 分數 */
  const getBMIScore = (bmi) => {
    if (bmi < 18.5) return 6;
    if (bmi < 24) return 8;
    if (bmi < 27) return 8;
    if (bmi < 30) return 6;
    if (bmi < 35) return 5;
    return 4;
  };

  /** 🔹 各種係數 */
  const genderFactor = { male: 1.15, female: 1, other: 1 };
  const workFactor = { sedentary: 1, light: 1.2, moderate: 1.4, heavy: 1.6 };
  const experienceFactor = {
    none: 1,
    beginner: 1.2,
    intermediate: 1.4,
    advanced: 1.6,
  };
  const intensityFactor = { low: 1.0, medium: 1.1, high: 1.3 };

  /** 🔹 計算運動分數 */
  const calcScore = () => {
    const weight = parseFloat(form.weight);
    const height = parseFloat(form.height);
    const age = parseInt(form.age);

    const bmi = calcBMI(weight, height);
    const bmiScore = getBMIScore(bmi);
    const ageScore = getAgeScore(age);

    // 運動分數公式
    const score =
      experienceFactor[form.experience || "none"] *
      (workFactor[form.workIntensity || "sedentary"] *
        (genderFactor[form.gender || "other"] *
          (ageScore + bmiScore)) *
        intensityFactor[form.intensity || "low"]);

    return { bmi, bmiScore, ageScore, score };
  };

  /** 🔹 按下儲存時動作 */
  const handleSave = async () => {
    // 🔍 加入偵錯資訊
    console.log('=== 儲存前偵錯資訊 ===');
    console.log('1. globalAccessToken:', globalAccessToken ? '存在' : '不存在');
    console.log('2. googleEmail (從 props):', googleEmail);
    console.log('3. form.googleAccount:', form.googleAccount);
    console.log('4. localStorage email:', localStorage.getItem("google_user_email"));
    console.log('5. localStorage name:', localStorage.getItem("google_user_name"));
    console.log('========================');

    // 1. 檢查是否已登入
    if (!accessToken) {
      toast.warn("請先登入 Google 才能儲存設定！");
      return;
    }

    // 2. 檢查必填資料（所有欄位）
    if (!isAllInfoFilled) {
      toast.error("資料尚未完成填寫");
      return;
    }

    // 3~5. 驗證年齡、身高、體重
    const ageNum = parseInt(form.age), heightNum = parseInt(form.height), weightNum = parseFloat(form.weight);
    const rules = [
      { valid: !isNaN(ageNum), message: "請輸入有效的年齡" },
      { valid: ageNum >= 12, message: "你還太嫩了，等升級後再來吧!" },
      { valid: ageNum <= 100, message: "你已經長命百歲了，再來就好好休息吧!" },
      { valid: !isNaN(heightNum), message: "請輸入有效的身高" },
      { valid: heightNum >= 110, message: "在高一點好嗎,至少要有110公分" },
      { valid: heightNum <= 220, message: "親愛的姚明請不要亂填身高,請輸入低於220公分" },
      { valid: !isNaN(weightNum), message: "請輸入有效的體重" },
      { valid: weightNum >= 30, message: "你吃太少了,快去買杯全糖珍奶吧!" },
      { valid: weightNum <= 200, message: "這裡不歡迎坦克車" }
    ];
    for (const rule of rules) {
      if (!rule.valid) {
        toast.error(rule.message);
        return;
      }
    }

    // 6. 計算分數
    const { bmi, bmiScore, ageScore, score } = calcScore();

    // 🔥 多重策略獲取用戶識別
    let finalIdentifier = googleEmail || 
                         localStorage.getItem("google_user_email") || 
                         form.googleAccount;
    
    // 如果還是沒有，嘗試生成一個
    if (!finalIdentifier) {
      const userName = localStorage.getItem("google_user_name");
      if (userName) {
        const safeName = userName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
        finalIdentifier = `${safeName}_${Date.now()}`;
        console.log('🔄 生成新的識別碼:', finalIdentifier);
        // 存回 localStorage 供下次使用
        localStorage.setItem("google_user_email", finalIdentifier);
        setForm(prev => ({ ...prev, googleAccount: finalIdentifier }));
      }
    }
    
    console.log('=== Email/識別碼來源檢查 ===');
    console.log('最終使用的識別碼:', finalIdentifier);
    console.log('========================');

    if (!finalIdentifier) {
      toast.error("無法取得帳號識別資訊，請重新登入");
      return;
    }

    // 7. 準備要存的 JSON 資料
    const saveData = {
      ...form,
      googleAccount: finalIdentifier,
      bmi: bmi.toFixed(2), // 保留兩位小數
      bmiScore,
      ageScore,
      finalScore: score.toFixed(2),
      savedAt: new Date().toLocaleString(), // 存檔時間
    };
    
    console.log('=== 準備送出的資料 ===');
    console.log('完整資料:', saveData);
    console.log('googleAccount 欄位:', saveData.googleAccount);
    console.log('====================');

    try {
      // 8. 呼叫後端 API，把資料寫入 savedata 資料夾
      const res = await fetch("http://localhost:5000/save-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      });

      if (!res.ok) throw new Error("儲存失敗");

  const result = await res.json();
      console.log('=== 後端回應 ===');
      console.log('儲存結果:', result);
      console.log('===============');
      
      toast.success(`✅ 儲存成功！檔名：${result.file}`);
  // 通知外層（App）設定已儲存，讓其它元件（如 TaskSelector）及時刷新
  try { onSaved(saveData); } catch {}
    } catch (err) {
      console.error('儲存錯誤:', err);
      toast.error("❌ 儲存失敗，請確認後端是否啟動");
    }

    // 9. 延遲 1.5 秒後關閉面板
    setTimeout(onClose, 1500);
  };

  return (
    <div className="settings-panel-main-content">
      <div className="settings-panel-modal-content">
        <div className="settings-panel-top">
          <div className="settings-panel-title-bar">
            <div className="nav-tabs">
              <button className="tab-button active">👤 個人設定</button>
            </div>
          </div>
        </div>

        <div className="settings-content-area">
          <div className="form-section-title">基本資料</div>

          <div className="settings-panel-modal-form-group">
            <label>年齡{!form.age && <span className="required-mark">*</span>}</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              placeholder="請輸入年齡"
            />
          </div>

          <div className="settings-panel-modal-form-group">
            <label>性別{!form.gender && <span className="required-mark">*</span>}</label>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">請選擇</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div className="settings-panel-modal-form-group">
            <label>身高 (cm){!form.height && <span className="required-mark">*</span>}</label>
            <input
              type="number"
              name="height"
              value={form.height}
              onChange={handleChange}
              placeholder="請輸入身高"
            />
          </div>

          <div className="settings-panel-modal-form-group">
            <label>體重 (kg){!form.weight && <span className="required-mark">*</span>}</label>
            <input
              type="number"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              placeholder="請輸入體重"
            />
          </div>

          <div className="form-section-title">運動相關</div>

          <div className="settings-panel-modal-form-group">
            <label>
              運動經驗{!form.experience && <span className="required-mark">*</span>}
            </label>
            <select name="experience" value={form.experience} onChange={handleChange}>
              <option value="">請選擇</option>
              <option value="none">無</option>
              <option value="beginner">初學者</option>
              <option value="intermediate">中等</option>
              <option value="advanced">進階</option>
            </select>
          </div>

          <div className="settings-panel-modal-form-group">
            <label>
              可承受運動強度{!form.intensity && <span className="required-mark">*</span>}
            </label>
            <select name="intensity" value={form.intensity} onChange={handleChange}>
              <option value="">請選擇</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          <div className="settings-panel-modal-form-group full-width">
            <label>
              工作強度{!form.workIntensity && <span className="required-mark">*</span>}
            </label>
            <select name="workIntensity" value={form.workIntensity} onChange={handleChange}>
              <option value="">請選擇</option>
              <option value="sedentary">久坐</option>
              <option value="light">輕度</option>
              <option value="moderate">中度</option>
              <option value="heavy">重度</option>
            </select>
          </div>

          <div className="settings-panel-modal-actions">
            <button
              onClick={handleSave}
              className="settings-panel-btn settings-panel-btn-save"
            >
              💾 儲存設定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}