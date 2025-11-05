/**
 * UI - コントロールパネル
 * 白山モチーフのデザイン
 */

import { CONFIG, THEME } from '../config';
import type { AvatarSystem } from '../avatar/AvatarSystem';
import type { AudioProcessor } from '../audio/AudioProcessor';
import type { TrackingClient } from '../tracking/TrackingClient';

interface UIOptions {
  avatarSystem: AvatarSystem;
  audioProcessor: AudioProcessor;
  trackingClient: TrackingClient;
}

export class UI {
  private container: HTMLElement | null = null;
  private options: UIOptions;
  
  // 状態
  private isAIEnabled = false;
  private isVoiceChangerEnabled = false;

  constructor(options: UIOptions) {
    this.options = options;
  }

  init() {
    this.createContainer();
    this.createControls();
    this.attachEventListeners();
    console.log('✅ UI 初期化完了');
  }

  private createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'vrabater-ui';
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, ${THEME.colors.riverCyan}dd 0%, ${THEME.colors.rockBlack}dd 100%);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      color: ${THEME.colors.text};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      z-index: 1000;
      min-width: 280px;
      border: 1px solid rgba(247, 247, 247, 0.1);
    `;

    document.body.appendChild(this.container);
  }

  private createControls() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ui-header" style="margin-bottom: 20px; text-align: center;">
        <h2 style="font-size: 18px; font-weight: 300; letter-spacing: 0.1em; margin: 0;">
          VRabater
        </h2>
        <p style="font-size: 11px; opacity: 0.7; margin: 5px 0 0 0;">
          白山3Dアバター
        </p>
      </div>

      <div class="ui-section" style="margin-bottom: 15px;">
        <label class="ui-label">AI人格</label>
        <button id="ai-toggle" class="ui-toggle" data-enabled="false">
          <span class="toggle-text">手動モード</span>
        </button>
      </div>

      <div class="ui-section" style="margin-bottom: 15px;">
        <label class="ui-label">ボイスチェンジャー</label>
        <button id="voice-toggle" class="ui-toggle" data-enabled="false">
          <span class="toggle-text">オフ</span>
        </button>
      </div>

      <div class="ui-section" style="margin-bottom: 15px;">
        <label class="ui-label">ピッチ: <span id="pitch-value">+3.5</span> 半音</label>
        <input type="range" id="pitch-slider" min="-12" max="12" step="0.5" value="3.5" 
               style="width: 100%;" class="ui-slider">
      </div>

      <div class="ui-section" style="margin-bottom: 15px;">
        <label class="ui-label">照明プリセット</label>
        <select id="lighting-preset" class="ui-select" style="width: 100%;">
          <option value="snowy">雪曇り（デフォルト）</option>
          <option value="indoor">屋内暖色</option>
          <option value="sunset">山の夕景</option>
        </select>
      </div>

      <div class="ui-section" style="margin-bottom: 15px;">
        <label class="ui-label">表情調整</label>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button class="ui-button" data-expression="happy">😊</button>
          <button class="ui-button" data-expression="sad">😢</button>
          <button class="ui-button" data-expression="angry">😠</button>
          <button class="ui-button" data-expression="neutral">😐</button>
        </div>
      </div>

      <div class="ui-footer" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(247,247,247,0.2); text-align: center;">
        <p style="font-size: 10px; opacity: 0.6; margin: 0;">
          💙 白山の自然をモチーフに
        </p>
      </div>
    `;

    this.injectStyles();
  }

  private injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .ui-label {
        display: block;
        font-size: 12px;
        margin-bottom: 8px;
        opacity: 0.9;
        font-weight: 500;
      }

      .ui-toggle {
        width: 100%;
        padding: 10px 16px;
        background: rgba(247, 247, 247, 0.1);
        border: 1px solid rgba(247, 247, 247, 0.2);
        border-radius: 8px;
        color: ${THEME.colors.text};
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 13px;
      }

      .ui-toggle:hover {
        background: rgba(247, 247, 247, 0.15);
        transform: translateY(-1px);
      }

      .ui-toggle[data-enabled="true"] {
        background: ${THEME.colors.riverCyan};
        border-color: ${THEME.colors.riverCyan};
      }

      .ui-slider {
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        background: rgba(247, 247, 247, 0.2);
        border-radius: 3px;
        outline: none;
      }

      .ui-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: ${THEME.colors.snowWhite};
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .ui-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: ${THEME.colors.snowWhite};
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }

      .ui-select {
        padding: 8px 12px;
        background: rgba(247, 247, 247, 0.1);
        border: 1px solid rgba(247, 247, 247, 0.2);
        border-radius: 6px;
        color: ${THEME.colors.text};
        font-size: 12px;
        cursor: pointer;
      }

      .ui-select option {
        background: ${THEME.colors.rockBlack};
        color: ${THEME.colors.text};
      }

      .ui-button {
        flex: 1;
        padding: 10px;
        background: rgba(247, 247, 247, 0.1);
        border: 1px solid rgba(247, 247, 247, 0.2);
        border-radius: 8px;
        font-size: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .ui-button:hover {
        background: rgba(247, 247, 247, 0.2);
        transform: scale(1.1);
      }

      .ui-button:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);
  }

  private attachEventListeners() {
    // AIトグル
    const aiToggle = document.getElementById('ai-toggle');
    aiToggle?.addEventListener('click', () => {
      this.isAIEnabled = !this.isAIEnabled;
      aiToggle.setAttribute('data-enabled', String(this.isAIEnabled));
      aiToggle.querySelector('.toggle-text')!.textContent = 
        this.isAIEnabled ? 'AIモード 🤖' : '手動モード';
      
      console.log(`AI人格: ${this.isAIEnabled ? 'ON' : 'OFF'}`);
      // TODO: AI サービスとの連携
    });

    // ボイスチェンジャートグル
    const voiceToggle = document.getElementById('voice-toggle');
    voiceToggle?.addEventListener('click', () => {
      this.isVoiceChangerEnabled = !this.isVoiceChangerEnabled;
      voiceToggle.setAttribute('data-enabled', String(this.isVoiceChangerEnabled));
      voiceToggle.querySelector('.toggle-text')!.textContent = 
        this.isVoiceChangerEnabled ? 'オン 🎤' : 'オフ';
      
      this.options.audioProcessor.enableVoiceChanger(this.isVoiceChangerEnabled);
    });

    // ピッチスライダー
    const pitchSlider = document.getElementById('pitch-slider') as HTMLInputElement;
    const pitchValue = document.getElementById('pitch-value');
    pitchSlider?.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (pitchValue) {
        pitchValue.textContent = value > '0' ? `+${value}` : value;
      }
      this.options.audioProcessor.setPitchShift(parseFloat(value));
    });

    // 照明プリセット
    const lightingPreset = document.getElementById('lighting-preset') as HTMLSelectElement;
    lightingPreset?.addEventListener('change', (e) => {
      const preset = (e.target as HTMLSelectElement).value as keyof typeof CONFIG.avatar.hdri.presets;
      this.options.avatarSystem.changeHDRI(preset);
      console.log(`照明変更: ${preset}`);
    });

    // 表情ボタン
    document.querySelectorAll('[data-expression]').forEach((button) => {
      button.addEventListener('click', (e) => {
        const expression = (e.target as HTMLElement).getAttribute('data-expression');
        this.applyExpression(expression!);
      });
    });
  }

  private applyExpression(expression: string) {
    const presets: Record<string, Record<string, number>> = {
      happy: { happy: 1.0, relaxed: 0.3 },
      sad: { sad: 0.8, relaxed: 0.2 },
      angry: { angry: 0.7 },
      neutral: { neutral: 1.0 },
    };

    const values = presets[expression];
    if (values) {
      Object.entries(values).forEach(([name, value]) => {
        this.options.avatarSystem.setExpression(name, value);
      });
      
      console.log(`表情適用: ${expression}`);
      
      // 2秒後に表情をリセット
      setTimeout(() => {
        Object.keys(values).forEach((name) => {
          this.options.avatarSystem.setExpression(name, 0);
        });
      }, 2000);
    }
  }

  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }
}
