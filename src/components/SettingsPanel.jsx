import React, { useState } from "react";
import "../style/SettingsPanel.css";
import { toast } from 'react-toastify';

export default function SettingsPanel({ onClose = () => {} }) {
  console.log("SettingsPanel rendered");
  const [form, setForm] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    experience: "",
    intensity: "",
    workIntensity: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isBasicInfoFilled = form.age && form.gender && form.height && form.weight;

  const handleSave = () => {
    if (!isBasicInfoFilled) {
      toast.error('資料尚未完成填寫');
      return;
    }
    toast.success('儲存設定成功！');
    setTimeout(() => {
      onClose();
    }, 1500); // 1.5秒後再關閉，讓 toast 有時間顯示
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
            <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="請輸入年齡" />
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
            <input type="number" name="height" value={form.height} onChange={handleChange} placeholder="請輸入身高" />
          </div>
          
          <div className="settings-panel-modal-form-group">
            <label>體重 (kg){!form.weight && <span className="required-mark">*</span>}</label>
            <input type="number" name="weight" value={form.weight} onChange={handleChange} placeholder="請輸入體重" />
          </div>

          <div className="form-section-title">運動相關</div>
          
          <div className="settings-panel-modal-form-group">
            <label>運動經驗</label>
            <select name="experience" value={form.experience} onChange={handleChange}>
              <option value="">請選擇</option>
              <option value="none">無</option>
              <option value="beginner">初學者</option>
              <option value="intermediate">中等</option>
              <option value="advanced">進階</option>
            </select>
          </div>
          
          <div className="settings-panel-modal-form-group">
            <label>可承受運動強度</label>
            <select name="intensity" value={form.intensity} onChange={handleChange}>
              <option value="">請選擇</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          <div className="settings-panel-modal-form-group full-width">
            <label>工作強度</label>
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