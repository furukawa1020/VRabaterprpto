/**
 * VRoidAvatar.ts
 * VRoidで作成したVRMモデルを読み込んで使う
 * めちゃかわいいVTuberアバター！🎀
 */

import * as THREE from 'three';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class VRoidAvatar {
  public group: THREE.Group;
  private vrm: VRM | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private blinkTimer = 0;

  constructor() {
    this.group = new THREE.Group();
  }

  /**
   * VRMモデルを読み込み
   */
  async loadModel(modelPath: string = '/models/hakusan-avatar.vrm'): Promise<void> {
    console.log('[VRoidAvatar] VRMモデル読み込み中...', modelPath);

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    try {
      const gltf = await loader.loadAsync(modelPath);
      
      this.vrm = gltf.userData.vrm as VRM;
      
      if (!this.vrm) {
        throw new Error('VRMデータが見つかりません');
      }

      // VRMモデルを回転調整
      VRMUtils.rotateVRM0(this.vrm);
      
      this.group.add(this.vrm.scene);
      
      // 初期回転を設定(正面向き)
      this.group.rotation.y = 0; // 0度(回転なし)
      console.log('[VRoidAvatar] 🔄 回転設定:', {
        y: this.group.rotation.y,
        degrees: (this.group.rotation.y * 180 / Math.PI).toFixed(1) + '度'
      });
      
      // アニメーションミキサー
      this.mixer = new THREE.AnimationMixer(this.vrm.scene);
      
      console.log('[VRoidAvatar] ✨ VRMモデル読み込み完了！めちゃかわいい！');
      
    } catch (error) {
      console.error('[VRoidAvatar] ❌ モデル読み込みエラー:', error);
      throw error;
    }
  }

  /**
   * フレーム更新
   */
  update(deltaTime: number) {
    if (!this.vrm) return;

    // VRMの更新
    this.vrm.update(deltaTime);
    
    // アニメーション更新
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // まばたき
    this.blinkTimer += deltaTime;
    if (this.blinkTimer > 3.0) {
      this.blink();
      this.blinkTimer = 0;
    }

    // ふわふわ揺れる(可愛い動き)
    const time = Date.now() * 0.001;
    this.group.position.y = Math.sin(time * 2) * 0.01;
    // Y軸回転を保持しながらZ軸の揺れを適用
    this.group.rotation.set(0, 0, Math.sin(time * 1.5) * 0.02);
  }

  /**
   * まばたき
   */
  private blink() {
    if (!this.vrm) return;

    const expressionManager = this.vrm.expressionManager;
    if (!expressionManager) return;

    // まばたきアニメーション
    expressionManager.setValue('blink', 1.0);
    
    setTimeout(() => {
      expressionManager?.setValue('blink', 0.0);
    }, 150);
  }

  /**
   * 表情変更
   */
  setExpression(expressionName: string, value: number) {
    if (!this.vrm?.expressionManager) return;
    
    this.vrm.expressionManager.setValue(expressionName, value);
  }

  /**
   * 頭の回転
   */
  setHeadRotation(euler: THREE.Euler) {
    if (!this.vrm) {
      console.log('[VRoidAvatar] VRMがまだ読み込まれていません');
      return;
    }

    const head = this.vrm.humanoid.getNormalizedBoneNode('head');
    if (head) {
      head.rotation.copy(euler);
      console.log('[VRoidAvatar] 頭回転:', euler.x, euler.y, euler.z);
    } else {
      console.warn('[VRoidAvatar] headボーンが見つかりません');
    }
  }

  /**
   * リップシンク
   */
  setMouthOpen(value: number) {
    if (!this.vrm?.expressionManager) {
      console.log('[VRoidAvatar] expressionManagerがありません');
      return;
    }
    
    console.log('[VRoidAvatar] 口開き:', value);
    this.vrm.expressionManager.setValue('aa', value);
  }

  /**
   * 体の各部位の回転設定
   */
  setBodyRotation(boneName: string, rotation: THREE.Euler) {
    if (!this.vrm) return;
    
    const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName as any);
    if (bone) {
      bone.rotation.copy(rotation);
    }
  }

  /**
   * 手足の位置制御
   */
  setLimbPosition(boneName: string, position: THREE.Vector3) {
    if (!this.vrm) return;
    
    const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName as any);
    if (bone) {
      // IK的な制御が必要な場合はここで実装
      // 今回はシンプルに回転で対応
      const direction = position.clone().normalize();
      bone.lookAt(direction);
    }
  }

  /**
   * 全身トラッキングデータの適用
   */
  applyFullBodyTracking(bodyData: any) {
    if (!this.vrm || !bodyData) return;

    // 肩
    if (bodyData.shoulder) {
      if (bodyData.shoulder.left) {
        const leftShoulder = this.vrm.humanoid.getNormalizedBoneNode('leftShoulder');
        if (leftShoulder) {
          const angle = (bodyData.shoulder.left.y - 0.5) * Math.PI;
          leftShoulder.rotation.z = angle;
        }
      }
      if (bodyData.shoulder.right) {
        const rightShoulder = this.vrm.humanoid.getNormalizedBoneNode('rightShoulder');
        if (rightShoulder) {
          const angle = (bodyData.shoulder.right.y - 0.5) * Math.PI;
          rightShoulder.rotation.z = -angle;
        }
      }
    }

    // 肘
    if (bodyData.elbow) {
      if (bodyData.elbow.left) {
        const leftLowerArm = this.vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
        if (leftLowerArm) {
          const angle = Math.max(0, (bodyData.elbow.left.y - 0.3) * Math.PI * 2);
          leftLowerArm.rotation.x = -angle;
        }
      }
      if (bodyData.elbow.right) {
        const rightLowerArm = this.vrm.humanoid.getNormalizedBoneNode('rightLowerArm');
        if (rightLowerArm) {
          const angle = Math.max(0, (bodyData.elbow.right.y - 0.3) * Math.PI * 2);
          rightLowerArm.rotation.x = -angle;
        }
      }
    }

    // 手首
    if (bodyData.wrist) {
      if (bodyData.wrist.left) {
        const leftHand = this.vrm.humanoid.getNormalizedBoneNode('leftHand');
        if (leftHand) {
          leftHand.rotation.y = (bodyData.wrist.left.x - 0.5) * Math.PI * 0.5;
        }
      }
      if (bodyData.wrist.right) {
        const rightHand = this.vrm.humanoid.getNormalizedBoneNode('rightHand');
        if (rightHand) {
          rightHand.rotation.y = (bodyData.wrist.right.x - 0.5) * Math.PI * 0.5;
        }
      }
    }

    // 腰
    if (bodyData.hip) {
      const hips = this.vrm.humanoid.getNormalizedBoneNode('hips');
      if (hips) {
        const avgY = ((bodyData.hip.left?.y || 0.5) + (bodyData.hip.right?.y || 0.5)) / 2;
        hips.position.y = (avgY - 0.5) * 0.5;
      }
    }

    // 膝
    if (bodyData.knee) {
      if (bodyData.knee.left) {
        const leftLowerLeg = this.vrm.humanoid.getNormalizedBoneNode('leftLowerLeg');
        if (leftLowerLeg) {
          const angle = Math.max(0, (0.6 - bodyData.knee.left.y) * Math.PI);
          leftLowerLeg.rotation.x = angle;
        }
      }
      if (bodyData.knee.right) {
        const rightLowerLeg = this.vrm.humanoid.getNormalizedBoneNode('rightLowerLeg');
        if (rightLowerLeg) {
          const angle = Math.max(0, (0.6 - bodyData.knee.right.y) * Math.PI);
          rightLowerLeg.rotation.x = angle;
        }
      }
    }

    // 足首
    if (bodyData.ankle) {
      if (bodyData.ankle.left) {
        const leftFoot = this.vrm.humanoid.getNormalizedBoneNode('leftFoot');
        if (leftFoot) {
          leftFoot.rotation.x = (bodyData.ankle.left.y - 0.9) * Math.PI;
        }
      }
      if (bodyData.ankle.right) {
        const rightFoot = this.vrm.humanoid.getNormalizedBoneNode('rightFoot');
        if (rightFoot) {
          rightFoot.rotation.x = (bodyData.ankle.right.y - 0.9) * Math.PI;
        }
      }
    }
  }

  /**
   * 破棄処理
   */
  dispose() {
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
    }
  }
}
