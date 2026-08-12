const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// 提供前端靜態檔案
app.use(express.static('public'));

// 儲存目前所有在線上的人 (乘客與的士)
const activeUsers = {};

io.on('connection', (socket) => {
  console.log('新使用者連線:', socket.id);

  // 當使用者傳送位置與角色資訊
  socket.on('update-location', (data) => {
    // data 包含: { role: 'passenger' | 'taxi', lat: number, lng: number }
    activeUsers[socket.id] = {
      id: socket.id,
      role: data.role,
      lat: data.lat,
      lng: data.lng
    };

    // 將最新在線的所有人廣播給全體使用者
    io.emit('location-update', activeUsers);
  });

  // 使用者關閉 App、分頁或斷線時自動觸發
  socket.on('disconnect', () => {
    console.log('使用者斷線/離開:', socket.id);
    delete activeUsers[socket.id];
    
    // 通知其他人移除該標記
    io.emit('user-disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server 正在運行於 http://localhost:${PORT}`);
});
