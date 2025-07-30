const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // 解析 JSON

// 📌 API：接收前端傳來的 JSON，並存檔到 savedata 資料夾
app.post("/save-data", (req, res) => {
  const data = req.body;
  const timestamp = Date.now();
  const fileName = `savedata_${timestamp}.json`;
  const dirPath = path.join(__dirname, "savedata");
  const filePath = path.join(dirPath, fileName);

  // 如果資料夾不存在就建立
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }

  // 寫入檔案
  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "寫入檔案失敗" });
    }
    res.json({ message: "檔案已儲存", file: fileName });
  });
});

// 啟動後端
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ 後端啟動成功：http://localhost:${PORT}`));
