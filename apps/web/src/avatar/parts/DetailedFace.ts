/**
 * DetailedFace.ts
 * 超高精度な顔モデリング
 * まつ毛1本1本、肌の毛穴、唇のシワまで作り込み
 */

import * as THREE from 'three';
import { THEME } from '../../config';

export class DetailedFace {
  public group: THREE.Group;
  
  constructor() {
    this.group = new THREE.Group();
    this.createDetailedFace();
  }
  
  private createDetailedFace() {
    // === 超高精度な顔の基礎 ===
    this.createSkinBase();
    this.createDetailedEyes();
    this.createEyelashes();
    this.createEyebrows();
    this.createNose();
    this.createLips();
    this.createEars();
    this.createFacialDetails();
  }
  
  /**
   * 肌ベース（毛穴・シワ付き）
   */
  private createSkinBase() {
    // 顔の基本形状（超高解像度）
    const faceGeo = new THREE.SphereGeometry(0.11, 128, 128);
    
    // 頂点をカスタマイズして自然な顔の形に
    const positions = faceGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // 顎を尖らせる
      if (y < 0) {
        const chinFactor = 1 - (y / 0.11) * 0.3;
        positions[i] *= chinFactor * 0.95;
        positions[i + 2] *= chinFactor * 0.9;
      }
      
      // 頬を膨らませる
      if (y > -0.02 && y < 0.04 && z > 0) {
        const cheekFactor = Math.abs(x) * 8;
        positions[i + 2] += cheekFactor * 0.015;
      }
      
      // 額を滑らかに
      if (y > 0.05) {
        positions[i] *= 0.92;
        positions[i + 2] *= 0.88;
      }
    }
    
    faceGeo.computeVertexNormals();
    
