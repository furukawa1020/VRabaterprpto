/**
 * Gateway - OpenSeeFace → WebSocket ブリッジ
 * OpenSeeFaceからOSC/TCPでトラッキングデータを受信し、
 * WebSocketでWebブラウザに配信する
 */

const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const dgram = require('dgram');
const osc = require('osc-min');

const WS_PORT = 8080;
const OSC_PORT = 11573; // OpenSeeFaceのデフォルトポート

// WebSocketサーバー
const server = createServer();
const wss = new WebSocketServer({ server });

let connectedClients = new Set();

// WebSocket接続管理
wss.on('connection', (ws) => {
  console.log('✅ クライアント接続:', ws._socket?.remoteAddress);
  connectedClients.add(ws);

  ws.on('close', () => {
    console.log('❌ クライアント切断');
    connectedClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocketエラー:', error);
    connectedClients.delete(ws);
  });
});

// OpenSeeFace OSCサーバー (osc-min使用)
const oscServerFace = dgram.createSocket('udp4');
const oscServerBody = dgram.createSocket('udp4');

// トラッキングデータのパース用
let trackingData = {
  // 顔データ
  mouthOpen: 0,
  mouthSmile: 0,
  blink: 0,
  eyebrowUp: 0,
  eyeX: 0,
  eyeY: 0,
  headRotation: { x: 0, y: 0, z: 0 },
  facePosition: { x: 0, y: 0, z: 0 },
  timestamp: Date.now(),
  confidence: 1.0,
  // 体データ
  body: {
    shoulder: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
    elbow: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
    wrist: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
    hip: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
    knee: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
    ankle: { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } },
  }
};

oscServerFace.on('message', (buf) => {
  try {
    const msg = osc.fromBuffer(buf);
    
    if (!msg || !msg.address) {
      return;
    }
    
    const address = msg.address;
    const args = msg.args.map(arg => arg.value);
    
    // デバッグ: 1%の確率でログ出力
    if (Math.random() < 0.01) {
      console.log('[OSC FACE]', address, args);
    }

    // OpenSeeFaceのOSCメッセージをパース
    switch (address) {
      case '/face/mouth/open':
        trackingData.mouthOpen = Math.max(0, Math.min(1, args[0]));
        break;
      case '/face/mouth/smile':
        trackingData.mouthSmile = Math.max(0, Math.min(1, args[0]));
        break;
      case '/face/eye/blink':
        trackingData.blink = Math.max(0, Math.min(1, args[0]));
        break;
      case '/face/eyebrow/up':
        trackingData.eyebrowUp = Math.max(0, Math.min(1, args[0]));
        break;
      case '/face/eye/x':
        trackingData.eyeX = args[0];
        break;
      case '/face/eye/y':
        trackingData.eyeY = args[0];
        break;
      case '/face/head/rotation':
        trackingData.headRotation = {
          x: args[0] || 0, // pitch
          y: args[1] || 0, // yaw
          z: args[2] || 0, // roll
        };
        break;
      case '/face/position':
        trackingData.facePosition = {
          x: args[0] || 0,
          y: args[1] || 0,
          z: args[2] || 0,
        };
        break;
      case '/face/confidence':
        trackingData.confidence = args[0];
        break;
    }

    trackingData.timestamp = Date.now();

    // 接続中のすべてのクライアントにブロードキャスト
    broadcastToClients(trackingData);

  } catch (error) {
    console.error('OSCメッセージ処理エラー:', error);
  }
});

// 体トラッキングデータ受信
oscServerBody.on('message', (buf) => {
  try {
    const msg = osc.fromBuffer(buf);
    
    if (!msg || !msg.address) {
      return;
    }
    
    const address = msg.address;
    const args = msg.args.map(arg => arg.value);
    
    // デバッグ: 1%の確率でログ出力
    if (Math.random() < 0.01) {
      console.log('[OSC BODY]', address, args);
    }
    
    // 体データのパース: /body/shoulder/left → body.shoulder.left
    if (address.startsWith('/body/')) {
      const parts = address.split('/');
      const joint = parts[2]; // shoulder, elbow, wrist, hip, knee, ankle
      const side = parts[3];  // left, right
      
      if (trackingData.body[joint] && trackingData.body[joint][side]) {
        trackingData.body[joint][side] = {
          x: args[0] || 0,
          y: args[1] || 0,
          z: args[2] || 0,
        };
      }
    }
    
    trackingData.timestamp = Date.now();
    broadcastToClients(trackingData);
  } catch (error) {
    console.error('体トラッキングエラー:', error);
  }
});

function broadcastToClients(data) {
  const message = JSON.stringify(data);
  
  connectedClients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// サーバー起動
server.listen(WS_PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  VRabater Gateway Server               ║
╠════════════════════════════════════════╣
║  WebSocket: ws://localhost:${WS_PORT}      ║
║  OSC Listen: 0.0.0.0:${OSC_PORT}            ║
╚════════════════════════════════════════╝

⏳ OpenSeeFaceの起動を待機中...

OpenSeeFaceを起動するには:
  python facetracker.py -c 0 -W 640 -H 480 \\
    --discard-after 0 --scan-every 0 --no-3d-adapt 1 \\
    --ip 127.0.0.1 --port ${OSC_PORT}
  `);
});

// OSCサーバー起動
oscServer.bind(OSC_PORT, '0.0.0.0', () => {
  console.log('✅ OSCサーバー起動:', OSC_PORT);
});

// エラーハンドリング
oscServer.on('error', (error) => {
  console.error('❌ OSCサーバーエラー:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Gateway停止中...');
  oscServer.close();
  wss.close();
  process.exit(0);
});
