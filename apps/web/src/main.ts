/**
 * VRabater - メインエントリーポイント
 * 白山モチーフ3Dアバターシステム
 */

import { AvatarSystem } from './avatar/AvatarSystem';
import { TrackingClient } from './tracking/TrackingClient';
import { AudioProcessor } from './audio/AudioProcessor';
import { UI } from './ui/UI';
import { CONFIG } from './config';

class VRabaterApp {
  private avatarSystem!: AvatarSystem;
  private trackingClient!: TrackingClient;
  private audioProcessor!: AudioProcessor;
  private ui!: UI;

  async init() {
    try {
      this.updateLoadingProgress('システム初期化中...');

      // アバターシステムの初期化
      this.updateLoadingProgress('3Dエンジン起動中...');
      this.avatarSystem = new AvatarSystem();
      await this.avatarSystem.init();

      // トラッキングクライアントの初期化
      this.updateLoadingProgress('トラッキング接続中...');
      this.trackingClient = new TrackingClient(CONFIG.gateway.url);
      this.trackingClient.on('tracking-data', (data) => {
        this.avatarSystem.updateFromTracking(data);
      });
      await this.trackingClient.connect();

      // 音声処理の初期化
      this.updateLoadingProgress('音声システム準備中...');
      this.audioProcessor = new AudioProcessor();
      await this.audioProcessor.init();

      // UIの初期化
      this.updateLoadingProgress('UI構築中...');
      this.ui = new UI({
        avatarSystem: this.avatarSystem,
        audioProcessor: this.audioProcessor,
        trackingClient: this.trackingClient,
      });
      this.ui.init();

      // VRMモデルの読み込み
      this.updateLoadingProgress('アバター読み込み中...');
      await this.avatarSystem.loadVRM(CONFIG.avatar.defaultModel);

      // ローディング完了
      this.hideLoading();

      // アニメーションループ開始
      this.avatarSystem.startAnimation();

      console.log('🎉 VRabater システム起動完了！');
      this.showWelcomeMessage();
    } catch (error) {
      console.error('❌ 初期化エラー:', error);
      this.showError('システムの初期化に失敗しました。ページを再読み込みしてください。');
    }
  }

  private updateLoadingProgress(message: string) {
    const progressEl = document.querySelector('.loading-progress');
    if (progressEl) {
      progressEl.textContent = message;
    }
  }

  private hideLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.classList.add('hidden');
      setTimeout(() => {
        loadingEl.style.display = 'none';
      }, 500);
    }
  }

  private showWelcomeMessage() {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🌸 VRabater へようこそ 🌸                          ║
║                                                       ║
║   白山の自然をモチーフにした                          ║
║   3Dアバターシステムです                             ║
║                                                       ║
║   💙 雪白・翠青・玄岩・木肌の4色                     ║
║   🎭 リアルタイム表情追従                            ║
║   🎤 音声変換                                        ║
║   🤖 AI人格切替                                      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
  }

  private showError(message: string) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      const loadingText = loadingEl.querySelector('.loading-text');
      const spinner = loadingEl.querySelector('.loading-spinner');
      const progress = loadingEl.querySelector('.loading-progress');

      if (loadingText) loadingText.textContent = 'エラー';
      if (spinner) spinner.remove();
      if (progress) {
        progress.textContent = message;
        (progress as HTMLElement).style.color = '#ff6b6b';
      }
    }
  }
}

// アプリケーション起動
const app = new VRabaterApp();
app.init();
