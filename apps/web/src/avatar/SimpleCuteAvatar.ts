/**
 * SimpleCuteAvatar.ts
 * シンプルでかわいい親しみやすいアバター
 * - 大きな目
 - 丸い顔
 * - ふんわり髪
 * - 首あり
 * - アニメ風
 */

import * as THREE from 'three';

export class SimpleCuteAvatar {
  public group: THREE.Group;
  private blinkTimer = 0;
  private leftEye!: THREE.Mesh;
  private rightEye!: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();
    
    // 首を作成
    this.createNeck();
    
    // 頭を作成
    this.createHead();
    
    // 目を作成(大きくてかわいい)
    this.createEyes();
    
    // 口を作成
    this.createMouth();
    
    // 髪を作成(ふんわり)
    this.createHair();
    
    // 体を作成
    this.createBody();
    
    // うぐいすを追加
    this.createUguisu();
  }

  private createNeck() {
    const neckGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 16);
    const neckMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDBB3, // 肌色
      roughness: 0.7,
      metalness: 0.0,
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.set(0, 0.525, 0);
    this.group.add(neck);
  }

  private createHead() {
    // 丸い頭
    const headGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDBB3, // 肌色
      roughness: 0.6,
      metalness: 0.0,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.65, 0);
    head.scale.set(1, 1.1, 0.95); // 少し縦長に
    this.group.add(head);
  }

  private createEyes() {
    // 左目(もっと大きく!)
    const eyeGeometry = new THREE.SphereGeometry(0.045, 16, 16); // 0.035 → 0.045に拡大!
    
    // 白目
    const whiteEyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.3,
      metalness: 0.1,
    });
    
    const leftWhite = new THREE.Mesh(eyeGeometry, whiteEyeMaterial);
    leftWhite.position.set(-0.055, 0.67, 0.13); // 少し外側に
    this.group.add(leftWhite);
    
    const rightWhite = new THREE.Mesh(eyeGeometry, whiteEyeMaterial);
    rightWhite.position.set(0.055, 0.67, 0.13); // 少し外側に
    this.group.add(rightWhite);
    
    // 瞳(大きくてキラキラ✨)
    const pupilGeometry = new THREE.SphereGeometry(0.032, 16, 16); // 0.025 → 0.032に拡大!
    const pupilMaterial = new THREE.MeshStandardMaterial({
      color: 0x1E6F68, // 翠青色
      roughness: 0.1, // もっとツヤツヤに
      metalness: 0.4, // キラキラ感UP
      emissive: 0x1E6F68,
      emissiveIntensity: 0.5, // 発光強化
    });
    
    this.leftEye = new THREE.Mesh(pupilGeometry, pupilMaterial);
    this.leftEye.position.set(-0.055, 0.67, 0.145);
    this.group.add(this.leftEye);
    
    this.rightEye = new THREE.Mesh(pupilGeometry, pupilMaterial);
    this.rightEye.position.set(0.055, 0.67, 0.145);
    this.group.add(this.rightEye);
    
    // ハイライト(もっと大きく明るく✨)
    const highlightGeometry = new THREE.SphereGeometry(0.012, 8, 8); // 0.008 → 0.012
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.9,
    });
    
    const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    leftHighlight.position.set(-0.045, 0.685, 0.16);
    this.group.add(leftHighlight);
    
    const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    rightHighlight.position.set(0.065, 0.685, 0.16);
    this.group.add(rightHighlight);
    
    // 二重ハイライト(VTuber感!)
    const smallHighlightGeo = new THREE.SphereGeometry(0.006, 8, 8);
    const leftHighlight2 = new THREE.Mesh(smallHighlightGeo, highlightMaterial);
    leftHighlight2.position.set(-0.06, 0.66, 0.16);
    this.group.add(leftHighlight2);
    
    const rightHighlight2 = new THREE.Mesh(smallHighlightGeo, highlightMaterial);
    rightHighlight2.position.set(0.05, 0.66, 0.16);
    this.group.add(rightHighlight2);
  }

  private createMouth() {
    // かわいい笑顔の口
    const mouthCurve = new THREE.EllipseCurve(
      0, 0,
      0.04, 0.02,
      Math.PI * 0.2, Math.PI * 0.8,
      false,
      0
    );
    
    const mouthPoints = mouthCurve.getPoints(20);
    const mouthGeometry = new THREE.BufferGeometry().setFromPoints(mouthPoints);
    const mouthMaterial = new THREE.LineBasicMaterial({
      color: 0xFF6B8A,
      linewidth: 2,
    });
    
    const mouth = new THREE.Line(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 0.6, 0.14);
    mouth.rotation.x = Math.PI / 2;
    this.group.add(mouth);
  }

  private createHair() {
    // 前髪(ふんわり)
    const bangGeometry = new THREE.SphereGeometry(0.17, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x2E2B2B, // 玄岩(黒髪)
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const bangs = new THREE.Mesh(bangGeometry, hairMaterial);
    bangs.position.set(0, 0.7, 0.02);
    this.group.add(bangs);
    
    // 後ろ髪(ロング)
    const backHairGeometry = new THREE.SphereGeometry(0.16, 16, 16, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.8);
    const backHair = new THREE.Mesh(backHairGeometry, hairMaterial);
    backHair.position.set(0, 0.65, -0.05);
    this.group.add(backHair);
    
    // サイドの髪
    const sideHairGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.4, 8);
    
    const leftSideHair = new THREE.Mesh(sideHairGeometry, hairMaterial);
    leftSideHair.position.set(-0.13, 0.5, 0);
    leftSideHair.rotation.z = Math.PI * 0.1;
    this.group.add(leftSideHair);
    
    const rightSideHair = new THREE.Mesh(sideHairGeometry, hairMaterial);
    rightSideHair.position.set(0.13, 0.5, 0);
    rightSideHair.rotation.z = -Math.PI * 0.1;
    this.group.add(rightSideHair);
    
    // 雪の結晶ヘアピン
    const snowflakeGeometry = new THREE.OctahedronGeometry(0.03, 0);
    const snowflakeMaterial = new THREE.MeshStandardMaterial({
      color: 0xF7F7F7, // 雪白
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0xF7F7F7,
      emissiveIntensity: 0.3,
    });
    
    const snowflake = new THREE.Mesh(snowflakeGeometry, snowflakeMaterial);
    snowflake.position.set(0.1, 0.75, 0.08);
    this.group.add(snowflake);
  }

  private createBody() {
    // 胴体
    const bodyGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.35, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xF7F7F7, // 白いワンピース
      roughness: 0.8,
      metalness: 0.0,
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.275, 0);
    this.group.add(body);
    
    // 腕
    const armGeometry = new THREE.CylinderGeometry(0.03, 0.035, 0.25, 8);
    
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.15, 0.35, 0);
    leftArm.rotation.z = Math.PI * 0.15;
    this.group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.15, 0.35, 0);
    rightArm.rotation.z = -Math.PI * 0.15;
    this.group.add(rightArm);
    
    // リボン(胸元)
    const ribbonGeometry = new THREE.TorusGeometry(0.04, 0.01, 8, 16);
    const ribbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x1E6F68, // 翠青
      roughness: 0.3,
      metalness: 0.2,
    });
    
    const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
    ribbon.position.set(0, 0.42, 0.12);
    this.group.add(ribbon);
  }

  private createUguisu() {
    // うぐいす(肩に乗せる)
    const uguisuBody = new THREE.SphereGeometry(0.035, 16, 16);
    const uguisuMaterial = new THREE.MeshStandardMaterial({
      color: 0x928C36, // うぐいす色
      roughness: 0.7,
      metalness: 0.1,
    });
    
    const uguisu = new THREE.Mesh(uguisuBody, uguisuMaterial);
    uguisu.position.set(0.12, 0.5, 0.08);
    uguisu.scale.set(1, 0.9, 1.1);
    this.group.add(uguisu);
    
    // くちばし
    const beakGeometry = new THREE.ConeGeometry(0.008, 0.02, 8);
    const beakMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFA500,
      roughness: 0.5,
    });
    
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.position.set(0.12, 0.5, 0.12);
    beak.rotation.x = Math.PI / 2;
    this.group.add(beak);
    
    // 目
    const eyeGeometry = new THREE.SphereGeometry(0.006, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.11, 0.51, 0.105);
    this.group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.13, 0.51, 0.105);
    this.group.add(rightEye);
  }

  public update(deltaTime: number) {
    // まばたき
    this.blinkTimer += deltaTime;
    
    if (this.blinkTimer > 3.0) {
      this.blink();
      this.blinkTimer = 0;
    }
    
    // ふわふわ揺れる(かわいい動き)
    const time = Date.now() * 0.001;
    this.group.position.y = Math.sin(time * 2) * 0.01;
    this.group.rotation.z = Math.sin(time * 1.5) * 0.02;
  }

  private blink() {
    // 目を閉じる
    this.leftEye.scale.y = 0.1;
    this.rightEye.scale.y = 0.1;
    
    // 0.15秒後に開く
    setTimeout(() => {
      this.leftEye.scale.y = 1;
      this.rightEye.scale.y = 1;
    }, 150);
  }

  public dispose() {
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }
}
