/**
 * ProceduralAvatar.ts
 * VTuber感マシマシの親しみやすい可愛いアバター!
 * 
 * SimpleCuteAvatarを使用: アニメ風で親しみやすい見た目
 */

import * as THREE from 'three';
import { SimpleCuteAvatar } from './SimpleCuteAvatar';

export interface ProceduralAvatarOptions {
  position?: THREE.Vector3;
  scale?: number;
}

export class ProceduralAvatar {
  public group: THREE.Group;
  
  private avatar: SimpleCuteAvatar;
  private blinkTimer: number = 0;
  private breatheTimer: number = 0;
  
  constructor(options: ProceduralAvatarOptions = {}) {
    this.group = new THREE.Group();
    
    // === シンプルで可愛いアバターを生成 ===
    console.log('[ProceduralAvatar] VTuber感マシマシの可愛いアバターを生成中...💕');
    this.avatar = new SimpleCuteAvatar();
    this.group.add(this.avatar.group);
    
    // === 位置・スケール ===
    if (options.position) {
      this.group.position.copy(options.position);
    }
    
    if (options.scale) {
      this.group.scale.setScalar(options.scale);
    }
    
    // === シャドウ設定 ===
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    
    console.log('[ProceduralAvatar] 可愛いアバター生成完了！🎀');
  }
  
  /**
   * フレーム更新(アニメーション)
   */
  public update(deltaTime: number) {
    // SimpleCuteAvatarのupdateを呼び出し
    this.avatar.update(deltaTime);
    
    // === 呼吸アニメーション ===
    this.breatheTimer += deltaTime;
    const breatheScale = 1.0 + Math.sin(this.breatheTimer * 1.5) * 0.01;
    this.avatar.group.scale.y = breatheScale;
  }
  
  /**
   * 表情変更(SimpleCuteAvatarに委譲)
   */
  public setExpression(expression: string, weight: number) {
    // 将来的にSimpleCuteAvatarに表情メソッドを追加
  }
  
  /**
   * リップシンク
   */
  public setMouthOpen(value: number) {
    // 将来的にSimpleCuteAvatarにリップシンクメソッドを追加
  }
  
  /**
   * 頭の回転
   */
  public setHeadRotation(euler: THREE.Euler) {
    this.avatar.group.rotation.copy(euler);
  }
  
  /**
   * 視線
   */
  public setEyeDirection(direction: THREE.Vector3) {
    // 将来的にSimpleCuteAvatarに視線メソッドを追加
  }
  
  /**
   * 破棄処理
   */
  public dispose() {
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}
