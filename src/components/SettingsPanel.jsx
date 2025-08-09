import React, { useState } from "react";
import "../style/SettingsPanel.css";
import { toast } from "react-toastify";

export default function SettingsPanel({ onClose = () => {}, globalAccessToken, googleEmail = "" }) {
  // 取得登入用的 accessToken
  const accessToken = globalAccessToken;

  // 表單狀態
  const [form, setForm] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    experience: "",
    intensity: "",
    workIntensity: "",
    googleAccount: googleEmail, // 初始化時直接帶入 props
  });

  // 處理表單輸入變更
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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

    // 3. 計算分數
    const { bmi, bmiScore, ageScore, score } = calcScore();

    // 4. 準備要存的 JSON 資料
    // 儲存時優先用 props 傳入的 googleEmail
    const saveData = {
      ...form,
      googleAccount: googleEmail,
      bmi: bmi.toFixed(2), // 保留兩位小數
      bmiScore,
      ageScore,
      finalScore: score.toFixed(2),
      savedAt: new Date().toLocaleString(), // 存檔時間
    };
    console.log('送出存檔資料', saveData);

    try {
      // 5. 呼叫後端 API，把資料寫入 savedata 資料夾
      const res = await fetch("http://localhost:5000/save-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      });

      if (!res.ok) throw new Error("儲存失敗");

      const result = await res.json();
      toast.success(`✅ 儲存成功！檔名：${result.file}`);
    } catch (err) {
      console.error(err);
      toast.error("❌ 儲存失敗，請確認後端是否啟動");
    }

    // 6. 延遲 1.5 秒後關閉面板
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
