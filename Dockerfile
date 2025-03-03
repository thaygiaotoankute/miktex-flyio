FROM node:18-slim

ENV DEBIAN_FRONTEND=noninteractive

# Cài đặt các gói TeXLive cần thiết
RUN apt-get update && apt-get install -y \
    texlive-base \
    texlive-latex-recommended \
    texlive-latex-extra \     # Bao gồm amsmath, amssymb, latexsym, amsthm
    texlive-fonts-recommended \
    texlive-pictures \        # Bao gồm tikz và pgf
    texlive-science \         # Các gói toán học
    texlive-lang-vietnamese \ # Hỗ trợ tiếng Việt (vietnam)
    texlive-lang-french \     # Có thể cần cho tkz-tab và tkz-euclide
    texlive-pstricks \        # Một số gói tk* có thể phụ thuộc vào pstricks
    texlive-plain-generic \   # Thêm vào để hỗ trợ một số gói TikZ
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
COPY tex/ex_test.sty /usr/local/share/texmf/tex/latex/local/

# Tải các gói tkz-* trực tiếp nếu không có sẵn trong texlive
RUN mkdir -p /tmp/texpackages && \
    cd /tmp/texpackages && \
    # tkz-tab
    if ! kpsewhich tkz-tab.sty > /dev/null; then \
        curl -L -o tkz-tab.zip http://mirrors.ctan.org/install/macros/latex/contrib/tkz-tab.tds.zip && \
        unzip -q tkz-tab.zip -d /usr/local/share/texmf/ || true; \
    fi && \
    # tkz-euclide
    if ! kpsewhich tkz-euclide.sty > /dev/null; then \
        curl -L -o tkz-euclide.zip http://mirrors.ctan.org/install/macros/latex/contrib/tkz-euclide.tds.zip && \
        unzip -q tkz-euclide.zip -d /usr/local/share/texmf/ || true; \
    fi && \
    # tkz-base
    if ! kpsewhich tkz-base.sty > /dev/null; then \
        curl -L -o tkz-base.zip http://mirrors.ctan.org/install/macros/latex/contrib/tkz-base.tds.zip && \
        unzip -q tkz-base.zip -d /usr/local/share/texmf/ || true; \
    fi && \
    # Đảm bảo TikZ được cài đặt đúng
    if ! kpsewhich tikz.sty > /dev/null; then \
        curl -L -o pgf.zip http://mirrors.ctan.org/graphics/pgf/base/pgf.zip && \
        mkdir -p pgf && \
        unzip -q pgf.zip -d pgf && \
        mkdir -p /usr/local/share/texmf/tex/latex/pgf && \
        cp -r pgf/pgf/tex/latex/pgf/* /usr/local/share/texmf/tex/latex/pgf/ && \
        mkdir -p /usr/local/share/texmf/tex/generic/pgf && \
        cp -r pgf/pgf/tex/generic/pgf/* /usr/local/share/texmf/tex/generic/pgf/ || true; \
    fi && \
    # Dọn dẹp
    cd / && \
    rm -rf /tmp/texpackages

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
