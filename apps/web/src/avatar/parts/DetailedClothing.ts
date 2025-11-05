/**
 * DetailedClothing.ts
 * 服の布地の織りまで表現
 * ワンピース、袖、リボン、レース、ボタンなど細部まで
 */

import * as THREE from 'three';
import { THEME } from '../../config';

export class DetailedClothing {
  public group: THREE.Group;
  
  constructor() {
    this.group = new THREE.Group();
    this.createDetailedClothing();
  }
  
  private createDetailedClothing() {
    this.createDress();
    this.createSleeves();
    this.createCollar();
    this.createRibbon();
    this.createLaceDetails();
    this.createButtons();
    this.createSkirtRuffles();
  }
  
  /**
   * ワンピース本体（布の織り目付き）
   */
  private createDress() {
    // === ワンピースのメインボディ ===
    // 高解像度のシリンダー
    const dressGeo = new THREE.CylinderGeometry(0.15, 0.24, 0.52, 64, 32, true);
    
    // 頂点を調整して自然な形に
    const positions = dressGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // ウエストを細く
      if (y > 0.15 && y < 0.25) {
        const waistFactor = 0.88 - (y - 0.15) * 0.1;
        positions[i] *= waistFactor;
        positions[i + 2] *= waistFactor;
      }
      
      // 胸元を膨らませる
      if (y > 0.20 && y < 0.26 && z > 0) {
        const bustFactor = 1.08;
        positions[i + 2] *= bustFactor;
      }
      
      // スカートを広げる（裾に向かって）
      if (y < 0) {
        const flare = 1 + Math.abs(y) * 0.3;
        positions[i] *= flare;
        positions[i + 2] *= flare;
      }
    }
    
    dressGeo.computeVertexNormals();
    
    // === 布地のテクスチャ（織り目） ===
    const fabricCanvas = document.createElement('canvas');
    fabricCanvas.width = 1024;
    fabricCanvas.height = 1024;
    const ctx = fabricCanvas.getContext('2d')!;
    
    // ベースカラー（白に近いクリーム色）
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#f8f8f8');
    gradient.addColorStop(1, '#f0f0f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // 織り目のパターン（縦糸と横糸）
    // 縦糸
    ctx.strokeStyle = 'rgba(240, 240, 240, 0.5)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 1024; i += 2) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();
    }
    
