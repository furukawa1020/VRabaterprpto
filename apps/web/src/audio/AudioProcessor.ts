/**
 * AudioProcessor - 音声処理・ボイスチェンジャー・リップシンク
 */

import * as Tone from 'tone';
import { CONFIG } from '../config';

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  
  // Tone.js エフェクト
  private pitchShift: Tone.PitchShift | null = null;
  private compressor: Tone.Compressor | null = null;
  private limiter: Tone.Limiter | null = null;
  
  // リップシンク用
  private analyser: AnalyserNode | null = null;
  private lipSyncCallback: ((volume: number) => void) | null = null;
  
  // 状態
  private isVoiceChangerEnabled = false;
  private isProcessing = false;

  async init() {
    try {
      // マイクアクセスのリクエスト
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // AudioContext の作成
      this.audioContext = new AudioContext();
      this.sourceNode = this.audioContext.createMediaStreamSource(this.micStream);

      // アナライザー（リップシンク用）
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = CONFIG.audio.lipSync.smoothing;
      
      this.sourceNode.connect(this.analyser);

      // Tone.js のセットアップ
      await Tone.start();
      
      // ピッチシフター（かわいい声！）
      this.pitchShift = new Tone.PitchShift({
        pitch: CONFIG.audio.voiceChanger.pitchShift,
        windowSize: 0.1,
        delayTime: 0,
        feedback: 0,
      });

      // コンプレッサー（音量の安定化）
      this.compressor = new Tone.Compressor({
        threshold: -20,
        ratio: 4,
        attack: 0.003,
        release: 0.25,
      });

      // リミッター（クリッピング防止）
      this.limiter = new Tone.Limiter(-1);

      // エフェクトチェーンの構築（初期は無効）
      // sourceNode → [pitchShift] → compressor → limiter → destination

      console.log('✅ AudioProcessor 初期化完了');

      // リップシンク更新を開始
      this.startLipSyncMonitoring();

    } catch (error) {
      console.error('❌ 音声デバイスの初期化エラー:', error);
      throw error;
    }
  }

  private startLipSyncMonitoring() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!this.analyser) return;

      this.analyser.getByteTimeDomainData(dataArray);

      // 音量計算（RMS）
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // しきい値処理
      const volume = rms > CONFIG.audio.lipSync.threshold ? rms : 0;

      // コールバック呼び出し
      if (this.lipSyncCallback) {
        this.lipSyncCallback(volume);
      }

      requestAnimationFrame(update);
    };

    update();
  }

  enableVoiceChanger(enable: boolean) {
    if (!this.audioContext || !this.sourceNode) return;

    this.isVoiceChangerEnabled = enable;

    if (enable) {
      // エフェクトチェーンを接続
      console.log('🎤 ボイスチェンジャー有効化');
      
      // Web Audio API → Tone.js へのブリッジ
      const toneSource = this.audioContext.createMediaStreamSource(this.micStream!);
      const toneDestination = this.audioContext.createMediaStreamDestination();
      
      // Tone.js エフェクト適用
      if (this.pitchShift && this.compressor && this.limiter) {
        const input = Tone.context.createMediaStreamSource(this.micStream!);
        input.connect(this.pitchShift);
        this.pitchShift.connect(this.compressor);
        this.compressor.connect(this.limiter);
        this.limiter.toDestination();
      }

    } else {
      // エフェクトをバイパス
      console.log('🎤 ボイスチェンジャー無効化');
      
      if (this.pitchShift) {
        this.pitchShift.disconnect();
      }
    }
  }

  setPitchShift(semitones: number) {
    if (this.pitchShift) {
      this.pitchShift.pitch = semitones;
      console.log(`🎵 ピッチシフト: ${semitones} 半音`);
    }
  }

  setFormantShift(ratio: number) {
    // フォルマントシフトは現在 Tone.js では直接サポートされていないため、
    // 将来的に WASM (Rubber Band / World) で実装予定
    console.warn('⚠️ フォルマントシフトは未実装（将来実装予定）');
  }

  onLipSync(callback: (volume: number) => void) {
    this.lipSyncCallback = callback;
  }

  getOutputStream(): MediaStream | null {
    // 仮想オーディオデバイスへの出力用
    // 実際には OS レベルの仮想デバイス (VB-Cable等) を使用
    return this.micStream;
  }

  async changeInputDevice(deviceId: string) {
    try {
      // 既存のストリームを停止
      if (this.micStream) {
        this.micStream.getTracks().forEach(track => track.stop());
      }

      // 新しいデバイスからストリームを取得
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // ソースノードを再構築
      if (this.audioContext) {
        this.sourceNode = this.audioContext.createMediaStreamSource(this.micStream);
        if (this.analyser) {
          this.sourceNode.connect(this.analyser);
        }
      }

      console.log('✅ 入力デバイス変更:', deviceId);
    } catch (error) {
      console.error('❌ 入力デバイス変更エラー:', error);
    }
  }

  async getInputDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'audioinput');
  }

  dispose() {
    // リソースのクリーンアップ
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
    }

    if (this.pitchShift) {
      this.pitchShift.dispose();
    }

    if (this.compressor) {
      this.compressor.dispose();
    }

    if (this.limiter) {
      this.limiter.dispose();
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    console.log('🔇 AudioProcessor 停止');
  }
}
