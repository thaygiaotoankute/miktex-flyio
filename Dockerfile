FROM node:18-slim

ENV DEBIAN_FRONTEND=noninteractive

# Cài đặt các gói cần thiết
RUN apt-get update && apt-get install -y \
    wget \
    perl \
    fontconfig \
    libfreetype6 \
    libssl3 \
    libcairo2 \
    libunistring2 \
    libpoppler-cpp-dev \
    gnupg \
    apt-transport-https \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# Thêm repository MiKTeX
RUN wget -q https://miktex.org/download/key && \
    apt-key add key && \
    rm key && \
    echo "deb [arch=amd64] https://miktex.org/download/debian bullseye main" > /etc/apt/sources.list.d/miktex.list && \
    apt-get update && \
    apt-get install -y miktex && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

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