    // 肌のマテリアル（サブサーフェススキャッタリング風）
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffd5b5,
      roughness: 0.65,
      metalness: 0.02,
      flatShading: false,
    });
    
    // 肌のテクスチャ（毛穴を表現）
    const poreCanvas = document.createElement('canvas');
    poreCanvas.width = 512;
    poreCanvas.height = 512;
    const ctx = poreCanvas.getContext('2d')!;
    
    // ベース肌色
    ctx.fillStyle = '#ffd5b5';
    ctx.fillRect(0, 0, 512, 512);
    
    // 毛穴を描画（2000個）
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = 0.5 + Math.random() * 1;
      
      ctx.fillStyle = `rgba(200, 160, 120, ${0.1 + Math.random() * 0.15})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // そばかす（頬に）
    for (let i = 0; i < 50; i++) {
      const x = 180 + Math.random() * 150;
      const y = 220 + Math.random() * 80;
      const size = 0.8 + Math.random() * 1.2;
      
      ctx.fillStyle = `rgba(180, 140, 110, ${0.15 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const poreTexture = new THREE.CanvasTexture(poreCanvas);
    poreTexture.wrapS = THREE.RepeatWrapping;
    poreTexture.wrapT = THREE.RepeatWrapping;
    skinMat.map = poreTexture;
    
    const face = new THREE.Mesh(faceGeo, skinMat);
    face.position.set(0, 1.45, 0);
    face.castShadow = true;
    face.receiveShadow = true;
    this.group.add(face);
    
    // 顎の追加ディテール
    const chinGeo = new THREE.SphereGeometry(0.045, 64, 64);
    chinGeo.scale(1.15, 0.75, 0.95);
    const chin = new THREE.Mesh(chinGeo, skinMat);
    chin.position.set(0, 1.36, 0.025);
    chin.castShadow = true;
    this.group.add(chin);
  }
  
  /**
   * 超詳細な目（虹彩の繊維まで）
   */
  private createDetailedEyes() {
    for (let side = -1; side <= 1; side += 2) {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(side * 0.045, 1.47, 0.09);
      
      // === 眼球 ===
      const eyeballGeo = new THREE.SphereGeometry(0.025, 64, 64);
      const eyeballMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1,
      });
      const eyeball = new THREE.Mesh(eyeballGeo, eyeballMat);
      eyeGroup.add(eyeball);
      
      // === 虹彩（繊維状の模様） ===
      const irisCanvas = document.createElement('canvas');
      irisCanvas.width = 256;
      irisCanvas.height = 256;
      const irisCtx = irisCanvas.getContext('2d')!;
      
      // ベースカラー（翠青色）
      const gradient = irisCtx.createRadialGradient(128, 128, 30, 128, 128, 100);
      gradient.addColorStop(0, '#2a8f88');
      gradient.addColorStop(0.5, THEME.colors.riverCyan);
      gradient.addColorStop(0.8, '#15504a');
      gradient.addColorStop(1, '#0d3530');
      irisCtx.fillStyle = gradient;
      irisCtx.fillRect(0, 0, 256, 256);
      
      // 虹彩の繊維（放射状、200本）
      irisCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      irisCtx.lineWidth = 0.5;
      for (let i = 0; i < 200; i++) {
        const angle = (i / 200) * Math.PI * 2;
        const startRadius = 30 + Math.random() * 10;
        const endRadius = 90 + Math.random() * 10;
        
        irisCtx.beginPath();
        irisCtx.moveTo(
          128 + Math.cos(angle) * startRadius,
          128 + Math.sin(angle) * startRadius
        );
        
        // 波打つ繊維
        const segments = 8;
        for (let j = 1; j <= segments; j++) {
          const t = j / segments;
          const r = startRadius + (endRadius - startRadius) * t;
          const wobble = Math.sin(t * Math.PI * 4) * 2;
          const a = angle + wobble * 0.02;
          
          irisCtx.lineTo(
            128 + Math.cos(a) * r,
            128 + Math.sin(a) * r
          );
        }
        irisCtx.stroke();
      }
      
      // 虹彩の斑点
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 40 + Math.random() * 50;
        const x = 128 + Math.cos(angle) * radius;
        const y = 128 + Math.sin(angle) * radius;
        
        irisCtx.fillStyle = `rgba(${50 + Math.random() * 100}, ${150 + Math.random() * 50}, ${130 + Math.random() * 50}, ${0.2 + Math.random() * 0.3})`;
        irisCtx.beginPath();
        irisCtx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
        irisCtx.fill();
      }
      
      const irisTexture = new THREE.CanvasTexture(irisCanvas);
      const irisGeo = new THREE.CircleGeometry(0.018, 64);
      const irisMat = new THREE.MeshStandardMaterial({
        map: irisTexture,
        emissive: THEME.colors.riverCyan,
        emissiveIntensity: 0.3,
        roughness: 0.3,
        metalness: 0.6,
      });
      
      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.z = 0.013;
      eyeGroup.add(iris);
      
      // === 瞳孔（グラデーション） ===
      const pupilCanvas = document.createElement('canvas');
      pupilCanvas.width = 128;
      pupilCanvas.height = 128;
      const pupilCtx = pupilCanvas.getContext('2d')!;
      
      const pupilGradient = pupilCtx.createRadialGradient(64, 64, 0, 64, 64, 50);
      pupilGradient.addColorStop(0, '#000000');
      pupilGradient.addColorStop(0.8, '#0a0a0a');
      pupilGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      pupilCtx.fillStyle = pupilGradient;
      pupilCtx.fillRect(0, 0, 128, 128);
      
      const pupilTexture = new THREE.CanvasTexture(pupilCanvas);
      const pupilGeo = new THREE.CircleGeometry(0.008, 32);
      const pupilMat = new THREE.MeshBasicMaterial({
        map: pupilTexture,
        transparent: true,
      });
      
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.z = 0.0145;
      eyeGroup.add(pupil);
      
      // === ハイライト（複数） ===
      // メインハイライト
      const highlight1Geo = new THREE.CircleGeometry(0.0055, 24);
      const highlight1Mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
      });
      const highlight1 = new THREE.Mesh(highlight1Geo, highlight1Mat);
      highlight1.position.set(side * 0.004, 0.007, 0.015);
      eyeGroup.add(highlight1);
      
      // サブハイライト
      const highlight2Geo = new THREE.CircleGeometry(0.003, 16);
      const highlight2Mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      });
      const highlight2 = new THREE.Mesh(highlight2Geo, highlight2Mat);
      highlight2.position.set(side * 0.008, 0.003, 0.0148);
      eyeGroup.add(highlight2);
      
      // === 角膜の反射（環境光） ===
      const corneaGeo = new THREE.SphereGeometry(0.026, 32, 32);
      const corneaMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        roughness: 0.1,
        metalness: 0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });
      const cornea = new THREE.Mesh(corneaGeo, corneaMat);
      eyeGroup.add(cornea);
      
      this.group.add(eyeGroup);
    }
  }
  
  /**
   * まつ毛（上下、1本1本）
   */
  private createEyelashes() {
    for (let side = -1; side <= 1; side += 2) {
      const xPos = side * 0.045;
      
      // === 上まつ毛（各目20本） ===
      for (let i = 0; i < 20; i++) {
        const t = i / 19;
        const angle = (t - 0.5) * Math.PI * 0.6;
        const baseX = xPos + Math.sin(angle) * 0.022;
        const baseY = 1.485 + Math.cos(angle) * 0.008;
        const baseZ = 0.108;
        
        // まつ毛のカーブ
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(baseX, baseY, baseZ),
          new THREE.Vector3(
            baseX + Math.sin(angle) * 0.008,
            baseY + 0.008,
            baseZ + 0.012
          ),
          new THREE.Vector3(
            baseX + Math.sin(angle) * 0.012,
            baseY + 0.012,
            baseZ + 0.015
          )
        );
        
        const lashGeo = new THREE.TubeGeometry(curve, 8, 0.0002, 3, false);
        const lashMat = new THREE.MeshStandardMaterial({
          color: 0x1a1a1a,
          roughness: 0.9,
        });
        
        const lash = new THREE.Mesh(lashGeo, lashMat);
        lash.castShadow = true;
        this.group.add(lash);
      }
      
      // === 下まつ毛（各目15本、短め） ===
      for (let i = 0; i < 15; i++) {
        const t = i / 14;
        const angle = (t - 0.5) * Math.PI * 0.5;
        const baseX = xPos + Math.sin(angle) * 0.020;
        const baseY = 1.455 - Math.cos(angle) * 0.006;
        const baseZ = 0.106;
        
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(baseX, baseY, baseZ),
          new THREE.Vector3(
            baseX + Math.sin(angle) * 0.004,
            baseY - 0.004,
            baseZ + 0.006
          ),
          new THREE.Vector3(
            baseX + Math.sin(angle) * 0.006,
            baseY - 0.006,
            baseZ + 0.008
          )
        );
        
        const lashGeo = new THREE.TubeGeometry(curve, 6, 0.00015, 3, false);
        const lashMat = new THREE.MeshStandardMaterial({
          color: 0x2a2a2a,
          roughness: 0.9,
        });
        
        const lash = new THREE.Mesh(lashGeo, lashMat);
        lash.castShadow = true;
        this.group.add(lash);
      }
    }
  }
  
  /**
   * 眉毛（毛を1本1本）
   */
  private createEyebrows() {
    for (let side = -1; side <= 1; side += 2) {
      const xPos = side * 0.045;
      
      // 眉毛ベースカーブ
      const baseCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(xPos - side * 0.018, 1.500, 0.10),
        new THREE.Vector3(xPos, 1.505, 0.102),
        new THREE.Vector3(xPos + side * 0.018, 1.498, 0.098)
      );
      
      // 眉毛の毛を80本生やす
      for (let i = 0; i < 80; i++) {
        const t = i / 79;
        const basePoint = baseCurve.getPoint(t);
        
        // ランダムな角度で毛を生やす
        const hairAngle = (Math.random() - 0.5) * 0.4;
        const hairLength = 0.003 + Math.random() * 0.002;
        
        const hairCurve = new THREE.LineCurve3(
          basePoint,
          new THREE.Vector3(
            basePoint.x + Math.sin(hairAngle) * hairLength,
            basePoint.y + hairLength * 0.8,
            basePoint.z + Math.cos(hairAngle) * hairLength * 0.3
          )
        );
        
        const hairGeo = new THREE.TubeGeometry(hairCurve, 2, 0.0003, 3, false);
        const hairMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(0.08, 0.4, 0.25 + Math.random() * 0.1),
          roughness: 0.85,
        });
        
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.castShadow = true;
        this.group.add(hair);
      }
    }
  }
  
  /**
   * 鼻（鼻筋・鼻翼・鼻孔まで詳細に）
   */
  private createNose() {
    const skinColor = 0xffd5b5;
    
    // 鼻梁（鼻筋）
    const bridgeGeo = new THREE.BoxGeometry(0.012, 0.035, 0.018, 4, 8, 4);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.7,
    });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(0, 1.455, 0.105);
    this.group.add(bridge);
    
    // 鼻先
    const tipGeo = new THREE.SphereGeometry(0.008, 32, 32);
    tipGeo.scale(1, 1.2, 0.8);
    const tip = new THREE.Mesh(tipGeo, bridgeMat);
    tip.position.set(0, 1.435, 0.112);
    this.group.add(tip);
    
    // 鼻翼（左右）
    for (let side = -1; side <= 1; side += 2) {
      const wingGeo = new THREE.SphereGeometry(0.010, 24, 24);
      wingGeo.scale(0.7, 0.6, 0.5);
      const wing = new THREE.Mesh(wingGeo, bridgeMat);
      wing.position.set(side * 0.012, 1.432, 0.108);
      wing.rotation.z = side * Math.PI * 0.15;
      this.group.add(wing);
      
      // 鼻孔
      const nostrilGeo = new THREE.SphereGeometry(0.003, 16, 16);
      const nostrilMat = new THREE.MeshStandardMaterial({
        color: 0x6a4a3a,
        roughness: 0.9,
      });
      const nostril = new THREE.Mesh(nostrilGeo, nostrilMat);
      nostril.position.set(side * 0.008, 1.430, 0.110);
      nostril.scale.set(1, 0.6, 0.4);
      this.group.add(nostril);
    }
  }
  
  /**
   * 唇（上唇・下唇、細かいシワ付き）
   */
  private createLips() {
    // キャンバスで唇のテクスチャを生成
    const lipCanvas = document.createElement('canvas');
    lipCanvas.width = 256;
    lipCanvas.height = 128;
    const ctx = lipCanvas.getContext('2d')!;
    
    // ベース色
    const gradient = ctx.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, '#ff8ba3');
    gradient.addColorStop(0.5, '#ff6b81');
    gradient.addColorStop(1, '#ff5070');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 128);
    
    // 唇のシワ（縦線、100本）
    ctx.strokeStyle = 'rgba(200, 80, 100, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 100; i++) {
      const x = (i / 100) * 256;
      const wobble = Math.sin(i * 0.5) * 2;
      
      ctx.beginPath();
      ctx.moveTo(x + wobble, 0);
      ctx.lineTo(x + wobble + Math.random() * 2 - 1, 128);
      ctx.stroke();
    }
    
    // 光沢
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 128;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const lipTexture = new THREE.CanvasTexture(lipCanvas);
    
    // 上唇
    const upperLipCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.025, 1.395, 0.092),
      new THREE.Vector3(-0.010, 1.398, 0.095),
      new THREE.Vector3(0.010, 1.398, 0.095),
      new THREE.Vector3(0.025, 1.395, 0.092)
    );
    
    const upperLipGeo = new THREE.TubeGeometry(upperLipCurve, 32, 0.0045, 16, false);
    const lipMat = new THREE.MeshStandardMaterial({
      map: lipTexture,
      color: 0xff6b81,
      roughness: 0.4,
      metalness: 0.2,
    });
    
    const upperLip = new THREE.Mesh(upperLipGeo, lipMat);
    upperLip.castShadow = true;
    this.group.add(upperLip);
    
    // 下唇
    const lowerLipCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.023, 1.385, 0.091),
      new THREE.Vector3(-0.008, 1.382, 0.094),
      new THREE.Vector3(0.008, 1.382, 0.094),
      new THREE.Vector3(0.023, 1.385, 0.091)
    );
    
    const lowerLipGeo = new THREE.TubeGeometry(lowerLipCurve, 32, 0.005, 16, false);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat.clone());
    lowerLip.castShadow = true;
    this.group.add(lowerLip);
    
    // 口角
    for (let side = -1; side <= 1; side += 2) {
      const cornerGeo = new THREE.SphereGeometry(0.003, 16, 16);
      const corner = new THREE.Mesh(cornerGeo, lipMat.clone());
      corner.position.set(side * 0.025, 1.390, 0.092);
      this.group.add(corner);
    }
  }
  
  /**
   * 耳（耳たぶ・耳輪・対輪まで）
   */
  private createEars() {
    for (let side = -1; side <= 1; side += 2) {
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.105, 1.45, 0.02);
      earGroup.rotation.z = side * Math.PI * 0.2;
      earGroup.rotation.y = side * Math.PI * 0.15;
      
      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xffd5b5,
        roughness: 0.7,
      });
      
      // 外耳（耳介）
      const outerEarGeo = new THREE.SphereGeometry(0.020, 32, 32);
      outerEarGeo.scale(0.6, 1, 0.4);
      const outerEar = new THREE.Mesh(outerEarGeo, skinMat);
      earGroup.add(outerEar);
      
      // 耳たぶ
      const lobeGeo = new THREE.SphereGeometry(0.010, 24, 24);
      lobeGeo.scale(0.8, 0.9, 0.7);
      const lobe = new THREE.Mesh(lobeGeo, skinMat);
      lobe.position.set(0, -0.015, 0.002);
      earGroup.add(lobe);
      
      // 耳輪（外側のカーブ）
      const helixCurve = new THREE.EllipseCurve(
        0, 0,
        0.011, 0.018,
        0, Math.PI * 2,
        false, 0
      );
      
      const helixPoints = helixCurve.getPoints(50);
      const helixGeo = new THREE.BufferGeometry().setFromPoints(
        helixPoints.map(p => new THREE.Vector3(p.x, p.y, 0.003))
      );
      
      const helixMat = new THREE.LineBasicMaterial({
        color: 0xecc5a5,
        linewidth: 2,
      });
      const helix = new THREE.Line(helixGeo, helixMat);
      earGroup.add(helix);
      
      // 対輪（内側のカーブ）
      const anthelixCurve = new THREE.EllipseCurve(
        0, 0.002,
        0.007, 0.014,
        0, Math.PI * 2,
        false, 0
      );
      
      const anthelixPoints = anthelixCurve.getPoints(40);
      const anthelixGeo = new THREE.BufferGeometry().setFromPoints(
        anthelixPoints.map(p => new THREE.Vector3(p.x, p.y, 0.004))
      );
      
      const antihelix = new THREE.Line(anthelixGeo, helixMat);
      earGroup.add(antihelix);
      
      this.group.add(earGroup);
    }
  }
  
  /**
   * 顔の細部（頬の赤み・法令線・産毛）
   */
  private createFacialDetails() {
    // === 頬の赤み（グラデーション） ===
    for (let side = -1; side <= 1; side += 2) {
      const blushCanvas = document.createElement('canvas');
      blushCanvas.width = 128;
      blushCanvas.height = 128;
      const ctx = blushCanvas.getContext('2d')!;
      
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
      gradient.addColorStop(0, 'rgba(255, 150, 180, 0.5)');
      gradient.addColorStop(0.6, 'rgba(255, 180, 200, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 200, 220, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      
      const blushTexture = new THREE.CanvasTexture(blushCanvas);
      const blushGeo = new THREE.CircleGeometry(0.018, 32);
      const blushMat = new THREE.MeshBasicMaterial({
        map: blushTexture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      
      const blush = new THREE.Mesh(blushGeo, blushMat);
      blush.position.set(side * 0.065, 1.43, 0.096);
      this.group.add(blush);
    }
    
    // === 産毛（顔全体に500本） ===
    for (let i = 0; i < 500; i++) {
      // ランダムな位置（顔の範囲内）
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() * 0.6 + 0.2) * Math.PI;
      const radius = 0.11;
      
      const x = radius * Math.sin(phi) * Math.cos(theta) * 0.9;
      const y = 1.45 + radius * Math.cos(phi);
      const z = 0.05 + radius * Math.sin(phi) * Math.sin(theta) * 0.5;
      
      // 産毛の方向（外向き）
      const hairLength = 0.002 + Math.random() * 0.001;
      const hairCurve = new THREE.LineCurve3(
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(
          x * 1.1,
          y + hairLength * 0.3,
          z + hairLength * 0.5
        )
      );
      
      const hairGeo = new THREE.TubeGeometry(hairCurve, 2, 0.00008, 3, false);
      const hairMat = new THREE.MeshStandardMaterial({
        color: 0xe8d4c0,
        roughness: 0.9,
        transparent: true,
        opacity: 0.6,
      });
      
      const hair = new THREE.Mesh(hairGeo, hairMat);
      this.group.add(hair);
    }
  }
}
