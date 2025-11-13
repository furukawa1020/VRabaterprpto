/**
 * Gateway - OpenSeeFace → WebSocket ブリッジ
 * OpenSeeFaceからUDPでトラッキングデータを受信し、
 * WebSocketでWebブラウザに配信する
 */

const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const dgram = require('dgram');
const osc = require('osc');

const WS_PORT = 8080;
const FACE_UDP_PORT = 11573; // OpenSeeFaceのポート
const BODY_OSC_PORT = 11574; // MediaPipeのポート

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

// OpenSeeFace UDPサーバー (バイナリパケット用)
const faceUdpServer = dgram.createSocket('udp4');

// MediaPipe OSCサーバー
const oscServerBody = new osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: BODY_OSC_PORT,
  metadata: true
});

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
    shoulder: { left: { x: 0, y: 0, z: 0, visibility: 0 }, right: { x: 0, y: 0, z: 0, visibility: 0 } },
    elbow: { left: { x: 0, y: 0, z: 0, visibility: 0 }, right: { x: 0, y: 0, z: 0, visibility: 0 } },
    wrist: { left: { x: 0, y: 0, z: 0, visibility: 0 }, right: { x: 0, y: 0, z: 0, visibility: 0 } },
    hip: { left: { x: 0, y: 0, z: 0, visibility: 0 }, right: { x: 0, y: 0, z: 0, visibility: 0 } },
    knee: { left: { x: 0, y: 0, z: 0, visibility: 0 }, right: { x: 0, y: 0, z: 0, visibility: 0 } },
    ankle: { left: { x: 0, y: 0, z: 0, visibility: 0 }, right: { x: 0, y: 0, z: 0, visibility: 0 } },
    // 表情データ (MediaPipe FaceMeshから)
    face: {
      mouthOpen: 0,
      smile: 0,
      eyeBlinkLeft: 0,
      eyeBlinkRight: 0
    }
  }
};

// OpenSeeFace UDPメッセージハンドラ
faceUdpServer.on('message', (msg, rinfo) => {
  try {
    // OpenSeeFaceのバイナリフォーマットをパース
    // フォーマット: time (8 bytes) + id (4 bytes) + データ (可変長)
    if (msg.length < 12) return;

    const offset = 12; // タイムスタンプとIDをスキップ
    let pos = offset;

    // フロート値を読み取るヘルパー関数
    const readFloat = () => {
      if (pos + 4 > msg.length) return 0;
      const value = msg.readFloatLE(pos);
      pos += 4;
      return value;
    };

    // 顔の回転 (quaternion → euler変換)
    const qx = readFloat();
    const qy = readFloat();
    const qz = readFloat();
    const qw = readFloat();

    // Quaternion → Euler変換
    const sinr_cosp = 2 * (qw * qx + qy * qz);
    const cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (qw * qy - qz * qx);
    const pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp);

    const siny_cosp = 2 * (qw * qz + qx * qy);
    const cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    trackingData.headRotation = {
      x: pitch,
      y: yaw,
      z: roll
    };

    // 顔の位置
    trackingData.facePosition = {
      x: readFloat(),
      y: readFloat(),
      z: readFloat()
    };

    // 目の状態 (66個のランドマークから計算)
    // 簡易版: 最初の数値から推定
    const eyeLeft = readFloat();
    const eyeRight = readFloat();
    trackingData.blink = 1.0 - Math.min(eyeLeft, eyeRight);

    // 口の開き (ランドマークから推定)
    const mouthTop = readFloat();
    const mouthBottom = readFloat();
    trackingData.mouthOpen = Math.abs(mouthTop - mouthBottom);

    trackingData.confidence = 0.9; // OpenSeeFaceは通常高い精度
    trackingData.timestamp = Date.now();

    // デバッグ: 1%の確率でログ出力
    if (Math.random() < 0.01) {
      console.log('[UDP FACE] rotation:', trackingData.headRotation, 'blink:', trackingData.blink);
    }

    // 接続中のすべてのクライアントにブロードキャスト
    broadcastToClients(trackingData);

  } catch (error) {
    console.error('❌ 顔UDPパースエラー:', error.message);
  }
});

// 体トラッキングデータ受信
oscServerBody.on('message', (oscMsg) => {
  try {
    const address = oscMsg.address;
    const value = oscMsg.args[0].value;
    
    // デバッグ: 1%の確率でログ出力
    if (Math.random() < 0.01) {
      console.log('[OSC BODY]', address, '→', value);
    }
    
    // 体データのパース: /body/left_shoulder/x → body.shoulder.left.x
    if (address.startsWith('/body/')) {
      const parts = address.split('/');
      // parts[0] = '', parts[1] = 'body', parts[2] = 'left_shoulder', parts[3] = 'x' or 'visibility'
      const fullJoint = parts[2]; // 'left_shoulder' or 'right_elbow'
      const axis = parts[3]; // 'x', 'y', 'z', or 'visibility'
      
      // 'left_shoulder' → side='left', joint='shoulder'
      const match = fullJoint.match(/^(left|right)_(.+)$/);
      if (match) {
        const side = match[1]; // 'left' or 'right'
        const joint = match[2]; // 'shoulder', 'elbow', etc.
        
        if (trackingData.body[joint] && trackingData.body[joint][side]) {
          trackingData.body[joint][side][axis] = value;
        }
      }
    }
    
    // 表情データのパース: /face/mouth_open → body.face.mouthOpen
    if (address.startsWith('/face/')) {
      const parts = address.split('/');
      const faceParam = parts[2]; // 'mouth_open', 'smile', etc.
      
      if (faceParam === 'mouth_open') {
        trackingData.body.face.mouthOpen = value;
      } else if (faceParam === 'smile') {
        trackingData.body.face.smile = value;
      } else if (faceParam === 'blink_left') {
        trackingData.body.face.eyeBlinkLeft = value;
      } else if (faceParam === 'blink_right') {
        trackingData.body.face.eyeBlinkRight = value;
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
║  VRabater Gateway Server (全身対応)    ║
╠════════════════════════════════════════╣
║  WebSocket: ws://localhost:${WS_PORT}      ║
║  UDP Face:  0.0.0.0:${FACE_UDP_PORT}       ║
║  OSC Body:  0.0.0.0:${BODY_OSC_PORT}       ║
╚════════════════════════════════════════╝

⏳ トラッキングシステムの起動を待機中...
  `);
});

// UDPサーバー起動 (顔 - OpenSeeFace)
faceUdpServer.bind(FACE_UDP_PORT, '0.0.0.0');
faceUdpServer.on('listening', () => {
  console.log('✅ 顔トラッキングUDP起動:', FACE_UDP_PORT);
});

// OSCサーバー起動 (体 - MediaPipe)
oscServerBody.open();
oscServerBody.on('ready', () => {
  console.log('✅ 体トラッキングOSC起動:', BODY_OSC_PORT);
});

// エラーハンドリング
faceUdpServer.on('error', (error) => {
  console.error('❌ 顔UDPエラー:', error.message);
});

oscServerBody.on('error', (error) => {
  console.error('❌ 体OSCエラー:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Gateway停止中...');
  faceUdpServer.close();
  oscServerBody.close();
  wss.close();
  process.exit(0);
});
