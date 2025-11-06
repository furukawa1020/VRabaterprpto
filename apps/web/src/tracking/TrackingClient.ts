/**
 * TrackingClient - OpenSeeFace からのトラッキングデータ受信
 */

import { CONFIG } from '../config';
import type { TrackingData } from './types';

type TrackingCallback = (data: TrackingData) => void;

export class TrackingClient {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks = new Map<string, TrackingCallback[]>();
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ トラッキングゲートウェイに接続しました');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as TrackingData;
            
            // デバッグログ（body データの受信確認）
            if (data.body?.shoulder?.left) {
              console.log('[TrackingClient] 📥 Body data:', {
                leftShoulderX: data.body.shoulder.left.x.toFixed(2),
                rightShoulderX: data.body.shoulder.right?.x.toFixed(2),
                timestamp: data.timestamp
              });
            }
            
            this.emit('tracking-data', data);
          } catch (error) {
            console.error('トラッキングデータのパースエラー:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocketエラー:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.warn('⚠️ トラッキング接続が切断されました');
          this.attemptReconnect();
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= CONFIG.gateway.maxReconnectAttempts) {
      console.error('❌ 再接続試行回数が上限に達しました');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 再接続を試行中 (${this.reconnectAttempts}/${CONFIG.gateway.maxReconnectAttempts})...`);

    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch((error) => {
        console.error('再接続失敗:', error);
      });
    }, CONFIG.gateway.reconnectInterval);
  }

  on(event: string, callback: TrackingCallback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: TrackingCallback) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: TrackingData) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  disconnect() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('トラッキング接続を切断しました');
  }
}
