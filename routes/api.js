const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const router = express.Router();

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../temp');
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất
    const uniqueId = uuidv4();
    cb(null, `${uniqueId}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép file .tex
    if (path.extname(file.originalname).toLowerCase() === '.tex') {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file .tex'));
  }
});

// Kiểm tra trạng thái API
router.get('/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

// API để biên dịch file TeX
router.post('/compile', upload.single('texFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file được tải lên' });
    }

    const texFile = req.file.path;
    const texDir = path.dirname(texFile);
    const texBasename = path.basename(texFile, '.tex');
    const outputFile = path.join(texDir, `${texBasename}.pdf`);

    // Lấy tham số tùy chọn
    const compiler = req.body.compiler || 'pdflatex';
    const options = req.body.options || '-interaction=nonstopmode';

    // Đường dẫn đến script biên dịch
    const scriptPath = path.join(__dirname, '../scripts/compile-tex.sh');

    // Thực thi script biên dịch
    try {
      const { stdout, stderr } = await execPromise(
        `${scriptPath} "${texFile}" "${compiler}" "${options}"`
      );
      
      console.log('Stdout:', stdout);
      console.log('Stderr:', stderr);

      // Kiểm tra xem file PDF được tạo ra hay không
      if (fs.existsSync(outputFile)) {
        // Tạo URL để tải PDF
        const host = req.get('host');
        const protocol = req.protocol;
        const pdfUrl = `${protocol}://${host}/temp/${path.basename(outputFile)}`;
        
        // Trả về thông tin
        res.json({
          success: true,
          message: 'Biên dịch thành công',
          pdfUrl: pdfUrl,
          logOutput: stdout + stderr
        });
      } else {
        // Tạo URL để tải file log
        const logFile = path.join(texDir, `${texBasename}.log`);
        const host = req.get('host');
        const protocol = req.protocol;
        const logUrl = fs.existsSync(logFile) ? 
          `${protocol}://${host}/temp/${path.basename(logFile)}` : null;
        
        res.status(500).json({
          success: false,
          message: 'Biên dịch thất bại - Không tạo được file PDF',
          logOutput: stdout + stderr,
          logUrl: logUrl
        });
      }
    } catch (error) {
      // Trả về lỗi chi tiết từ quá trình biên dịch
      const logFile = path.join(texDir, `${texBasename}.log`);
      const host = req.get('host');
      const protocol = req.protocol;
      const logUrl = fs.existsSync(logFile) ? 
        `${protocol}://${host}/temp/${path.basename(logFile)}` : null;
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi biên dịch file TeX',
        error: error.message,
        logOutput: error.stdout + error.stderr,
        logUrl: logUrl
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: error.message
    });
  }
});

// API để biên dịch trực tiếp từ chuỗi TeX
router.post('/compile-string', async (req, res) => {
  try {
    const { texString, compiler, options } = req.body;
    
    if (!texString) {
      return res.status(400).json({ error: 'Không có nội dung TeX được cung cấp' });
    }
    
    // Tạo file tạm thời
    const uniqueId = uuidv4();
    const tempDir = path.join(__dirname, '../temp');
    const texFile = path.join(tempDir, `${uniqueId}.tex`);
    
    // Ghi nội dung TeX vào file
    await fs.writeFile(texFile, texString);
    
    const texBasename = path.basename(texFile, '.tex');
    const outputFile = path.join(tempDir, `${texBasename}.pdf`);
    
    // Thiết lập tham số
    const compilerToUse = compiler || 'pdflatex';
    const optionsToUse = options || '-interaction=nonstopmode';
    
    // Đường dẫn đến script biên dịch
    const scriptPath = path.join(__dirname, '../scripts/compile-tex.sh');
    
    try {
      const { stdout, stderr } = await execPromise(
        `${scriptPath} "${texFile}" "${compilerToUse}" "${optionsToUse}"`
      );
      
      // Kiểm tra xem file PDF được tạo ra hay không
      if (fs.existsSync(outputFile)) {
        // Tạo URL để tải PDF
        const host = req.get('host');
        const protocol = req.protocol;
        const pdfUrl = `${protocol}://${host}/temp/${path.basename(outputFile)}`;
        
        res.json({
          success: true,
          message: 'Biên dịch thành công',
          pdfUrl: pdfUrl,
          logOutput: stdout + stderr
        });
      } else {
        // Tạo URL để tải file log
        const logFile = path.join(tempDir, `${texBasename}.log`);
        const host = req.get('host');
        const protocol = req.protocol;
        const logUrl = fs.existsSync(logFile) ? 
          `${protocol}://${host}/temp/${path.basename(logFile)}` : null;
        
        res.status(500).json({
          success: false,
          message: 'Biên dịch thất bại - Không tạo được file PDF',
          logOutput: stdout + stderr,
          logUrl: logUrl
        });
      }
    } catch (error) {
      const logFile = path.join(tempDir, `${texBasename}.log`);
      const host = req.get('host');
      const protocol = req.protocol;
      const logUrl = fs.existsSync(logFile) ? 
        `${protocol}://${host}/temp/${path.basename(logFile)}` : null;
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi biên dịch nội dung TeX',
        error: error.message,
        logOutput: error.stdout + error.stderr,
        logUrl: logUrl
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: error.message
    });
  }
});

module.exports = router;