    // 横糸
    for (let i = 0; i < 1024; i += 2) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }
    
    // 布の微細なシワ（500個）
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const length = 10 + Math.random() * 30;
      const angle = Math.random() * Math.PI * 2;
      
      ctx.strokeStyle = `rgba(220, 220, 220, ${0.1 + Math.random() * 0.2})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x + Math.cos(angle) * length * 0.5,
        y + Math.sin(angle) * length * 0.5 + (Math.random() - 0.5) * 5,
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length
      );
      ctx.stroke();
    }
    
    // 光沢（上部に集中）
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 300;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const fabricTexture = new THREE.CanvasTexture(fabricCanvas);
    fabricTexture.wrapS = THREE.RepeatWrapping;
    fabricTexture.wrapT = THREE.RepeatWrapping;
    fabricTexture.repeat.set(2, 2);
    
    // === ノーマルマップ（凹凸感） ===
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 512;
    normalCanvas.height = 512;
    const normalCtx = normalCanvas.getContext('2d')!;
    
    normalCtx.fillStyle = '#8080ff'; // 法線の中央値
    normalCtx.fillRect(0, 0, 512, 512);
    
    // 織り目の凹凸
    for (let i = 0; i < 512; i += 2) {
      normalCtx.strokeStyle = '#9090ff';
      normalCtx.lineWidth = 1;
      normalCtx.beginPath();
      normalCtx.moveTo(i, 0);
      normalCtx.lineTo(i, 512);
      normalCtx.stroke();
    }
    
    const normalTexture = new THREE.CanvasTexture(normalCanvas);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.wrapT = THREE.RepeatWrapping;
    normalTexture.repeat.set(4, 4);
    
    const dressMat = new THREE.MeshStandardMaterial({
      map: fabricTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.3, 0.3),
      color: 0xf5f8f8,
      roughness: 0.75,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });
    
    const dress = new THREE.Mesh(dressGeo, dressMat);
    dress.position.set(0, 0.95, 0);
    dress.castShadow = true;
    dress.receiveShadow = true;
    this.group.add(dress);
    
    // === ウエストベルト（翠青色） ===
    const beltGeo = new THREE.TorusGeometry(0.13, 0.008, 16, 64);
    const beltMat = new THREE.MeshStandardMaterial({
      color: THEME.colors.riverCyan,
      roughness: 0.5,
      metalness: 0.3,
    });
    
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 1.15, 0);
    belt.rotation.x = Math.PI / 2;
    belt.castShadow = true;
    this.group.add(belt);
  }
  
  /**
   * 袖（ふわふわ、ギャザー付き）
   */
  private createSleeves() {
    for (let side = -1; side <= 1; side += 2) {
      const sleeveGroup = new THREE.Group();
      sleeveGroup.position.set(side * 0.15, 1.15, 0);
      
      // === メインの袖 ===
      const sleeveGeo = new THREE.CylinderGeometry(0.032, 0.040, 0.14, 32, 16, true);
      
      // ギャザーを追加（波打たせる）
      const positions = sleeveGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        const angle = Math.atan2(z, x);
        const gatherWave = Math.sin(angle * 8) * 0.003;
        
        positions[i] += gatherWave * Math.cos(angle);
        positions[i + 2] += gatherWave * Math.sin(angle);
        
        // 裾を広げる
        if (y < -0.03) {
          const flare = 1 + Math.abs(y + 0.03) * 0.3;
          positions[i] *= flare;
          positions[i + 2] *= flare;
        }
      }
      
      sleeveGeo.computeVertexNormals();
      
      const sleeveMat = new THREE.MeshStandardMaterial({
        color: 0xfafafa,
        roughness: 0.7,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      
      const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
      sleeve.castShadow = true;
      sleeveGroup.add(sleeve);
      
      // === 袖口のフリル（20枚のひだ） ===
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const frillWidth = 0.008;
        const frillHeight = 0.015;
        
        const frillGeo = new THREE.PlaneGeometry(frillWidth, frillHeight, 2, 4);
        
        // 波打たせる
        const frillPos = frillGeo.attributes.position.array as Float32Array;
        for (let j = 0; j < frillPos.length; j += 3) {
          const localY = frillPos[j + 1];
          const wave = Math.sin(localY * 10) * 0.002;
          frillPos[j + 2] += wave;
        }
        
        frillGeo.computeVertexNormals();
        
        const frillMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.8,
          metalness: 0.02,
          side: THREE.DoubleSide,
        });
        
        const frill = new THREE.Mesh(frillGeo, frillMat);
        frill.position.set(
          Math.cos(angle) * 0.040,
          -0.07,
          Math.sin(angle) * 0.040
        );
        frill.lookAt(
          Math.cos(angle) * 0.060,
          -0.07,
          Math.sin(angle) * 0.060
        );
        frill.castShadow = true;
        sleeveGroup.add(frill);
      }
      
      this.group.add(sleeveGroup);
    }
  }
  
  /**
   * 襟（丸襟）
   */
  private createCollar() {
    // 襟のカーブ
    const collarCurve = new THREE.EllipseCurve(
      0, 0,
      0.09, 0.06,
      Math.PI * 0.2, Math.PI * 0.8,
      false, 0
    );
    
    const collarPoints = collarCurve.getPoints(50);
    const collarShape = new THREE.Shape();
    
    collarShape.moveTo(collarPoints[0].x, collarPoints[0].y);
    for (let i = 1; i < collarPoints.length; i++) {
      collarShape.lineTo(collarPoints[i].x, collarPoints[i].y);
    }
    
    // 内側のカーブ
    const innerCurve = new THREE.EllipseCurve(
      0, 0,
      0.06, 0.04,
      Math.PI * 0.2, Math.PI * 0.8,
      true, 0
    );
    
    const innerPoints = innerCurve.getPoints(50);
    for (let i = 0; i < innerPoints.length; i++) {
      collarShape.lineTo(innerPoints[i].x, innerPoints[i].y);
    }
    
    const collarGeo = new THREE.ShapeGeometry(collarShape);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, 1.30, 0.08);
    collar.rotation.x = -Math.PI * 0.15;
    collar.castShadow = true;
    this.group.add(collar);
    
    // 襟の縁取り（刺繍風）
    const edgeMat = new THREE.LineBasicMaterial({
      color: THEME.colors.riverCyan,
      linewidth: 2,
    });
    
    const edgeGeo = new THREE.BufferGeometry().setFromPoints(
      collarPoints.map(p => new THREE.Vector3(p.x, p.y, 0.001))
    );
    
    const edge = new THREE.Line(edgeGeo, edgeMat);
    collar.add(edge);
  }
  
  /**
   * リボン（胸元、立体的）
   */
  private createRibbon() {
    const ribbonGroup = new THREE.Group();
    ribbonGroup.position.set(0, 1.22, 0.085);
    
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: THEME.colors.riverCyan,
      roughness: 0.5,
      metalness: 0.35,
      side: THREE.DoubleSide,
    });
    
    // === 中央の結び目 ===
    const knotGeo = new THREE.TorusGeometry(0.012, 0.006, 16, 32);
    const knot = new THREE.Mesh(knotGeo, ribbonMat);
    knot.rotation.x = Math.PI / 2;
    knot.castShadow = true;
    ribbonGroup.add(knot);
    
    // === 左右のループ（蝶結び） ===
    for (let side = -1; side <= 1; side += 2) {
      // ループのカーブ
      const loopCurve = new THREE.EllipseCurve(
        0, 0,
        0.025, 0.020,
        side > 0 ? 0 : Math.PI,
        side > 0 ? Math.PI : Math.PI * 2,
        false, 0
      );
      
      const loopPoints = loopCurve.getPoints(30);
      const loopShape = new THREE.Shape();
      
      loopShape.moveTo(loopPoints[0].x, loopPoints[0].y);
      for (let i = 1; i < loopPoints.length; i++) {
        loopShape.lineTo(loopPoints[i].x, loopPoints[i].y);
      }
      loopShape.lineTo(0, 0);
      
      const loopGeo = new THREE.ExtrudeGeometry(loopShape, {
        depth: 0.004,
        bevelEnabled: true,
        bevelThickness: 0.001,
        bevelSize: 0.001,
      });
      
      const loop = new THREE.Mesh(loopGeo, ribbonMat);
      loop.position.x = side * 0.012;
      loop.castShadow = true;
      ribbonGroup.add(loop);
      
      // リボンの垂れ下がり
      const tailCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(side * 0.015, -0.005, 0),
        new THREE.Vector3(side * 0.020, -0.025, 0.002),
        new THREE.Vector3(side * 0.018, -0.045, 0.005)
      );
      
      const tailGeo = new THREE.TubeGeometry(tailCurve, 16, 0.006, 8, false);
      const tail = new THREE.Mesh(tailGeo, ribbonMat);
      tail.castShadow = true;
      ribbonGroup.add(tail);
    }
    
    this.group.add(ribbonGroup);
  }
  
  /**
   * レースの装飾（襟元・袖・裾）
   */
  private createLaceDetails() {
    // === スカート裾のレース ===
    const hemHeight = 0.70;
    const laceCount = 48;
    
    for (let i = 0; i < laceCount; i++) {
      const angle = (i / laceCount) * Math.PI * 2;
      const radius = 0.235;
      
      // レースの波形パターン
      const laceCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(
          Math.cos(angle - 0.05) * radius,
          hemHeight,
          Math.sin(angle - 0.05) * radius
        ),
        new THREE.Vector3(
          Math.cos(angle) * (radius + 0.012),
          hemHeight - 0.008,
          Math.sin(angle) * (radius + 0.012)
        ),
        new THREE.Vector3(
          Math.cos(angle + 0.05) * radius,
          hemHeight,
          Math.sin(angle + 0.05) * radius
        )
      );
      
      const laceGeo = new THREE.TubeGeometry(laceCurve, 8, 0.002, 6, false);
      const laceMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.05,
      });
      
      const lace = new THREE.Mesh(laceGeo, laceMat);
      lace.castShadow = true;
      this.group.add(lace);
    }
  }
  
  /**
   * ボタン（胸元に5個）
   */
  private createButtons() {
    for (let i = 0; i < 5; i++) {
      const buttonY = 1.28 - i * 0.025;
      
      // ボタン本体
      const buttonGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.002, 16);
      const buttonMat = new THREE.MeshStandardMaterial({
        color: 0xe8f0f0,
        roughness: 0.3,
        metalness: 0.7,
      });
      
      const button = new THREE.Mesh(buttonGeo, buttonMat);
      button.position.set(0, buttonY, 0.082);
      button.rotation.x = Math.PI / 2;
      button.castShadow = true;
      this.group.add(button);
      
      // ボタンの穴（4つ）
      for (let j = 0; j < 4; j++) {
        const holeAngle = (j / 4) * Math.PI * 2 + Math.PI / 4;
        const holeRadius = 0.0015;
        
        const holeGeo = new THREE.CylinderGeometry(0.0003, 0.0003, 0.003, 8);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
        
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(
          Math.cos(holeAngle) * holeRadius,
          buttonY,
          0.083 + Math.sin(holeAngle) * holeRadius
        );
        hole.rotation.x = Math.PI / 2;
        this.group.add(hole);
      }
    }
  }
  
  /**
   * スカートのフリル（複数段）
   */
  private createSkirtRuffles() {
    const ruffleHeights = [0.90, 0.78];
    
    for (const height of ruffleHeights) {
      const ruffleCount = 32;
      
      for (let i = 0; i < ruffleCount; i++) {
        const angle = (i / ruffleCount) * Math.PI * 2;
        const radius = height > 0.85 ? 0.18 : 0.21;
        
        const ruffleCurve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(
            Math.cos(angle - 0.08) * radius,
            height,
            Math.sin(angle - 0.08) * radius
          ),
          new THREE.Vector3(
            Math.cos(angle) * (radius + 0.015),
            height - 0.015,
            Math.sin(angle) * (radius + 0.015)
          ),
          new THREE.Vector3(
            Math.cos(angle + 0.08) * radius,
            height,
            Math.sin(angle + 0.08) * radius
          )
        );
        
        const ruffleGeo = new THREE.TubeGeometry(ruffleCurve, 12, 0.003, 8, false);
        const ruffleMat = new THREE.MeshStandardMaterial({
          color: 0xf5f8f8,
          roughness: 0.75,
          metalness: 0.05,
          side: THREE.DoubleSide,
        });
        
        const ruffle = new THREE.Mesh(ruffleGeo, ruffleMat);
        ruffle.castShadow = true;
        this.group.add(ruffle);
      }
    }
  }
}
