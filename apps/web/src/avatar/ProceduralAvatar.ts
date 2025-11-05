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
  
  private face: DetailedFace;
  private hair: DetailedHair;
  private body: DetailedBody;
  private clothing: DetailedClothing;
  
  private expressionWeights: Map<string, number>;
  private blinkTimer: number = 0;
  private breatheTimer: number = 0;
  
  constructor(options: ProceduralAvatarOptions = {}) {
    this.group = new THREE.Group();
    this.expressionWeights = new Map();
    
    // デフォルト表情
    this.expressionWeights.set('happy', 0);
    this.expressionWeights.set('sad', 0);
    this.expressionWeights.set('angry', 0);
    this.expressionWeights.set('surprised', 0);
    
    // === 各パーツの生成 ===
    console.log('[ProceduralAvatar] 体を生成中... (骨格、筋肉、指紋、手相)');
    this.body = new DetailedBody();
    this.group.add(this.body.group);
    
    console.log('[ProceduralAvatar] 顔を生成中... (毛穴2000個、まつ毛70本、眉毛160本、産毛500本)');
    this.face = new DetailedFace();
    this.face.group.position.set(0, 0.68, 0); // 下に移動
    this.group.add(this.face.group);
    
    console.log('[ProceduralAvatar] 髪を生成中... (3000本以上の髪の毛、雪の結晶アクセサリー)');
    this.hair = new DetailedHair();
    this.hair.group.position.set(0, 0.68, 0); // 下に移動
    this.group.add(this.hair.group);
    
    console.log('[ProceduralAvatar] 服を生成中... (布の織り目、ボタン、レース)');
    this.clothing = new DetailedClothing();
    this.group.add(this.clothing.group);
    
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
    
    console.log('[ProceduralAvatar] 生成完了！');
  }
  
  /**
   * フレーム更新（物理演算、アニメーション）
   */
  public update(deltaTime: number) {
    // === 髪の毛3000本の物理演算（風でなびく） + 髪飾りうぐいす ===
    this.hair.update(deltaTime);
    
    // === 体のアニメーション + 肩乗りうぐいす ===
    this.body.update(deltaTime);
    
    // === まばたき（2~4秒周期） ===
    this.blinkTimer += deltaTime;
    
    if (this.blinkTimer > 3.0) {
      this.blink();
      this.blinkTimer = 0;
    }
    
    // === 呼吸アニメーション ===
    this.breatheTimer += deltaTime;
    const breatheScale = 1.0 + Math.sin(this.breatheTimer * 1.5) * 0.015;
    
    // 胸の上下
    const torso = this.body.group.getObjectByName('torso');
    if (torso) {
      torso.scale.y = breatheScale;
    }
  }
  
  /**
   * 表情変更
   */
  public setExpression(expression: string, weight: number) {
    this.expressionWeights.set(expression, THREE.MathUtils.clamp(weight, 0, 1));
    this.applyExpression();
  }
  
  private applyExpression() {
    const happy = this.expressionWeights.get('happy') || 0;
    const sad = this.expressionWeights.get('sad') || 0;
    const angry = this.expressionWeights.get('angry') || 0;
    const surprised = this.expressionWeights.get('surprised') || 0;
    
    this.face.group.traverse((obj) => {
      if (obj.name === 'leftEye' || obj.name === 'rightEye') {
        if (surprised > 0) {
          obj.scale.setScalar(1.0 + surprised * 0.3);
        } else if (angry > 0) {
          obj.scale.y = 1.0 - angry * 0.3;
        } else if (sad > 0) {
          obj.position.y -= sad * 0.005;
        } else if (happy > 0) {
          obj.scale.y = 1.0 - happy * 0.2;
        }
      }
      
      if (obj.name === 'lips') {
        if (happy > 0) {
          obj.rotation.z = happy * 0.15;
        } else if (sad > 0) {
          obj.rotation.z = -sad * 0.15;
        } else if (surprised > 0) {
          obj.scale.y = 1.0 + surprised * 0.5;
        }
      }
      
      if (obj.name === 'leftEyebrow' || obj.name === 'rightEyebrow') {
        const side = obj.name === 'leftEyebrow' ? -1 : 1;
        
        if (angry > 0) {
          obj.position.y -= angry * 0.008;
          obj.position.x -= side * angry * 0.003;
          obj.rotation.z = side * angry * 0.2;
        } else if (sad > 0) {
          obj.position.y += sad * 0.005;
          obj.rotation.z = -side * sad * 0.15;
        } else if (surprised > 0) {
          obj.position.y += surprised * 0.012;
        }
      }
    });
  }
  
  /**
   * まばたき
   */
  private blink() {
    this.face.group.traverse((obj) => {
      if (obj.name === 'leftEye' || obj.name === 'rightEye') {
        const originalScale = obj.scale.clone();
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / 200, 1);
          
          if (progress < 0.5) {
            obj.scale.y = originalScale.y * (1 - progress * 2 * 0.95);
          } else {
            obj.scale.y = originalScale.y * (0.05 + (progress - 0.5) * 2 * 0.95);
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            obj.scale.copy(originalScale);
          }
        };
        
        animate();
      }
    });
  }
  
  /**
   * リップシンク
   */
  public setMouthOpen(value: number) {
    const clampedValue = THREE.MathUtils.clamp(value, 0, 1);
    
    this.face.group.traverse((obj) => {
      if (obj.name === 'lips') {
        obj.scale.y = 1.0 + clampedValue * 0.6;
      }
      
      if (obj.name === 'jaw') {
        obj.rotation.x = clampedValue * 0.3;
      }
    });
  }
  
  /**
   * 頭の回転
   */
  public setHeadRotation(euler: THREE.Euler) {
    const headBone = this.body.getBone('head');
    if (headBone) {
      headBone.rotation.copy(euler);
    }
    
    this.face.group.rotation.copy(euler);
    this.hair.group.rotation.copy(euler);
  }
  
  /**
   * 視線
   */
  public setEyeDirection(direction: THREE.Vector3) {
    this.face.group.traverse((obj) => {
      if (obj.name === 'leftEye' || obj.name === 'rightEye') {
        obj.lookAt(direction);
      }
    });
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
