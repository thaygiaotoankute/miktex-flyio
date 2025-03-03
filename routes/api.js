const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const router = express.Router();

// Kiểm tra trạng thái API
router.get('/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

// API để biên dịch trực tiếp từ chuỗi TeX
router.post('/compile', async (req, res) => {
  try {
    const { texString, compiler, options } = req.body;
    
    if (!texString) {
      return res.status(400).json({ error: 'Không có nội dung TeX được cung cấp' });
    }
    
    // Tạo thư mục tạm thời riêng
    const uniqueId = uuidv4();
    const tempDir = path.join(__dirname, '../temp', uniqueId);
    await fs.ensureDir(tempDir);
    
    // Ghi nội dung TeX vào file
    const texFile = path.join(tempDir, 'main.tex');
    await fs.writeFile(texFile, texString);
    
    // Thiết lập tham số
    const compilerToUse = compiler || 'pdflatex';
    // Thêm tùy chọn -shell-escape để hỗ trợ một số gói như tikz
    const optionsToUse = options || '-interaction=nonstopmode -shell-escape';
    
    try {
      // Biên dịch với script
      const scriptPath = path.join(__dirname, '../scripts/compile-tex.sh');
      const { stdout, stderr } = await execPromise(
        `${scriptPath} "${texFile}" "${compilerToUse}" "${optionsToUse}"`
      );
      
      // Kiểm tra kết quả
      const outputFile = path.join(tempDir, 'main.pdf');
      if (await fs.pathExists(outputFile)) {
        // Tạo URL để tải PDF
        const host = req.get('host');
        const protocol = req.protocol;
        const pdfUrl = `${protocol}://${host}/temp/${uniqueId}/main.pdf`;
        
        // Đọc file log nếu có
        let logContent = '';
        const logFile = path.join(tempDir, 'main.log');
        
        if (await fs.pathExists(logFile)) {
          try {
            logContent = await fs.readFile(logFile, 'utf8');
          } catch (err) {
            console.error('Không thể đọc file log:', err);
          }
        }
        
        res.json({
          success: true,
          message: 'Biên dịch thành công',
          pdfUrl: pdfUrl,
          logOutput: stdout + stderr,
          logDetail: logContent
        });
      } else {
        // Tạo URL để tải file log
        const logFile = path.join(tempDir, 'main.log');
        const host = req.get('host');
        const protocol = req.protocol;
        const logUrl = await fs.pathExists(logFile) ? 
          `${protocol}://${host}/temp/${uniqueId}/main.log` : null;
        
        // Đọc nội dung log nếu có
        let logContent = '';
        
        if (await fs.pathExists(logFile)) {
          try {
            logContent = await fs.readFile(logFile, 'utf8');
          } catch (err) {
            console.error('Không thể đọc file log:', err);
          }
        }
        
        res.status(500).json({
          success: false,
          message: 'Biên dịch thất bại - Không tạo được file PDF',
          logOutput: stdout + stderr,
          logUrl: logUrl,
          logDetail: logContent
        });
      }
    } catch (error) {
      const logFile = path.join(tempDir, 'main.log');
      const host = req.get('host');
      const protocol = req.protocol;
      const logUrl = await fs.pathExists(logFile) ? 
        `${protocol}://${host}/temp/${uniqueId}/main.log` : null;
      
      // Đọc nội dung log nếu có
      let logContent = '';
      
      if (await fs.pathExists(logFile)) {
        try {
          logContent = await fs.readFile(logFile, 'utf8');
        } catch (err) {
          console.error('Không thể đọc file log:', err);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Lỗi khi biên dịch nội dung TeX',
        error: error.message,
        logOutput: error.stdout + error.stderr,
        logUrl: logUrl,
        logDetail: logContent
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
