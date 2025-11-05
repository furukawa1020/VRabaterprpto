/**
 * トラッキングデータの型定義
 */

export interface TrackingData {
  // 表情
  mouthOpen: number;      // 0-1
  mouthSmile: number;     // 0-1
  blink: number;          // 0-1
  eyebrowUp: number;      // 0-1
  
  // 視線
  eyeX: number;           // -1 to 1
  eyeY: number;           // -1 to 1
  
  // 頭部回転（ラジアン）
  headRotation?: {
    x: number; // ピッチ
    y: number; // ヨー
    z: number; // ロール
  };
  
  // 顔の位置
  facePosition?: {
    x: number;
    y: number;
    z: number;
  };
  
  // タイムスタンプ
  timestamp: number;
  
  // 信頼度
  confidence?: number;    // 0-1
}

export interface TrackingConfig {
  enabled: boolean;
  latencyTarget: number;
  interpolation: {
    position: number;
    rotation: number;
    expression: number;
  };
}
