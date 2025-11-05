/**
 * VRabater 設定ファイル
 * 白山モチーフのカラーパレットと各種設定
 */

export const THEME = {
  colors: {
    // 白山カラーパレット
    snowWhite: '#F7F7F7',   // 雪白 - 白山の雪
    riverCyan: '#1E6F68',   // 翠青 - 手取川の碧
    rockBlack: '#2E2B2B',   // 玄岩 - 火山岩
    woodBrown: '#A67C52',   // 木肌 - 里山材

    // UI用派生色
    primary: '#1E6F68',
    secondary: '#A67C52',
    background: '#2E2B2B',
    text: '#F7F7F7',
    accent: '#4A9B94',
  },

  // モチーフ要素
  motifs: {
    // 川のmeander（蛇行）パターン
    meanderWave: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
    
    // 雪の粒子サイズ
    snowParticleSize: { min: 0.5, max: 2.5 },
    
    // 玄武岩の六角形
    hexagonAngle: Math.PI / 3,
  },
} as const;

export const CONFIG = {
  // アバター設定
  avatar: {
    defaultModel: '/models/hakusan_avatar.vrm',
    scale: 1.0,
    position: { x: 0, y: 0, z: 0 }, // アバターを地面に配置
    
    // PBRレンダリング設定
    rendering: {
      toneMapping: 'ACESFilmic',
      toneMappingExposure: 1.0,
      outputEncoding: 'sRGB',
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      antialias: true,
      alpha: true,
    },

    // HDRI環境マップ
    hdri: {
      default: '/hdris/snow_overcast_2k.hdr',
      presets: {
        indoor: '/hdris/indoor_warm.hdr',
        snowy: '/hdris/snow_overcast_2k.hdr',
        sunset: '/hdris/mountain_sunset.hdr',
      },
    },

    // アイドルアニメーション（呼吸）
    idle: {
      breathingCycle: 5.0,      // 秒
      breathingAmplitude: 0.015, // 胸郭の上下幅
      swayAmplitude: 0.005,      // わずかな揺れ
    },

    // 表情パラメータ
    expression: {
      blinkInterval: { min: 2.5, max: 5.0 }, // 秒
      blinkDuration: 0.12,                     // 秒
      smoothingFactor: 0.35,                   // EMA係数
      
      // まばたきカーブ（easeInOutCubic）
      blinkCurve: (t: number) => {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      },

      // 口開度カーブ（easeOutCubic）
      mouthCurve: (t: number) => {
        return 1 - Math.pow(1 - t, 3);
      },
    },

    // 視線制御
    lookAt: {
      enableSaccade: true,          // 微小サッカード
      saccadeInterval: { min: 100, max: 300 }, // ms
      saccadeAmplitude: 0.003,      // ラジアン（約0.17°）
      smoothingFactor: 0.25,
    },
  },

  // トラッキング設定
  tracking: {
    enabled: true,
    latencyTarget: 150, // ms（目標遅延）
    
    // 補間設定
    interpolation: {
      position: 0.35,
      rotation: 0.30,
      expression: 0.35,
    },
  },

  // ゲートウェイ接続
  gateway: {
    url: 'ws://localhost:8080',
    reconnectInterval: 3000, // ms
    maxReconnectAttempts: 10,
  },

  // 音声処理
  audio: {
    enabled: true,
    
    // ボイスチェンジャー（ピッチ/フォルマント）
    voiceChanger: {
      enabled: false, // UI から切替
      pitchShift: 3.5,        // 半音（かわいい声）
      formantShift: 1.2,      // フォルマント倍率
      wetDryMix: 1.0,         // エフェクト量
    },

    // リップシンク
    lipSync: {
      enabled: true,
      threshold: 0.02,        // 音量しきい値
      smoothing: 0.4,
      attackTime: 0.05,       // 秒
      releaseTime: 0.15,      // 秒
    },
  },

  // AI設定
  ai: {
    enabled: false, // UI から切替
    serviceUrl: 'http://localhost:5000',
    
    // STT (Speech-to-Text)
    stt: {
      model: 'whisper-base',
      language: 'ja',
      bufferDuration: 3.0, // 秒
    },

    // LLM
    llm: {
      model: 'qwen2.5:7b-instruct',
      maxTokens: 150,  // 賢くなったので少し長めに
      temperature: 0.8,
      
      // キャラクター設定
      characterPrompt: `あなたは白山の里山に住む、優しくて親しみやすい相棒です。
言葉には「水」「流れ」「澄む」「峠」などの自然の比喩を控えめに使い、
短く、テンポよく応答します。冗長にならず、相手の意図をくみ取って一言で提案します。`,
    },

    // TTS (Text-to-Speech)
    tts: {
      model: 'ja-JP-wavenet-B',
      speed: 1.1,
      pitch: 1.2,
    },
  },

  // パフォーマンス設定
  performance: {
    targetFPS: 30,
    adaptiveQuality: true,
    
    // 品質プリセット
    quality: {
      high: {
        shadowMapSize: 2048,
        particleCount: 500,
        postProcessing: true,
      },
      medium: {
        shadowMapSize: 1024,
        particleCount: 250,
        postProcessing: true,
      },
      low: {
        shadowMapSize: 512,
        particleCount: 100,
        postProcessing: false,
      },
    },
  },

  // UI設定
  ui: {
    position: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    theme: 'dark',            // 'dark' | 'light'
    
    // 表示項目
    controls: {
      showAIToggle: true,
      showExpressionSliders: true,
      showLookAtMode: true,
      showLightingPresets: true,
      showAudioSettings: true,
      showPerformanceStats: false, // 開発者向け
    },
  },
} as const;

// 型エクスポート
export type Config = typeof CONFIG;
export type Theme = typeof THEME;
