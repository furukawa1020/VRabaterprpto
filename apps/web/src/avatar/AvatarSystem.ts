/**
 * AvatarSystem - VRM制御・描画・アニメーションの統合システム
 */

import * as THREE from 'three';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG, THEME } from '../config';
import type { TrackingData } from '../tracking/types';
import { ProceduralAvatar } from './ProceduralAvatar';

export class AvatarSystem {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private vrm: VRM | null = null;
  private proceduralAvatar: ProceduralAvatar | null = null;
  private useProceduralAvatar = false;
  private clock = new THREE.Clock();
  
  // アニメーション状態
  private idleTime = 0;
  private blinkTime = 0;
  private nextBlinkTime = 3;
  private rotationLogged = false; // デバッグ用フラグ
  private isBlinking = false;
  private blinkStartTime = 0;
  private hasBodyTracking = false; // ボディトラッキング有効フラグ
  
  // 表情状態（スムージング用）
  private currentExpression = {
    blink: 0,
    mouthOpen: 0,
    mouthSmile: 0,
    eyeX: 0,
    eyeY: 0,
  };

  async init() {
    // シーンの初期化
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1E6F68); // 翠青（手取川の色）

    // カメラの初期化
    const container = document.getElementById('canvas-container')!;
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 20);
    // 前方から見る(通常位置)
    this.camera.position.set(0, 0.8, 2.0);  
    this.camera.lookAt(0, 0.7, 0); // アバターの顔を見る

    // レンダラーの初期化（PBR設定）
    this.renderer = new THREE.WebGLRenderer({
      antialias: CONFIG.avatar.rendering.antialias,
      alpha: CONFIG.avatar.rendering.alpha,
    });
    
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(CONFIG.avatar.rendering.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; // Three.js r152以降
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = CONFIG.avatar.rendering.toneMappingExposure;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(this.renderer.domElement);

    // ライティングのセットアップ
    this.setupLighting();

    // HDRI環境マップの読み込み
    await this.loadHDRI(CONFIG.avatar.hdri.default);

    // ウィンドウリサイズ対応
    window.addEventListener('resize', () => this.onResize());

    console.log('✅ AvatarSystem 初期化完了');
  }

  private setupLighting() {
    // Key light (soft light reflecting from snowy mountains)
    const keyLight = new THREE.DirectionalLight(THEME.colors.snowWhite, 2.0);
    keyLight.position.set(2, 3, 2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    // Fill light (cyan reminiscent of Tedori River)
    const fillLight = new THREE.DirectionalLight(THEME.colors.riverCyan, 0.8);
    fillLight.position.set(-2, 1, -1);
    this.scene.add(fillLight);

    // Rim light (emphasizing basalt silhouette)
    const rimLight = new THREE.DirectionalLight(THEME.colors.snowWhite, 1.0);
    rimLight.position.set(0, 1, -3);
    this.scene.add(rimLight);

    // Ambient light (overall base lighting)
    const ambient = new THREE.AmbientLight(THEME.colors.snowWhite, 0.8);
    this.scene.add(ambient);
  }

  private async loadHDRI(path: string) {
    try {
      const loader = new RGBELoader();
      const texture = await loader.loadAsync(path);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      console.log('HDRI environment map loaded');
    } catch (error) {
      console.warn('⚠️ HDRI読み込み失敗、デフォルト環境を使用:', error);
      // フォールバック：シンプルな環境キューブ
      const cubeTextureLoader = new THREE.CubeTextureLoader();
      this.scene.environment = cubeTextureLoader.load([
        '/fallback/px.png', '/fallback/nx.png',
        '/fallback/py.png', '/fallback/ny.png',
        '/fallback/pz.png', '/fallback/nz.png',
      ]);
    }
  }

  async loadVRM(path: string) {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    try {
      const gltf = await loader.loadAsync(path);
      const vrm = gltf.userData.vrm as VRM;

      // VRMの座標系を修正
      VRMUtils.removeUnnecessaryVertices(gltf.scene);
      VRMUtils.removeUnnecessaryJoints(gltf.scene);

      // 既存のVRMを削除
      if (this.vrm) {
        this.scene.remove(this.vrm.scene);
        VRMUtils.deepDispose(this.vrm.scene);
      }
      
      // プロシージャルアバターを削除
      if (this.proceduralAvatar) {
        this.scene.remove(this.proceduralAvatar.group);
        this.proceduralAvatar.dispose();
        this.proceduralAvatar = null;
      }

      // 新しいVRMをシーンに追加
      this.vrm = vrm;
      this.useProceduralAvatar = false;
      this.scene.add(vrm.scene);

      // 位置調整
      vrm.scene.position.set(
        CONFIG.avatar.position.x,
        CONFIG.avatar.position.y,
        CONFIG.avatar.position.z
      );
      vrm.scene.scale.setScalar(CONFIG.avatar.scale);
      
      // 回転はVRoidAvatar.tsで管理
      console.log('✅ VRMモデル配置完了');

      // 影の設定
      vrm.scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });

      console.log('✅ VRMモデル読み込み完了:', path);
    } catch (error) {
      console.error('❌ VRM読み込みエラー:', error);
      console.log('🎨 プロシージャルアバターにフォールバック');
      
      // VRMが読み込めない場合、プロシージャルアバターを生成
      this.loadProceduralAvatar();
      throw error;
    }
  }
  
  /**
   * プロシージャルアバターを生成（VRMの代わり）
   */
  private loadProceduralAvatar() {
    console.log('🎨 超詳細プロシージャルアバター生成中...');
    console.log('   - 顔: 毛穴2000個、まつ毛70本、眉毛160本、産毛500本');
    console.log('   - 髪: 3000本以上 + 雪の結晶 + うぐいす髪飾り');
    console.log('   - 体: 骨格、筋肉、指紋、手相 + 肩乗りうぐいす');
    console.log('   - 服: 布の織り目、ボタン、レース');
    
    // 既存のVRMを削除
    if (this.vrm) {
      this.scene.remove(this.vrm.scene);
      this.vrm = null;
    }
    
    // プロシージャルアバターを生成
    this.proceduralAvatar = new ProceduralAvatar({
      position: new THREE.Vector3(
        CONFIG.avatar.position.x,
        CONFIG.avatar.position.y,
        CONFIG.avatar.position.z
      ),
      scale: CONFIG.avatar.scale,
    });
    
    this.useProceduralAvatar = true;
    this.scene.add(this.proceduralAvatar.group);
    
    console.log('✅ プロシージャルアバター生成完了！');
  }

  updateFromTracking(data: TrackingData) {
    if (this.useProceduralAvatar && this.proceduralAvatar) {
      // プロシージャルアバターの更新
      this.updateProceduralFromTracking(data);
      return;
    }
    
    if (!this.vrm) return;

    // 体のトラッキング適用（最優先）
    if (data.body) {
      this.hasBodyTracking = true;
      this.applyBodyTracking(data.body);
      return; // ボディトラッキング時は顔のトラッキングをスキップ
    }

    const proxy = this.vrm.expressionManager;
    if (!proxy) return;

    // 表情のスムージング（EMA）
    const smooth = CONFIG.avatar.expression.smoothingFactor;
    
    this.currentExpression.mouthOpen = this.ema(
      this.currentExpression.mouthOpen,
      data.mouthOpen,
      smooth
    );
    
    this.currentExpression.eyeX = this.ema(
      this.currentExpression.eyeX,
      data.eyeX,
      CONFIG.avatar.lookAt.smoothingFactor
    );
    
    this.currentExpression.eyeY = this.ema(
      this.currentExpression.eyeY,
      data.eyeY,
      CONFIG.avatar.lookAt.smoothingFactor
    );

    // 口形状の適用（非線形カーブ）
    const mouthValue = CONFIG.avatar.expression.mouthCurve(
      this.currentExpression.mouthOpen
    );
    proxy.setValue('aa', mouthValue);
    
    // 視線の適用
    if (this.vrm.lookAt) {
      this.vrm.lookAt.lookAt(new THREE.Vector3(
        this.currentExpression.eyeX,
        this.currentExpression.eyeY,
        -1
      ));
    }

    // 頭部回転
    if (data.headRotation) {
      const head = this.vrm.humanoid?.getRawBoneNode('head');
      if (head) {
        head.rotation.set(
          data.headRotation.x * 0.7, // ピッチ
          data.headRotation.y * 0.7, // ヨー
          data.headRotation.z * 0.5  // ロール
        );
      }
    }
  }
  
  /**
   * プロシージャルアバター用のトラッキング更新
   */
  private updateProceduralFromTracking(data: TrackingData) {
    if (!this.proceduralAvatar) return;
    
    // 表情のスムージング
    const smoothing = 0.3;
    
    this.currentExpression.blink = 
      this.currentExpression.blink * (1 - smoothing) + data.blink * smoothing;
    this.currentExpression.mouthOpen = 
      this.currentExpression.mouthOpen * (1 - smoothing) + data.mouthOpen * smoothing;
    this.currentExpression.mouthSmile = 
      this.currentExpression.mouthSmile * (1 - smoothing) + data.mouthSmile * smoothing;
    
    // リップシンク
    this.proceduralAvatar.setMouthOpen(this.currentExpression.mouthOpen);
    
    // 表情
    if (this.currentExpression.mouthSmile > 0.3) {
      this.proceduralAvatar.setExpression('happy', this.currentExpression.mouthSmile);
    }
    
    // 視線
    this.proceduralAvatar.setEyeDirection(
      new THREE.Vector3(data.eyeX, data.eyeY, -1)
    );
    
    // 頭部回転
    if (data.headRotation) {
      const euler = new THREE.Euler(
        data.headRotation.x * 0.7,
        data.headRotation.y * 0.7,
        data.headRotation.z * 0.5
      );
      this.proceduralAvatar.setHeadRotation(euler);
    }
    
    // 🦴 全身トラッキング (体データがあれば適用)
    if ((data as any).body) {
      this.proceduralAvatar.applyFullBodyTracking((data as any).body);
    }
  }

  /**
   * 体のトラッキングデータを適用
   */
  private applyBodyTracking(body: any) {
    if (!this.vrm) return;
    if (!body) return;

    const humanoid = this.vrm.humanoid;
    if (!humanoid) return;

    // 上半身のみか全身かを判定（足が見えているか）
    const hasLowerBody = body.hip && body.knee && (body.hip.left || body.hip.right);
    
    // 上半身のみの場合、座っているポーズに（アバター全体を下に移動）
    if (!hasLowerBody) {
      // アバター全体を下げて座っているように見せる
      this.vrm.scene.position.y = -0.6;  // 腰を下げる
      this.camera.position.set(0, 1.0, 1.8);  // 上半身を正面から
      this.camera.lookAt(0, 0.9, 0);
    } else {
      // 通常の立ち姿勢
      this.vrm.scene.position.y = 0;
      this.camera.position.set(0, 1.0, 2.5);  // 全身を上から見下ろす角度
      this.camera.lookAt(0, 0.9, 0);
    }

    // MediaPipe: x(0-1 左→右), y(0-1 上→下), z(0-1 奥→手前)
    // Z軸の改善: 肩の中心からのZ距離を基準にして、体貫通を防ぐ
    
    // 肩の中心位置を計算（基準点として使用）
    let shoulderCenterZ = 0;
    if (body.shoulder && body.shoulder.left && body.shoulder.right) {
      shoulderCenterZ = (body.shoulder.left.z + body.shoulder.right.z) / 2;
    }
    
    // 信頼度のしきい値（0.1以下は無視、上半身は高く下半身は低くなりがち）
    const VISIBILITY_THRESHOLD = 0.1;
    
    // 肩の回転(腕の動き) - Z軸を肩基準の相対値に
    if (body.shoulder && body.elbow) {
      // 左肩 - visibilityに応じて補間で回転を適用
      if (body.shoulder.left && body.elbow.left) {
        const s = body.shoulder.left;
        const e = body.elbow.left;
        const bone = humanoid.getRawBoneNode('leftUpperArm' as any);
        if (bone) {
          const dy = (e.y - s.y) * 3;  // 上下
          const dx = (e.x - s.x) * 3;  // 左右
          const dz = (e.z - shoulderCenterZ) * 4;  // 前後
          const visible = (s.visibility > VISIBILITY_THRESHOLD && e.visibility > VISIBILITY_THRESHOLD);
          const targetX = visible ? dy : 0;
          const targetY = visible ? -dz : 0;
          const targetZ = visible ? -dx : 0;
          const smoothing = visible ? 0.5 : 0.12; // 動いているときは早めに追従、見えないときはゆっくり戻る
          this.smoothBoneRotation(bone, targetX, targetY, targetZ, smoothing);
        }
      }
      
      // 右肩 - 信頼度チェック
      if (body.shoulder.right && body.elbow.right) {
        const s = body.shoulder.right;
        const e = body.elbow.right;
        const bone = humanoid.getRawBoneNode('rightUpperArm' as any);
        if (bone) {
          const dy = (e.y - s.y) * 3;
          const dx = (e.x - s.x) * 3;
          const dz = (e.z - shoulderCenterZ) * 4;
          const visible = (s.visibility > VISIBILITY_THRESHOLD && e.visibility > VISIBILITY_THRESHOLD);
          const targetX = visible ? dy : 0;
          const targetY = visible ? -dz : 0;
          const targetZ = visible ? -dx : 0;
          const smoothing = visible ? 0.5 : 0.12;
          this.smoothBoneRotation(bone, targetX, targetY, targetZ, smoothing);
        }
      }
    }

    // 肘の回転(前腕の動き) - 肘基準で手首の相対位置
    if (body.elbow && body.wrist) {
      // 左肘 - visibilityに応じて補間で回転を適用
      if (body.elbow.left && body.wrist.left) {
        const e = body.elbow.left;
        const w = body.wrist.left;
        const bone = humanoid.getRawBoneNode('leftLowerArm' as any);
        if (bone) {
          const dy = (w.y - e.y) * 2.5;
          const dx = (w.x - e.x) * 2.5;
          const dz = (w.z - e.z) * 3;
          const visible = (e.visibility > VISIBILITY_THRESHOLD && w.visibility > VISIBILITY_THRESHOLD);
          const targetX = visible ? dy : 0;
          const targetY = visible ? -dz : 0;
          const targetZ = visible ? -dx : 0;
          const smoothing = visible ? 0.45 : 0.12;
          this.smoothBoneRotation(bone, targetX, targetY, targetZ, smoothing);
        }
      }
      
      // 右肘 - visibilityに応じて補間で回転を適用
      if (body.elbow.right && body.wrist.right) {
        const e = body.elbow.right;
        const w = body.wrist.right;
        const bone = humanoid.getRawBoneNode('rightLowerArm' as any);
        if (bone) {
          const dy = (w.y - e.y) * 2.5;
          const dx = (w.x - e.x) * 2.5;
          const dz = (w.z - e.z) * 3;
          const visible = (e.visibility > VISIBILITY_THRESHOLD && w.visibility > VISIBILITY_THRESHOLD);
          const targetX = visible ? dy : 0;
          const targetY = visible ? -dz : 0;
          const targetZ = visible ? -dx : 0;
          const smoothing = visible ? 0.45 : 0.12;
          this.smoothBoneRotation(bone, targetX, targetY, targetZ, smoothing);
        }
      }
    }

    // 手首の回転(手の動き)
    if (body.wrist) {
      // 左手首 - visibilityに応じて補間で回転を適用
      if (body.wrist.left) {
        const w = body.wrist.left;
        const handBone = humanoid.getRawBoneNode('leftHand' as any);
        if (handBone) {
          const tx = (w.y - 0.5) * 0.5; // 上下傾き(簡易)
          const tz = -(w.x - 0.5) * 0.5; // 左右傾き
          const visible = (w.visibility > VISIBILITY_THRESHOLD);
          const smoothing = visible ? 0.4 : 0.12;
          this.smoothBoneRotation(handBone, tx, 0, tz, smoothing);
        }
      }
      
      // 右手首 - visibilityに応じて補間で回転を適用
      if (body.wrist.right) {
        const w = body.wrist.right;
        const handBone = humanoid.getRawBoneNode('rightHand' as any);
        if (handBone) {
          const tx = (w.y - 0.5) * 0.5;
          const tz = -(w.x - 0.5) * 0.5;
          const visible = (w.visibility > VISIBILITY_THRESHOLD);
          const smoothing = visible ? 0.4 : 0.12;
          this.smoothBoneRotation(handBone, tx, 0, tz, smoothing);
        }
      }
    }
    
    // 表情トラッキング（顔のランドマークがある場合のみ）
    if (body.face && this.vrm.expressionManager) {
      const proxy = this.vrm.expressionManager;
      
      // 口の開き具合
      if (body.face.mouthOpen !== undefined) {
        const mouthValue = Math.max(0, Math.min(1, body.face.mouthOpen));
        proxy.setValue('aa', mouthValue);
      }
      
      // 笑顔
      if (body.face.smile !== undefined) {
        const smileValue = Math.max(0, Math.min(1, body.face.smile));
        proxy.setValue('joy', smileValue);
      }
      
      // まばたき
      if (body.face.eyeBlinkLeft !== undefined) {
        const blinkValue = Math.max(0, Math.min(1, body.face.eyeBlinkLeft));
        proxy.setValue('blinkLeft', blinkValue);
      }
      if (body.face.eyeBlinkRight !== undefined) {
        const blinkValue = Math.max(0, Math.min(1, body.face.eyeBlinkRight));
        proxy.setValue('blinkRight', blinkValue);
      }
    }

    // 股関節の回転(足の動き)
    if (body.hip && body.knee) {
      // 左股関節 - 信頼度チェック
      if (body.hip.left && body.knee.left && 
          body.hip.left.visibility > VISIBILITY_THRESHOLD && 
          body.knee.left.visibility > VISIBILITY_THRESHOLD) {
        const h = body.hip.left;
        const k = body.knee.left;
        const bone = humanoid.getRawBoneNode('leftUpperLeg' as any);
        if (bone) {
          const dy = (k.y - h.y) * 2;
          const dx = (k.x - h.x) * 2;
          
          bone.rotation.x = dy - 1.5; // 立ち姿勢を基準に調整
          bone.rotation.z = -dx;
          bone.updateMatrix();
        }
      }
      
      // 右股関節 - 信頼度チェック
      if (body.hip.right && body.knee.right && 
          body.hip.right.visibility > VISIBILITY_THRESHOLD && 
          body.knee.right.visibility > VISIBILITY_THRESHOLD) {
        const h = body.hip.right;
        const k = body.knee.right;
        const bone = humanoid.getRawBoneNode('rightUpperLeg' as any);
        if (bone) {
          const dy = (k.y - h.y) * 2;
          const dx = (k.x - h.x) * 2;
          
          bone.rotation.x = dy - 1.5;
          bone.rotation.z = -dx;
          bone.updateMatrix();
        }
      }
    }

    // 膝の回転(すねの動き)
    if (body.knee && body.ankle) {
      // 左膝 - 信頼度チェック
      if (body.knee.left && body.ankle.left && 
          body.knee.left.visibility > VISIBILITY_THRESHOLD && 
          body.ankle.left.visibility > VISIBILITY_THRESHOLD) {
        const k = body.knee.left;
        const a = body.ankle.left;
        const bone = humanoid.getRawBoneNode('leftLowerLeg' as any);
        if (bone) {
          const dy = (a.y - k.y) * 2;
          
          // 膝は基本的に前方にしか曲がらない
          bone.rotation.x = Math.max(0, dy - 1.0);
          bone.updateMatrix();
        }
      }
      
      // 右膝 - 信頼度チェック
      if (body.knee.right && body.ankle.right && 
          body.knee.right.visibility > VISIBILITY_THRESHOLD && 
          body.ankle.right.visibility > VISIBILITY_THRESHOLD) {
        const k = body.knee.right;
        const a = body.ankle.right;
        const bone = humanoid.getRawBoneNode('rightLowerLeg' as any);
        if (bone) {
          const dy = (a.y - k.y) * 2;
          
          bone.rotation.x = Math.max(0, dy - 1.0);
          bone.updateMatrix();
        }
      }
    }
  }

  private updateIdleAnimation(deltaTime: number) {
    if (this.useProceduralAvatar) {
      // プロシージャルアバターは独自のアイドルアニメーション持ってる
      return;
    }
    
    if (!this.vrm) return;

    this.idleTime += deltaTime;

    // 呼吸アニメーション
    const breathCycle = CONFIG.avatar.idle.breathingCycle;
    const breathPhase = (this.idleTime % breathCycle) / breathCycle;
    const breathValue = Math.sin(breathPhase * Math.PI * 2) * 
                        CONFIG.avatar.idle.breathingAmplitude;

    const chest = this.vrm.humanoid?.getRawBoneNode('chest');
    if (chest) {
      chest.position.y = breathValue;
    }

    // わずかな揺れ(川の流れのイメージ)
    const swayPhase = (this.idleTime * 0.3) % (Math.PI * 2);
    const swayValue = Math.sin(swayPhase) * CONFIG.avatar.idle.swayAmplitude;
    
    if (this.vrm.scene) {
      // Y軸0度(回転なし)を試す
      this.vrm.scene.rotation.set(0, 0, swayValue);
      
      // デバッグ: 1回だけログ出力
      if (!this.rotationLogged) {
        console.log('🔄 update()での回転:', {
          x: this.vrm.scene.rotation.x,
          y: this.vrm.scene.rotation.y,
          z: this.vrm.scene.rotation.z,
          yDegrees: (this.vrm.scene.rotation.y * 180 / Math.PI).toFixed(1) + '度'
        });
        this.rotationLogged = true;
      }
    }
  }

  private updateBlinking(deltaTime: number) {
    if (!this.vrm?.expressionManager) return;
    
    // ボディトラッキング中は自動まばたきをオフ（表情トラッキングを優先）
    if (this.hasBodyTracking) {
      return;
    }

    const proxy = this.vrm.expressionManager;

    if (this.isBlinking) {
      // まばたき中
      const elapsed = this.clock.getElapsedTime() - this.blinkStartTime;
      const duration = CONFIG.avatar.expression.blinkDuration;
      
      if (elapsed < duration) {
        // まばたきカーブ適用
        const t = elapsed / duration;
        const value = CONFIG.avatar.expression.blinkCurve(t);
        this.currentExpression.blink = value;
      } else {
        // まばたき終了
        this.isBlinking = false;
        this.currentExpression.blink = 0;
        
        // 次のまばたきタイミングを設定
        const { min, max } = CONFIG.avatar.expression.blinkInterval;
        this.nextBlinkTime = this.blinkTime + min + Math.random() * (max - min);
      }
    } else {
      // 次のまばたきまで待機
      this.blinkTime += deltaTime;
      
      if (this.blinkTime >= this.nextBlinkTime) {
        this.isBlinking = true;
        this.blinkStartTime = this.clock.getElapsedTime();
        this.blinkTime = 0;
      }
    }

    proxy.setValue('blink', this.currentExpression.blink);
  }

  // Smoothly interpolate bone rotation and clamp to sane ranges to avoid wild flips
  private smoothBoneRotation(bone: any, targetX: number, targetY: number, targetZ: number, smoothing: number) {
    // clamp targets to prevent extreme rotations
    const tx = THREE.MathUtils.clamp(targetX, -1.2, 1.2);
    const ty = THREE.MathUtils.clamp(targetY, -1.2, 1.2);
    const tz = THREE.MathUtils.clamp(targetZ, -1.2, 1.2);

    bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, tx, smoothing);
    bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, ty, smoothing);
    bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, tz, smoothing);
    bone.updateMatrix();
  }

  startAnimation() {
    const animate = () => {
      requestAnimationFrame(animate);

      const deltaTime = this.clock.getDelta();

      // プロシージャルアバターの更新
      if (this.useProceduralAvatar && this.proceduralAvatar) {
        this.proceduralAvatar.update(deltaTime);
      }

      // VRMの更新（ボディトラッキング時はスキップ）
      if (this.vrm && !this.hasBodyTracking) {
        this.vrm.update(deltaTime);
      }

      // アイドルアニメーション（VRMのみ）
      this.updateIdleAnimation(deltaTime);

      // 自動まばたき（VRMのみ）
      if (!this.useProceduralAvatar) {
        this.updateBlinking(deltaTime);
      }

      // レンダリング
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  private ema(prev: number, curr: number, alpha: number): number {
    return alpha * curr + (1 - alpha) * prev;
  }

  private onResize() {
    const container = document.getElementById('canvas-container')!;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // 公開API
  setExpression(name: string, value: number) {
    if (!this.vrm?.expressionManager) return;
    this.vrm.expressionManager.setValue(name, value);
  }

  async changeHDRI(preset: keyof typeof CONFIG.avatar.hdri.presets) {
    const path = CONFIG.avatar.hdri.presets[preset];
    await this.loadHDRI(path);
  }

  dispose() {
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
    }
    this.renderer.dispose();
  }
}
