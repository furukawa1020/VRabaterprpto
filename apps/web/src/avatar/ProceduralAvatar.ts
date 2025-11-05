/**
 * ProceduralAvatar.ts  
 * アニメクオリティの完全オリジナル白山テーマ3Dアバター
 * 細かい髪・顔・体・服を完全モデリング
 */

import * as THREE from 'three';
import { THEME } from '../config';

export class ProceduralAvatar {
  public group: THREE.Group;
  private skeleton: THREE.Group;
  
  // ボーン構造
  private rootBone: THREE.Bone;
  private spineBone: THREE.Bone;
  private chestBone: THREE.Bone;
  private neckBone: THREE.Bone;
  private headBone: THREE.Bone;
  private jawBone: THREE.Bone;
  
  // 表情パーツ
  private leftEyeGroup: THREE.Group;
  private rightEyeGroup: THREE.Group;
  private mouthGroup: THREE.Group;
  private leftEyebrow: THREE.Mesh;
  private rightEyebrow: THREE.Mesh;
  
  // 物理演算用
  private hairStrands: THREE.Object3D[] = [];
  
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'HakusanAvatarAnime';
    this.skeleton = new THREE.Group();
    
    // ボーン初期化
    this.rootBone = new THREE.Bone();
    this.spineBone = new THREE.Bone();
    this.chestBone = new THREE.Bone();
    this.neckBone = new THREE.Bone();
    this.headBone = new THREE.Bone();
    this.jawBone = new THREE.Bone();
    
    this.leftEyeGroup = new THREE.Group();
    this.rightEyeGroup = new THREE.Group();
    this.mouthGroup = new THREE.Group();
    this.leftEyebrow = new THREE.Mesh();
    this.rightEyebrow = new THREE.Mesh();
    
