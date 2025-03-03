#!/bin/bash

# Kiểm tra số lượng tham số
if [ "$#" -lt 1 ]; then
  echo "Sử dụng: $0 <file-tex> [compiler] [options]"
  exit 1
fi

# Lấy tham số
TEX_FILE="$1"
COMPILER="${2:-pdflatex}"
OPTIONS="${3:--interaction=nonstopmode}"

# Kiểm tra file tồn tại
if [ ! -f "$TEX_FILE" ]; then
  echo "Không tìm thấy file: $TEX_FILE"
  exit 1
fi

# Lấy thư mục chứa file
DIR_NAME=$(dirname "$TEX_FILE")
FILE_NAME=$(basename "$TEX_FILE")

# Di chuyển đến thư mục chứa file
cd "$DIR_NAME" || exit 1

# Chạy biên dịch lần 1
echo "Đang biên dịch $FILE_NAME với $COMPILER (lần 1)..."
$COMPILER $OPTIONS "$FILE_NAME"

# Chạy biên dịch lần 2 để xử lý tham chiếu
echo "Đang biên dịch $FILE_NAME với $COMPILER (lần 2)..."
$COMPILER $OPTIONS "$FILE_NAME"

# Chạy biên dịch lần 3 để đảm bảo tất cả tham chiếu được xử lý
echo "Đang biên dịch $FILE_NAME với $COMPILER (lần 3)..."
$COMPILER $OPTIONS "$FILE_NAME"

# Kiểm tra kết quả
PDF_FILE="${FILE_NAME%.tex}.pdf"
if [ -f "$PDF_FILE" ]; then
  echo "Biên dịch thành công: $PDF_FILE"
  exit 0
else
  echo "Biên dịch thất bại. Kiểm tra file log để biết thêm chi tiết."
  exit 1
fi
