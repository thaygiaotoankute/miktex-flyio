FROM node:18-slim

ENV DEBIAN_FRONTEND=noninteractive

# Cài đặt TeXLive cơ bản nhất
RUN apt-get update && apt-get install -y \
    texlive \
    texlive-latex-extra \
    wget \
    curl \
    perl \
    fontconfig \
    libfreetype6 \
    libcairo2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# Tạo thư mục texmf toàn cục
RUN mkdir -p /usr/local/share/texmf/tex/latex/local

# Sao chép ex_test.sty vào texmf toàn cục
# Sao chép tất cả các gói từ thư mục tex vào texmf toàn cục
COPY tex/ /usr/local/share/texmf/tex/latex/local/

# Cập nhật cơ sở dữ liệu TeX
RUN texhash

# Sao chép mã nguồn Node.js
COPY package*.json ./
RUN npm install

# Sao chép mã nguồn
COPY . .

# Thư mục làm việc cho tệp TeX tạm thời
RUN mkdir -p /app/temp

# Cấp quyền thực thi cho script
RUN chmod +x /app/scripts/compile-tex.sh

# Expose cổng
EXPOSE 8080

# Khởi động ứng dụng
CMD ["node", "app.js"]
