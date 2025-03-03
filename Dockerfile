FROM node:18-slim

ENV DEBIAN_FRONTEND=noninteractive

# Cài đặt các gói cần thiết cho MiKTeX
RUN apt-get update && apt-get install -y \
    wget \
    perl \
    fontconfig \
    libfreetype6 \
    libssl3 \
    libcairo2 \
    libunistring2 \
    libpoppler-cpp-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# Tải và cài đặt MiKTeX
RUN wget https://miktex.org/download/ubuntu/jammy/amd64/miktex-latest-linux-x86_64.deb \
    && dpkg -i miktex-latest-linux-x86_64.deb || true \
    && apt-get update && apt-get -f install -y \
    && rm miktex-latest-linux-x86_64.deb

# Cấu hình MiKTeX
RUN miktexsetup finish
RUN initexmf --set-config-value [MPM]AutoInstall=1

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
