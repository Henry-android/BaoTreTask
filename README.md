# BaoTreTask

Ứng dụng quản lý công việc gồm 2 phần:

- Backend: Node.js/Express + MongoDB
- Frontend: React + Vite

## Yêu cầu

- Node.js (khuyến nghị LTS)
- npm (đi kèm Node)
- MongoDB (local hoặc remote)

## Cài đặt & chạy (Windows / PowerShell)

### 1) Backend

```powershell
cd backend
npm install
copy .env.example .env
```

Mở file `backend/.env` và chỉnh các biến nếu cần:

- `PORT`: cổng backend (mặc định `4000`)
- `JWT_SECRET`: secret để ký JWT (nên đổi khi deploy)
- `MONGODB_URI`: connection string MongoDB
- `GEMINI_API_KEY`: (tuỳ chọn) chỉ cần nếu dùng các API phân tích/scan liên quan AI
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: (khuyến nghị cho demo) tài khoản admin seed

Chạy backend:

```powershell
npm run dev
```

### 2) Frontend

Mở terminal khác:

```powershell
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy trên cổng Vite (thường là `5173`).

## Quy ước cấu hình `.env` (rất quan trọng)

Repo này **không commit** các file `.env` thật (chứa secret). Thay vào đó:

- Commit file mẫu: `backend/.env.example`
- Mỗi máy tự tạo file thật: `backend/.env`

Đã cấu hình `.gitignore` ở root để:

- ignore mọi `**/.env` và `**/.env.*`
- **không** ignore `**/.env.example`

## Nếu lỡ push `.env` lên git rồi thì xử lý thế nào?

### Trường hợp 1: `.env` đang bị git “track” (hay gặp nhất)

Chạy tại repo root:

```powershell
git rm --cached backend/.env
git commit -m "Stop tracking backend .env"
git push origin main
```

Lưu ý: file `backend/.env` vẫn nằm trên máy bạn (chỉ là git không track nữa).

### Trường hợp 2: Muốn xoá `.env` khỏi toàn bộ lịch sử git

Chỉ cần khi `.env` đã bị commit/push trước đó và bạn muốn purge lịch sử.
Giải pháp phổ biến là dùng `git filter-repo` (hoặc BFG). Việc này sẽ rewrite history và cần mọi người cùng re-clone.

Nếu bạn muốn mình làm luôn phần “purge lịch sử”, nói mình biết repo này có bao nhiêu người đang pull code và bạn có chấp nhận rewrite history không.
