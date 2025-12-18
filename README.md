# iChat Gemini Portal - iStoreOS 部署指南

这是一个专为 iStoreOS 优化的轻量级 AI 聊天门户，支持 Google Gemini 原生 SDK 及第三方 OpenAI 格式接口，具备多 API Key 轮询功能，并完美适配 Cloudflare Tunnel 内网穿透。

## 🚀 功能特性
- **iStoreOS 风格**: 深色模式 UI，极致响应速度。
- **混合接口支持**: 既能直连 Gemini，也能使用第三方中转接口（OpenAI 格式）。
- **多 Key 轮询**: 自动循环使用多个 API Key，突破频率限制。
- **穿透优化**: 针对 Cloudflare Tunnel 优化的加载与连接逻辑。

---

## 🛠️ 部署步骤

### 第一步：获取代码
1. 在本项目页面，点击 **Download** 或 **Export** 下载所有代码。
2. 解压得到 `index.html`, `index.tsx`, `App.tsx` 等文件。
3. *注：本应用为 ESM 模块化设计，无需本地构建，可直接部署静态文件。*

### 第二步：上传文件到 iStoreOS
1. 登录 iStoreOS 管理界面。
2. 打开 **文件管理** (或使用 WinSCP/终端)。
3. 在 `/www` 目录下创建一个新文件夹，命名为 `ichat`。
   - 路径示例：`/www/ichat`
4. 将所有项目文件（特别是 `index.html` 和对应的 `.tsx`, `.ts` 文件）上传到该文件夹中。

### 第三步：配置 iStoreOS 访问端口 (Nginx)
为了不占用 iStoreOS 默认的 80 端口，建议单独配置一个端口：
1. 打开 iStoreOS **终端**。
2. 创建 Nginx 配置文件：`vi /etc/nginx/conf.d/ichat.conf`
3. 输入以下内容：
   ```nginx
   server {
       listen 8080;  # 你可以自定义端口
       server_name localhost;
       root /www/ichat;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
4. 保存并退出 (`:wq`)。
5. 检查并重启 Nginx：
   ```bash
   nginx -t
   /etc/init.d/nginx restart
   ```
6. 现在你可以通过 `http://192.168.100.1:8080` 在内网访问了。

---

## 🌐 内网穿透 (Cloudflare Tunnel)

若想在公网（如手机 5G）安全访问：
1. **安装 cloudflared**:
   - 在 iStoreOS 的 **iStore 软件中心** 搜索安装 `cloudflared`。
   - 或者使用 Docker 部署：
     ```bash
     docker run -d --name cf-tunnel --restart always \
       cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <你的令牌>
     ```
2. **配置隧道**:
   - 登录 [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) 控制台。
   - 进入 `Networks` -> `Tunnels` -> `Public Hostname`。
   - 点击 **Add a public hostname**:
     - **Subdomain**: `chat` (或其他你喜欢的名字)
     - **Domain**: `你的域名.com`
     - **Service Type**: `HTTP`
     - **URL**: `127.0.0.1:8080` (指向刚才 Nginx 的端口)
3. **完成**: 现在你可以通过 `https://chat.你的域名.com` 访问。

---

## ⚙️ 软件配置说明

进入网页后，点击右上角的 **设置** 图标：

1. **API Base URL**: 
   - 如果你想使用 Google 原生接口，请保持 **留空**。
   - 如果使用第三方中转（如 OneAPI），填入：`https://你的域名/v1`。
2. **模型名称**:
   - 原生建议填：`gemini-2.0-flash`。
   - 第三方按需填写，如 `gpt-4o`。
3. **API 密钥**:
   - 点击 **添加** 按钮可输入多个 Key。
   - 系统会自动进行轮询（Round Robin）请求。

---

## ⚠️ 注意事项
- 请确保 iStoreOS 的系统时间准确，否则会导致 API 请求签名失败。
- 如果使用原生 Gemini 接口，iStoreOS 需要具备科学上网环境；如果使用国内中转接口，则无需特殊环境。
- 建议在 iStoreOS 防火墙中开放你设置的自定义端口（如 8080）。
