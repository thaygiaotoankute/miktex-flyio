FROM node:18-slim

ENV DEBIAN_FRONTEND=noninteractive

# Cài đặt TeX Live (phiên bản nhỏ gọn)
RUN apt-get update && apt-get install -y \
    texlive-base \
    texlive-latex-recommended \
    texlive-fonts-recommended \
    texlive-latex-base \
    wget \
    perl \
    fontconfig \
    libfreetype6 \
    libcairo2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# Thư mục làm việc cho tệp TeX tạm thời
RUN mkdir -p /app/temp

# Cài đặt Express và các dependency
COPY package*.json ./
RUN npm install

# Sao chép mã nguồn
COPY . .

# Cấp quyền thực thi cho script
RUN chmod +x /app/scripts/compile-tex.sh

# Expose cổng
EXPOSE 8080

# Khởi động ứng dụng
CMD ["node", "app.js"]
