FROM ubuntu:22.04

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
    nodejs \
    npm \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Node.js phiên bản mới hơn
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Tạo thư mục làm việc
WORKDIR /app

# Tải và cài đặt MiKTeX
RUN wget https://miktex.org/download/ubuntu/jammy/amd64/miktex-latest-linux-x86_64.deb \
    && dpkg -i miktex-latest-linux-x86_64.deb || true \
    && apt-get -f install -y \
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