    this.setupSkeleton();
    this.createBody();
    this.createHead();
    this.createFace();
    this.createHair();
    this.createClothes();
    this.createAccessories();
  }
  
  private setupSkeleton() {
    this.rootBone.position.set(0, 0, 0);
    this.spineBone.position.set(0, 0.85, 0);
    this.chestBone.position.set(0, 0.2, 0);
    this.neckBone.position.set(0, 0.15, 0);
    this.headBone.position.set(0, 0.12, 0);
    this.jawBone.position.set(0, -0.05, 0.03);
    
    this.rootBone.add(this.spineBone);
    this.spineBone.add(this.chestBone);
    this.chestBone.add(this.neckBone);
    this.neckBone.add(this.headBone);
    this.headBone.add(this.jawBone);
    
    this.skeleton.add(this.rootBone);
    this.group.add(this.skeleton);
  }
  
  /**
   * 体の作成（アニメ体型）
   */
  private createBody() {
    // 胴体（細身のアニメ体型）
    const torsoShape = new THREE.Shape();
    torsoShape.moveTo(-0.12, 0);
    torsoShape.bezierCurveTo(-0.14, 0.1, -0.13, 0.2, -0.11, 0.25);
    torsoShape.lineTo(-0.08, 0.35);
    torsoShape.bezierCurveTo(-0.06, 0.37, 0.06, 0.37, 0.08, 0.35);
    torsoShape.lineTo(0.11, 0.25);
    torsoShape.bezierCurveTo(0.13, 0.2, 0.14, 0.1, 0.12, 0);
    torsoShape.lineTo(-0.12, 0);
    
    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 3,
    };
    
    const torsoGeometry = new THREE.ExtrudeGeometry(torsoShape, extrudeSettings);
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd5b5, // 肌色
      roughness: 0.7,
      metalness: 0.1,
    });
    
    const torso = new THREE.Mesh(torsoGeometry, skinMaterial);
    torso.position.set(0, 0.85, -0.05);
    torso.castShadow = true;
    this.spineBone.add(torso);
    
    // 首
    const neckGeometry = new THREE.CylinderGeometry(0.04, 0.045, 0.12, 16);
    const neck = new THREE.Mesh(neckGeometry, skinMaterial);
    neck.position.set(0, 1.26, 0);
    neck.castShadow = true;
    this.chestBone.add(neck);
    
    // 腕（細くて長い）
    this.createArm(-0.15, true);  // 左腕
    this.createArm(0.15, false);  // 右腕
    
    // 脚（スレンダー）
    this.createLeg(-0.08, true);  // 左脚
    this.createLeg(0.08, false);  // 右脚
  }
  
  private createArm(xOffset: number, isLeft: boolean) {
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd5b5,
      roughness: 0.7,
      metalness: 0.1,
    });
    
    // 上腕
    const upperArmGeo = new THREE.CapsuleGeometry(0.025, 0.18, 8, 16);
    const upperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
    upperArm.position.set(xOffset, 1.12, 0);
    upperArm.rotation.z = isLeft ? Math.PI * 0.15 : -Math.PI * 0.15;
    upperArm.castShadow = true;
    this.chestBone.add(upperArm);
    
    // 下腕
    const forearmGeo = new THREE.CapsuleGeometry(0.022, 0.16, 8, 16);
    const forearm = new THREE.Mesh(forearmGeo, skinMaterial);
    forearm.position.set(xOffset + (isLeft ? -0.03 : 0.03), 0.92, 0);
    forearm.rotation.z = isLeft ? Math.PI * 0.08 : -Math.PI * 0.08;
    forearm.castShadow = true;
    this.chestBone.add(forearm);
    
    // 手
    const handGeo = new THREE.SphereGeometry(0.03, 16, 16);
    handGeo.scale(1, 0.7, 0.6);
    const hand = new THREE.Mesh(handGeo, skinMaterial);
    hand.position.set(xOffset + (isLeft ? -0.05 : 0.05), 0.75, 0);
    hand.castShadow = true;
    this.chestBone.add(hand);
  }
  
  private createLeg(xOffset: number, _isLeft: boolean) {
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd5b5,
      roughness: 0.7,
      metalness: 0.1,
    });
    
    // 太もも
    const thighGeo = new THREE.CapsuleGeometry(0.04, 0.3, 12, 16);
    const thigh = new THREE.Mesh(thighGeo, skinMaterial);
    thigh.position.set(xOffset, 0.65, 0);
    thigh.castShadow = true;
    this.spineBone.add(thigh);
    
    // ふくらはぎ
    const calfGeo = new THREE.CapsuleGeometry(0.032, 0.28, 12, 16);
    const calf = new THREE.Mesh(calfGeo, skinMaterial);
    calf.position.set(xOffset, 0.3, 0);
    calf.castShadow = true;
    this.spineBone.add(calf);
    
    // 足
    const footGeo = new THREE.BoxGeometry(0.06, 0.03, 0.12);
    const foot = new THREE.Mesh(footGeo, skinMaterial);
    foot.position.set(xOffset, 0.02, 0.03);
    foot.castShadow = true;
    this.spineBone.add(foot);
  }
  
  /**
   * 頭部の作成（アニメ風の大きめの頭）
   */
  private createHead() {
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd5b5,
      roughness: 0.6,
      metalness: 0.05,
    });
    
    // 頭（少し縦長の楕円）
    const headGeometry = new THREE.SphereGeometry(0.11, 32, 32);
    headGeometry.scale(0.9, 1.1, 0.95);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.set(0, 1.45, 0);
    head.castShadow = true;
    this.headBone.add(head);
    
    // 顎
    const chinGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    chinGeometry.scale(1.2, 0.8, 1);
    const chin = new THREE.Mesh(chinGeometry, skinMaterial);
    chin.position.set(0, 1.36, 0.02);
    chin.castShadow = true;
    this.jawBone.add(chin);
    
    // 首との接続部分を滑らかに
    const neckBlendGeo = new THREE.SphereGeometry(0.045, 16, 16);
    neckBlendGeo.scale(1, 0.5, 1);
    const neckBlend = new THREE.Mesh(neckBlendGeo, skinMaterial);
    neckBlend.position.set(0, 1.32, 0);
    this.neckBone.add(neckBlend);
  }
  
  /**
   * 顔パーツの作成（アニメ風の大きな目）
   */
  private createFace() {
    // === 左目 ===
    this.leftEyeGroup.position.set(-0.045, 1.47, 0.09);
    this.headBone.add(this.leftEyeGroup);
    
    // 白目
    const scleraGeo = new THREE.SphereGeometry(0.025, 16, 16);
    scleraGeo.scale(1, 1.2, 0.5);
    const scleraMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
    });
    const leftSclera = new THREE.Mesh(scleraGeo, scleraMat);
    this.leftEyeGroup.add(leftSclera);
    
    // 虹彩（翠青色）
    const irisGeo = new THREE.CircleGeometry(0.018, 32);
    const irisMat = new THREE.MeshStandardMaterial({
      color: THEME.colors.riverCyan,
      emissive: THEME.colors.riverCyan,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
    });
    const leftIris = new THREE.Mesh(irisGeo, irisMat);
    leftIris.position.set(0, 0, 0.013);
    this.leftEyeGroup.add(leftIris);
    
    // 瞳孔
    const pupilGeo = new THREE.CircleGeometry(0.008, 24);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, 0.014);
    this.leftEyeGroup.add(leftPupil);
    
    // ハイライト（キラキラ）
    const highlightGeo = new THREE.CircleGeometry(0.006, 16);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    const leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    leftHighlight.position.set(0.005, 0.008, 0.015);
    this.leftEyeGroup.add(leftHighlight);
    
    // === 右目（左目を複製） ===
    this.rightEyeGroup.position.set(0.045, 1.47, 0.09);
    this.headBone.add(this.rightEyeGroup);
    
    const rightSclera = leftSclera.clone();
    this.rightEyeGroup.add(rightSclera);
    
    const rightIris = leftIris.clone();
    this.rightEyeGroup.add(rightIris);
    
    const rightPupil = leftPupil.clone();
    this.rightEyeGroup.add(rightPupil);
    
    const rightHighlight = leftHighlight.clone();
    rightHighlight.position.set(-0.005, 0.008, 0.015);
    this.rightEyeGroup.add(rightHighlight);
    
    // === 眉毛 ===
    const eyebrowCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.02, 0, 0),
      new THREE.Vector3(0, 0.005, 0),
      new THREE.Vector3(0.02, 0, 0)
    );
    
    const eyebrowGeo = new THREE.TubeGeometry(eyebrowCurve, 20, 0.003, 8, false);
    const eyebrowMat = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
    });
    
    this.leftEyebrow = new THREE.Mesh(eyebrowGeo, eyebrowMat);
    this.leftEyebrow.position.set(-0.045, 1.50, 0.10);
    this.headBone.add(this.leftEyebrow);
    
    this.rightEyebrow = new THREE.Mesh(eyebrowGeo, eyebrowMat.clone());
    this.rightEyebrow.position.set(0.045, 1.50, 0.10);
    this.headBone.add(this.rightEyebrow);
    
    // === 鼻（小さく控えめ） ===
    const noseGeo = new THREE.SphereGeometry(0.008, 8, 8);
    noseGeo.scale(0.8, 1, 0.6);
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0xffcca8,
      roughness: 0.7,
    });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 1.44, 0.105);
    this.headBone.add(nose);
    
    // === 口 ===
    this.mouthGroup.position.set(0, 1.39, 0.09);
    this.jawBone.add(this.mouthGroup);
    
    // 唇（笑顔のカーブ）
    const mouthCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.025, 0, 0),
      new THREE.Vector3(0, -0.01, 0),
      new THREE.Vector3(0.025, 0, 0)
    );
    
    const mouthGeo = new THREE.TubeGeometry(mouthCurve, 20, 0.004, 8, false);
    const mouthMat = new THREE.MeshStandardMaterial({
      color: 0xff6b81,
      roughness: 0.5,
      metalness: 0.1,
    });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouthGroup.add(mouth);
    
    // === 頬の赤み ===
    const cheekGeo = new THREE.CircleGeometry(0.018, 24);
    const cheekMat = new THREE.MeshBasicMaterial({
      color: 0xffb3c6,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.065, 1.43, 0.095);
    this.headBone.add(leftCheek);
    
    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat.clone());
    rightCheek.position.set(0.065, 1.43, 0.095);
    this.headBone.add(rightCheek);
    
    // === 耳 ===
    const earGeo = new THREE.SphereGeometry(0.02, 12, 12);
    earGeo.scale(0.6, 1, 0.4);
    const earMat = new THREE.MeshStandardMaterial({
      color: 0xffd5b5,
      roughness: 0.7,
    });
    
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.105, 1.45, 0.02);
    leftEar.rotation.z = -Math.PI * 0.2;
    this.headBone.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeo, earMat.clone());
    rightEar.position.set(0.105, 1.45, 0.02);
    rightEar.rotation.z = Math.PI * 0.2;
    this.headBone.add(rightEar);
  }
  
  /**
   * 髪の毛の作成（ロングヘア、物理演算風）
   */
  private createHair() {
    const hairMat = new THREE.MeshStandardMaterial({
      color: THEME.colors.riverCyan,
      roughness: 0.6,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });
    
    // === 前髪（複数の房） ===
    for (let i = -3; i <= 3; i++) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(i * 0.025, 1.55, 0.08),
        new THREE.Vector3(i * 0.03, 1.50, 0.11),
        new THREE.Vector3(i * 0.035, 1.42, 0.10)
      );
      
      const tubeGeo = new THREE.TubeGeometry(curve, 12, 0.012 - Math.abs(i) * 0.001, 8, false);
      const bangs = new THREE.Mesh(tubeGeo, hairMat);
      bangs.castShadow = true;
      this.headBone.add(bangs);
      this.hairStrands.push(bangs);
    }
    
    // === サイド（耳にかかる髪） ===
    const leftSideCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.08, 1.52, 0.05),
      new THREE.Vector3(-0.12, 1.45, 0.03),
      new THREE.Vector3(-0.13, 1.35, 0.02),
      new THREE.Vector3(-0.12, 1.25, 0.04)
    );
    
    const leftSideGeo = new THREE.TubeGeometry(leftSideCurve, 24, 0.020, 12, false);
    const leftSide = new THREE.Mesh(leftSideGeo, hairMat);
    leftSide.castShadow = true;
    this.headBone.add(leftSide);
    
    const rightSideCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.08, 1.52, 0.05),
      new THREE.Vector3(0.12, 1.45, 0.03),
      new THREE.Vector3(0.13, 1.35, 0.02),
      new THREE.Vector3(0.12, 1.25, 0.04)
    );
    
    const rightSideGeo = new THREE.TubeGeometry(rightSideCurve, 24, 0.020, 12, false);
    const rightSide = new THREE.Mesh(rightSideGeo, hairMat);
    rightSide.castShadow = true;
    this.headBone.add(rightSide);
    
    // === 後ろ髪（ロングヘア） ===
    for (let i = -2; i <= 2; i++) {
      const backCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(i * 0.04, 1.50, -0.08),
        new THREE.Vector3(i * 0.05, 1.35, -0.10),
        new THREE.Vector3(i * 0.055, 1.15, -0.08),
        new THREE.Vector3(i * 0.06, 0.95, -0.05)
      );
      
      const backGeo = new THREE.TubeGeometry(backCurve, 32, 0.018, 12, false);
      const backHair = new THREE.Mesh(backGeo, hairMat);
      backHair.castShadow = true;
      this.headBone.add(backHair);
      this.hairStrands.push(backHair);
    }
    
    // === 髪飾り（雪の結晶） ===
    const crystalGeo = new THREE.OctahedronGeometry(0.020, 1);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x99ccff,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9,
    });
    
    const crystal1 = new THREE.Mesh(crystalGeo, crystalMat);
    crystal1.position.set(0.08, 1.54, 0.06);
    crystal1.rotation.z = Math.PI / 6;
    this.headBone.add(crystal1);
    
    const crystal2 = new THREE.Mesh(crystalGeo, crystalMat.clone());
    crystal2.position.set(0.06, 1.56, 0.04);
    crystal2.rotation.z = -Math.PI / 4;
    crystal2.scale.setScalar(0.7);
    this.headBone.add(crystal2);
  }
  
  /**
   * 服の作成（かわいいワンピース）
   */
  private createClothes() {
    // === ワンピース（白と緑のグラデーション） ===
    const dressGeo = new THREE.CylinderGeometry(0.15, 0.22, 0.5, 24, 4, true);
    const dressMat = new THREE.MeshStandardMaterial({
      color: 0xf0f8f8,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    
    const dress = new THREE.Mesh(dressGeo, dressMat);
    dress.position.set(0, 0.95, 0);
    dress.castShadow = true;
    this.spineBone.add(dress);
    
    // === 袖 ===
    const sleeveGeo = new THREE.CylinderGeometry(0.028, 0.035, 0.12, 12);
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0xe8f5f5,
      roughness: 0.6,
    });
    
    const leftSleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    leftSleeve.position.set(-0.15, 1.15, 0);
    leftSleeve.castShadow = true;
    this.chestBone.add(leftSleeve);
    
    const rightSleeve = new THREE.Mesh(sleeveGeo, sleeveMat.clone());
    rightSleeve.position.set(0.15, 1.15, 0);
    rightSleeve.castShadow = true;
    this.chestBone.add(rightSleeve);
    
    // === リボン（胸元） ===
    const ribbonGeo = new THREE.TorusGeometry(0.025, 0.008, 8, 24);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: THEME.colors.riverCyan,
      roughness: 0.4,
      metalness: 0.4,
    });
    
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(0, 1.18, 0.08);
    ribbon.rotation.x = Math.PI / 2;
    this.chestBone.add(ribbon);
    
    // === スカート裾の装飾 ===
    const hemCount = 12;
    for (let i = 0; i < hemCount; i++) {
      const angle = (i / hemCount) * Math.PI * 2;
      const decorGeo = new THREE.SphereGeometry(0.008, 8, 8);
      const decorMat = new THREE.MeshStandardMaterial({
        color: THEME.colors.riverCyan,
        emissive: THEME.colors.riverCyan,
        emissiveIntensity: 0.3,
      });
      
      const decor = new THREE.Mesh(decorGeo, decorMat);
      const radius = 0.22;
      decor.position.set(
        Math.cos(angle) * radius,
        0.70,
        Math.sin(angle) * radius
      );
      this.spineBone.add(decor);
    }
  }
  
  /**
   * アクセサリー（白山モチーフ）
   */
  private createAccessories() {
    // === 雪のオーラパーティクル ===
    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.25 + Math.random() * 0.15;
      const height = 0.8 + Math.random() * 0.8;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.012,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    
    const particles = new THREE.Points(particleGeo, particleMat);
    particles.name = 'snowAura';
    this.group.add(particles);
  }
  
  /**
   * 表情の更新
   */
  public updateExpression(name: string, value: number) {
    switch (name) {
      case 'happy':
        // 目を細める
        this.leftEyeGroup.scale.y = 1 - value * 0.4;
        this.rightEyeGroup.scale.y = 1 - value * 0.4;
        // 眉を上げる
        this.leftEyebrow.position.y = 1.50 + value * 0.01;
        this.rightEyebrow.position.y = 1.50 + value * 0.01;
        // 口角を上げる
        this.mouthGroup.rotation.z = value * 0.3;
        break;
        
      case 'sad':
        // 眉を下げる
        this.leftEyebrow.position.y = 1.50 - value * 0.01;
        this.rightEyebrow.position.y = 1.50 - value * 0.01;
        this.leftEyebrow.rotation.z = value * 0.2;
        this.rightEyebrow.rotation.z = -value * 0.2;
        // 目を少し閉じる
        this.leftEyeGroup.scale.y = 1 - value * 0.2;
        this.rightEyeGroup.scale.y = 1 - value * 0.2;
        // 口角を下げる
        this.mouthGroup.rotation.z = -value * 0.3;
        break;
        
      case 'angry':
        // 眉を吊り上げる
        this.leftEyebrow.position.y = 1.50 - value * 0.01;
        this.rightEyebrow.position.y = 1.50 - value * 0.01;
        this.leftEyebrow.rotation.z = -value * 0.3;
        this.rightEyebrow.rotation.z = value * 0.3;
        break;
        
      case 'surprised':
        // 目を大きく開く
        this.leftEyeGroup.scale.setScalar(1 + value * 0.3);
        this.rightEyeGroup.scale.setScalar(1 + value * 0.3);
        // 眉を上げる
        this.leftEyebrow.position.y = 1.50 + value * 0.02;
        this.rightEyebrow.position.y = 1.50 + value * 0.02;
        // 口を開ける
        this.mouthGroup.scale.y = 1 + value * 0.8;
        break;
    }
  }
  
  /**
   * まばたき
   */
  public blink(value: number) {
    this.leftEyeGroup.scale.y = 1 - value * 0.95;
    this.rightEyeGroup.scale.y = 1 - value * 0.95;
  }
  
  /**
   * リップシンク
   */
  public setMouthOpen(value: number) {
    this.mouthGroup.scale.y = 1 + value * 0.6;
    this.jawBone.rotation.x = value * 0.15;
  }
  
  /**
   * 頭の回転
   */
  public setHeadRotation(x: number, y: number, z: number) {
    this.headBone.rotation.set(x, y, z);
  }
  
  /**
   * アニメーション更新
   */
  public update(deltaTime: number) {
    const time = Date.now() * 0.001;
    
    // 雪のパーティクルを回転
    const particles = this.group.getObjectByName('snowAura');
    if (particles) {
      particles.rotation.y += deltaTime * 0.2;
      
      // パーティクルの上下運動
      const positions = (particles as THREE.Points).geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + i) * 0.001;
        if (positions[i + 1] > 1.6) positions[i + 1] = 0.8;
        if (positions[i + 1] < 0.8) positions[i + 1] = 1.6;
      }
      (particles as THREE.Points).geometry.attributes.position.needsUpdate = true;
    }
    
    // 髪の揺れ（物理演算風）
    this.hairStrands.forEach((strand, index) => {
      const phase = time + index * 0.5;
      strand.rotation.z = Math.sin(phase * 0.8) * 0.03;
      strand.rotation.x = Math.cos(phase * 0.6) * 0.02;
    });
    
    // 髪飾りのキラキラ
    this.headBone.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (child.material.emissive && child.material.emissive.getHex() === 0x99ccff) {
          child.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.3;
          child.rotation.y += deltaTime * 2;
        }
      }
    });
    
    // 呼吸アニメーション
    const breathe = Math.sin(time * 0.8) * 0.008;
    this.chestBone.position.y = 0.2 + breathe;
    this.chestBone.scale.set(1, 1 + breathe * 0.5, 1);
  }
}
