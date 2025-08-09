// 合併 setserver.js + userInfoServer.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// --------- 一般存檔 (savedata) ---------
app.post('/save-data', (req, res) => {
  // 判斷是否有 googleUserName 來決定存哪個資料夾
  const body = req.body;
  const { dateKey, googleUserName } = body;
  if (dateKey && googleUserName) {
    // 使用者個人事件存到 savedata1
    const SAVE_FOLDER = path.join(__dirname, 'savedata1');
    if (!fs.existsSync(SAVE_FOLDER)) fs.mkdirSync(SAVE_FOLDER, { recursive: true });
    const safeName = googleUserName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
    const filePath = path.join(SAVE_FOLDER, `${safeName}.json`);
    let data = {};
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    data[dateKey] = body;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true, file: filePath });
  } else {
    // 一般存檔存到 savedata，根據 googleAccount 覆蓋或新建
    const dirPath = path.join(__dirname, 'savedata');
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
    const googleAccount = body.googleAccount;
    console.log('收到存檔請求，googleAccount:', googleAccount);
    let fileName, filePath;
    if (googleAccount) {
      // 用 email 當檔名，特殊字元轉為 _
      const safeEmail = googleAccount.replace(/[^a-zA-Z0-9]/g, '_');
      fileName = `savedata_${safeEmail}.json`;
      filePath = path.join(dirPath, fileName);
    } else {
      fileName = `savedata_${Date.now()}.json`;
      filePath = path.join(dirPath, fileName);
    }
    fs.writeFile(filePath, JSON.stringify(body, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: '寫入檔案失敗' });
      }
      res.json({ message: '檔案已儲存', file: fileName });
    });
  }
});

// --------- 讀取該使用者全部事件 (savedata1) ---------
app.get('/load-all', (req, res) => {
  const googleUserName = req.query.googleUserName;
  if (!googleUserName) {
    res.status(400).json({ error: '缺少 googleUserName' });
    return;
  }
  const SAVE_FOLDER = path.join(__dirname, 'savedata1');
  const safeName = googleUserName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
  const filePath = path.join(SAVE_FOLDER, `${safeName}.json`);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(data));
  } else {
    res.json({});
  }
});

// --------- 刪除該使用者某一天的事件 (savedata1) ---------
app.post('/delete-data', (req, res) => {
  const { dateKey, googleUserName } = req.body;
  if (!dateKey || !googleUserName) {
    res.status(400).json({ error: '缺少 dateKey 或 googleUserName' });
    return;
  }
  const SAVE_FOLDER = path.join(__dirname, 'savedata1');
  const safeName = googleUserName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
  const filePath = path.join(SAVE_FOLDER, `${safeName}.json`);
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
  console.log(`✅ 後端啟動成功：http://localhost:${PORT}`);
});
