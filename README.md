# Drone API
API ที่พัฒนาขึ้นมาด้วย Node.js / Express.js
# วิธีติดตั้ง / Installation
```bash
npm install
```
# การตั้งค่า .env
สร้างไฟล์ .env ในโฟลเดอร์หลักของ Project
```bash
PORT=3000
CONFIG_SERVER_URL={your_URL}
LOG_URL={your_URL}
LOG_API_TOKEN={your_Token}
```
# การ Run Application
```bash
npm start
```
จะทำงานที่ `http://localhost:3000`
# HTTP Method
- `GET /configs/{droneId}` - ดึงข้อมูลประจำตัวของโดรน
- `GET /status/{droneId}` - ดึงสถานะของโดรน
- `GET /logs/{droneId}` - ดึงประวัติการทำงานของโดรน
- `POST /logs` - สร้างข้อมูลใหม่
