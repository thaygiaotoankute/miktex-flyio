# MiKTeX API

API để biên dịch TeX/LaTeX thành PDF sử dụng MiKTeX trên Fly.io.

## Tính năng

- Biên dịch file TeX thành PDF thông qua API
- Hỗ trợ tải lên file TeX hoặc gửi chuỗi TeX trực tiếp
- Tùy chọn trình biên dịch (pdflatex, xelatex, lualatex)
- Tự động xóa file tạm sau một khoảng thời gian

## API Endpoints

### Kiểm tra trạng thái

```
GET /api/status
```

### Biên dịch từ file TeX

```
POST /api/compile
Content-Type: multipart/form-data

Form fields:
- texFile: File TeX cần biên dịch
- compiler: (tùy chọn) Trình biên dịch (pdflatex, xelatex, lualatex)
- options: (tùy chọn) Tham số dòng lệnh bổ sung
```

### Biên dịch từ chuỗi TeX

```
POST /api/compile-string
Content-Type: application/json

{
  "texString": "\\documentclass{article}\\begin{document}Hello World\\end{document}",
  "compiler": "pdflatex",
  "options": "-interaction=nonstopmode"
}
```

## Ví dụ sử dụng

### Biên dịch tệp TeX bằng JavaScript:

```javascript
const form = new FormData();
form.append('texFile', texFileBlob, 'document.tex');
form.append('compiler', 'pdflatex');

fetch('https://miktex-api.fly.dev/api/compile', {
  method: 'POST',
  body: form
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('PDF URL:', data.pdfUrl);
  } else {
    console.error('Compilation failed:', data.message);
  }
});
```

### Biên dịch chuỗi TeX:

```javascript
fetch('https://miktex-api.fly.dev/api/compile-string', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    texString: '\\documentclass{article}\\begin{document}Hello World\\end{document}',
    compiler: 'pdflatex'
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('PDF URL:', data.pdfUrl);
  } else {
    console.error('Compilation failed:', data.message);
  }
});
```

## Triển khai trên Fly.io

1. Cài đặt Fly CLI
2. Cấu hình API token trong GitHub Secrets (FLY_API_TOKEN)
3. Push code lên GitHub để kích hoạt workflow triển khai tự động

## Tùy chỉnh

- Thay đổi region trong `fly.toml` để chọn vùng địa lý gần bạn nhất
- Điều chỉnh cấu hình trong `app.js` để thay đổi cách xử lý tệp tạm
- Thêm các gói TeX/LaTeX vào Dockerfile nếu muốn cài đặt sẵn
