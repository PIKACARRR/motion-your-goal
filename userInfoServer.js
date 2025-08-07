const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const SAVE_FOLDER = "C:/Users/Asus/Desktop/畢業專題/網頁介面/front/savedata1";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

if (!fs.existsSync(SAVE_FOLDER)) {
  fs.mkdirSync(SAVE_FOLDER, { recursive: true });
}

// 取得特定使用者的 json 檔案路徑（自動防呆）
function getUserFile(userName) {
  // 避免特殊符號或路徑問題，可根據需求轉換
  const safeName = userName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
  return path.join(SAVE_FOLDER, `${safeName}.json`);
}

// 讀取該使用者全部事件
app.get('/load-all', (req, res) => {
  const googleUserName = req.query.googleUserName;
  if (!googleUserName) {
    res.status(400).json({ error: '缺少 googleUserName' });
    return;
  }
  const filePath = getUserFile(googleUserName);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(data));
  } else {
    res.json({});
  }
});

// 儲存/覆蓋某一天的事件
app.post('/save-data', (req, res) => {
  const body = req.body;
  const { dateKey, googleUserName } = body;
  if (!dateKey || !googleUserName) {
    res.status(400).json({ error: '缺少 dateKey 或 googleUserName' });
    return;
  }
  const filePath = getUserFile(googleUserName);
  let data = {};
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  data[dateKey] = body;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  res.json({ success: true, file: filePath });
});

// 刪除該使用者某一天的事件
app.post('/delete-data', (req, res) => {
  const { dateKey, googleUserName } = req.body;
  if (!dateKey || !googleUserName) {
    res.status(400).json({ error: '缺少 dateKey 或 googleUserName' });
    return;
  }
  const filePath = getUserFile(googleUserName);
  if (!fs.existsSync(filePath)) {
    res.json({ success: true, file: filePath });
    return;
  }
  let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (data[dateKey]) {
    delete data[dateKey];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true, file: filePath });
  } else {
    res.status(404).json({ error: '事件不存在' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/`);
});
