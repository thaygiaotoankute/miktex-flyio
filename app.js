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
app.use(express.json({ limit: '10mb' }));  // Tăng giới hạn kích thước request
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Thiết lập để phục vụ file tĩnh từ thư mục temp
app.use('/temp', express.static(tempDir, {
  setHeaders: (res, path) => {
    // Cấu hình cache cho PDF (1 giờ)
    if (path.endsWith('.pdf')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Phục vụ giao diện HTML
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
app.use('/api', apiRoutes);

// Route mặc định
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Xử lý lỗi
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
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
      if (file === '.gitkeep') return;  // Bỏ qua file .gitkeep
      
      const filePath = path.join(tempDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        // Xóa các thư mục/tệp cũ hơn 1 ngày
        if (now - stats.mtimeMs > 86400000) {
          fs.remove(filePath, err => {
            if (!err) console.log(`Đã xóa tệp tạm ${file}`);
          });
        }
      });
    });
  });
}, 3600000); // Chạy mỗi giờ
