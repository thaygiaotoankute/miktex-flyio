const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs-extra');
const path = require('path');
const apiRoutes = require('./routes/api');

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Thư mục tạm cho files
const tempDir = path.join(__dirname, 'temp');
fs.ensureDirSync(tempDir);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Thiết lập để phục vụ file tĩnh từ thư mục temp
app.use('/temp', express.static(tempDir));

// Routes API
app.use('/api', apiRoutes);

// Route mặc định
app.get('/', (req, res) => {
  res.json({
    message: 'MiKTeX API đang hoạt động',
    endpoints: {
      compile: '/api/compile',
      status: '/api/status'
    }
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

// Dọn dẹp tệp tạm định kỳ
setInterval(() => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return;
    
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        // Xóa các tệp cũ hơn 1 giờ
        if (now - stats.mtimeMs > 3600000) {
          fs.remove(filePath, err => {
            if (!err) console.log(`Đã xóa tệp tạm ${file}`);
          });
        }
      });
    });
  });
}, 1800000); // Chạy mỗi 30 phút
