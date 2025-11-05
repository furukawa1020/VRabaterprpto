/**
 * AvatarSystem - VRM制御・描画・アニメーションの統合システム
 */

import * as THREE from 'three';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CONFIG, THEME } from '../config';
import type { TrackingData } from '../tracking/types';

export class AvatarSystem {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private vrm: VRM | null = null;
  private clock = new THREE.Clock();
  
  // アニメーション状態
  private idleTime = 0;
  private blinkTimer = 0;
  private nextBlinkTime = 3.0;
  private isBlinking = false;
  private blinkStartTime = 0;
  
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
    this.scene.background = null; // 透過背景

    // カメラの初期化
    const container = document.getElementById('canvas-container')!;
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 20);
    this.camera.position.set(0, 1.3, 1.5);
    this.camera.lookAt(0, 1.2, 0);

    // レンダラーの初期化（PBR設定）
    this.renderer = new THREE.WebGLRenderer({
      antialias: CONFIG.avatar.rendering.antialias,
      alpha: CONFIG.avatar.rendering.alpha,
    });
    
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(CONFIG.avatar.rendering.pixelRatio);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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
    // キーライト（白山の雪を反射した柔らかい光）
    const keyLight = new THREE.DirectionalLight(THEME.colors.snowWhite, 1.2);
    keyLight.position.set(2, 3, 2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    // フィルライト（手取川の碧を連想させる）
    const fillLight = new THREE.DirectionalLight(THEME.colors.riverCyan, 0.4);
    fillLight.position.set(-2, 1, -1);
    this.scene.add(fillLight);

    // リムライト（玄武岩のシルエット強調）
    const rimLight = new THREE.DirectionalLight(THEME.colors.snowWhite, 0.6);
    rimLight.position.set(0, 1, -3);
    this.scene.add(rimLight);

    // アンビエントライト（全体の底上げ）
    const ambient = new THREE.AmbientLight(THEME.colors.woodBrown, 0.3);
    this.scene.add(ambient);
  }

  private async loadHDRI(path: string) {
    try {
      const loader = new RGBELoader();
      const texture = await loader.loadAsync(path);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      console.log('✅ HDRI環境マップ読み込み完了');
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

      // 新しいVRMをシーンに追加
      this.vrm = vrm;
      this.scene.add(vrm.scene);

      // 位置調整
      vrm.scene.position.set(
        CONFIG.avatar.position.x,
        CONFIG.avatar.position.y,
        CONFIG.avatar.position.z
      );
      vrm.scene.scale.setScalar(CONFIG.avatar.scale);

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
      throw error;
    }
  }

  updateFromTracking(data: TrackingData) {
    if (!this.vrm) return;

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

  private updateIdleAnimation(deltaTime: number) {
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

    // わずかな揺れ（川の流れのイメージ）
    const swayPhase = (this.idleTime * 0.3) % (Math.PI * 2);
    const swayValue = Math.sin(swayPhase) * CONFIG.avatar.idle.swayAmplitude;
    
    if (this.vrm.scene) {
      this.vrm.scene.rotation.z = swayValue;
    }
  }

  private updateBlinking(deltaTime: number) {
    if (!this.vrm?.expressionManager) return;

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
        this.nextBlinkTime = this.blinkTimer + min + Math.random() * (max - min);
      }
    } else {
      // 次のまばたきまで待機
      this.blinkTimer += deltaTime;
      
      if (this.blinkTimer >= this.nextBlinkTime) {
        this.isBlinking = true;
        this.blinkStartTime = this.clock.getElapsedTime();
        this.blinkTimer = 0;
      }
    }

    proxy.setValue('blink', this.currentExpression.blink);
  }

  startAnimation() {
    const animate = () => {
      requestAnimationFrame(animate);

      const deltaTime = this.clock.getDelta();

      // VRMの更新
      if (this.vrm) {
        this.vrm.update(deltaTime);
      }

      // アイドルアニメーション
      this.updateIdleAnimation(deltaTime);

      // 自動まばたき
      this.updateBlinking(deltaTime);

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
