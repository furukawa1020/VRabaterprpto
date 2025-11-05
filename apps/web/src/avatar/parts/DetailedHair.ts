/**
 * DetailedHair.ts
 * 髪の毛を1本1本生成（数千本レベル）
 * 物理演算風の動き、光沢、枝毛まで表現
 */

import * as THREE from 'three';
import { THEME } from '../../config';
import { DetailedUguisu } from './DetailedUguisu';

interface HairStrand {
  mesh: THREE.Mesh;
  basePosition: THREE.Vector3;
  swayPhase: number;
  swayAmplitude: number;
}

export class DetailedHair {
  public group: THREE.Group;
  private hairStrands: HairStrand[] = [];
  private uguisuAccessory: DetailedUguisu | null = null;
  
  constructor() {
    this.group = new THREE.Group();
    this.createDetailedHair();
    this.createUguisuAccessory();
  }
  
  private createDetailedHair() {
    // 髪の色（翠青色のグラデーション）
    const hairBaseColor = new THREE.Color(THEME.colors.riverCyan);
    
    // === 前髪（600本） ===
    this.createBangs(600, hairBaseColor);
    
    // === サイドヘア（左右各400本） ===
    this.createSideHair(400, hairBaseColor);
    
    // === 頭頂部（800本） ===
    this.createTopHair(800, hairBaseColor);
    
    // === 後ろ髪（1200本） ===
    this.createBackHair(1200, hairBaseColor);
    
    // === 髪飾り ===
    this.createHairAccessories();
  }
  
  /**
   * 前髪（600本の個別ストランド）
   */
  private createBangs(count: number, baseColor: THREE.Color) {
    for (let i = 0; i < count; i++) {
      // 前髪の分布（額全体）
      const t = i / count;
      const baseX = (t - 0.5) * 0.18; // -0.09 to 0.09
      const baseY = 1.55 + Math.random() * 0.02;
      const baseZ = 0.08 + Math.random() * 0.01;
      
      // ランダムなオフセット
      const offsetX = (Math.random() - 0.5) * 0.005;
      const offsetZ = (Math.random() - 0.5) * 0.003;
      
      // 髪の毛のカーブ（3次ベジエ）
      const controlY1 = baseY - 0.05 + Math.random() * 0.02;
      const controlY2 = baseY - 0.10 + Math.random() * 0.03;
      const endY = baseY - 0.13 + Math.random() * 0.02;
      
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(baseX + offsetX, baseY, baseZ + offsetZ),
        new THREE.Vector3(
          baseX + offsetX * 1.5,
          controlY1,
          baseZ + offsetZ + 0.02
        ),
        new THREE.Vector3(
          baseX + offsetX * 2,
          controlY2,
          baseZ + offsetZ + 0.025
        ),
        new THREE.Vector3(
          baseX + offsetX * 2.5 + (Math.random() - 0.5) * 0.01,
          endY,
          baseZ + offsetZ + 0.02 + Math.random() * 0.01
        )
      );
      
      
      // カスタムチューブジオメトリ
      const segments = 24;
      const radialSegments = 4;
      const hairGeo = new THREE.TubeGeometry(
        curve,
        segments,
        0.0003,
        radialSegments,
        false
      );
      
      // 毛先を細くする（頂点操作）
      const positions = hairGeo.attributes.position.array as Float32Array;
      for (let j = 0; j < positions.length; j += 3) {
        const vertexIndex = j / 3;
        const segmentIndex = Math.floor(vertexIndex / (radialSegments + 1));
        const t = segmentIndex / segments;
        const scaleFactor = 1 - t * 0.7;
        
        // 中心からの距離を縮小
        const x = positions[j];
        const y = positions[j + 1];
        const z = positions[j + 2];
        const centerPoint = curve.getPoint(t);
        
        positions[j] = centerPoint.x + (x - centerPoint.x) * scaleFactor;
        positions[j + 1] = centerPoint.y + (y - centerPoint.y) * scaleFactor;
        positions[j + 2] = centerPoint.z + (z - centerPoint.z) * scaleFactor;
      }
      
      hairGeo.computeVertexNormals();
      
      // 髪の毛のマテリアル（色の微妙なバリエーション）
      const colorVariation = Math.random() * 0.1 - 0.05;
      const hairColor = baseColor.clone();
      hairColor.offsetHSL(colorVariation * 0.1, colorVariation * 0.2, colorVariation * 0.1);
      
      const hairMat = new THREE.MeshStandardMaterial({
        color: hairColor,
        roughness: 0.65 + Math.random() * 0.15,
        metalness: 0.25 + Math.random() * 0.15,
        side: THREE.DoubleSide,
      });
      
      const hairStrand = new THREE.Mesh(hairGeo, hairMat);
      hairStrand.castShadow = true;
      hairStrand.receiveShadow = true;
      
      this.hairStrands.push({
        mesh: hairStrand,
        basePosition: new THREE.Vector3(baseX, baseY, baseZ),
        swayPhase: Math.random() * Math.PI * 2,
        swayAmplitude: 0.002 + Math.random() * 0.003,
      });
      
      this.group.add(hairStrand);
    }
  }
  
  /**
   * サイドヘア（各サイド400本）
   */
  private createSideHair(countPerSide: number, baseColor: THREE.Color) {
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < countPerSide; i++) {
        // サイドヘアの分布
        const t = i / countPerSide;
        const baseX = side * (0.08 + t * 0.04);
        const baseY = 1.52 - t * 0.25;
        const baseZ = 0.05 - t * 0.05 + Math.random() * 0.02;
        
        // ランダムオフセット
        const offsetY = (Math.random() - 0.5) * 0.01;
        const offsetZ = (Math.random() - 0.5) * 0.01;
        
        // 長いカーブ（耳の横を流れる）
        const hairLength = 0.25 + Math.random() * 0.05;
        
        const curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(baseX, baseY + offsetY, baseZ + offsetZ),
          new THREE.Vector3(
            baseX + side * 0.02,
            baseY - hairLength * 0.3,
            baseZ + 0.01
          ),
          new THREE.Vector3(
            baseX + side * 0.03,
            baseY - hairLength * 0.6,
            baseZ - 0.01
          ),
          new THREE.Vector3(
            baseX + side * 0.02 + (Math.random() - 0.5) * 0.02,
            baseY - hairLength,
            baseZ + (Math.random() - 0.5) * 0.03
          )
        );
        
        const hairGeo = new THREE.TubeGeometry(curve, 32, 0.00035, 4, false);
        
        // 毛先を細くする
        const positions = hairGeo.attributes.position.array as Float32Array;
        for (let j = 0; j < positions.length; j += 3) {
          const vertexIndex = j / 3;
          const segmentIndex = Math.floor(vertexIndex / 5);
          const t = segmentIndex / 32;
          const scaleFactor = 1 - t * 0.65;
          
          const x = positions[j];
          const y = positions[j + 1];
          const z = positions[j + 2];
          const centerPoint = curve.getPoint(t);
          
          positions[j] = centerPoint.x + (x - centerPoint.x) * scaleFactor;
          positions[j + 1] = centerPoint.y + (y - centerPoint.y) * scaleFactor;
          positions[j + 2] = centerPoint.z + (z - centerPoint.z) * scaleFactor;
        }
        
        hairGeo.computeVertexNormals();
        
        const hairColor = baseColor.clone();
        hairColor.offsetHSL((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.1);
        
        const hairMat = new THREE.MeshStandardMaterial({
          color: hairColor,
          roughness: 0.6 + Math.random() * 0.2,
          metalness: 0.3 + Math.random() * 0.1,
          side: THREE.DoubleSide,
        });
        
        const hairStrand = new THREE.Mesh(hairGeo, hairMat);
        hairStrand.castShadow = true;
        
        this.hairStrands.push({
          mesh: hairStrand,
          basePosition: new THREE.Vector3(baseX, baseY, baseZ),
          swayPhase: Math.random() * Math.PI * 2,
          swayAmplitude: 0.003 + Math.random() * 0.004,
        });
        
        this.group.add(hairStrand);
      }
    }
  }
  
  /**
   * 頭頂部の髪（800本）
   */
  private createTopHair(count: number, baseColor: THREE.Color) {
    for (let i = 0; i < count; i++) {
      // 頭頂部全体に分布（円形）
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.09;
      
      const baseX = Math.cos(angle) * radius;
      const baseZ = -0.05 + Math.sin(angle) * radius * 0.5;
      const baseY = 1.55 - radius * 0.3;
      
      // 短めの髪（頭頂部）
      const hairLength = 0.08 + Math.random() * 0.04;
      
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(baseX, baseY, baseZ),
        new THREE.Vector3(
          baseX + (Math.random() - 0.5) * 0.02,
          baseY + hairLength * 0.3,
          baseZ + (Math.random() - 0.5) * 0.02
        ),
        new THREE.Vector3(
          baseX + (Math.random() - 0.5) * 0.03,
          baseY + hairLength,
          baseZ + (Math.random() - 0.5) * 0.03
        )
      );
      
      const hairGeo = new THREE.TubeGeometry(curve, 16, 0.00030, 4, false);
      
      const hairColor = baseColor.clone();
      hairColor.offsetHSL((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.1);
      
      const hairMat = new THREE.MeshStandardMaterial({
        color: hairColor,
        roughness: 0.7 + Math.random() * 0.15,
        metalness: 0.25 + Math.random() * 0.1,
      });
      
      const hairStrand = new THREE.Mesh(hairGeo, hairMat);
      hairStrand.castShadow = true;
      
      this.hairStrands.push({
        mesh: hairStrand,
        basePosition: new THREE.Vector3(baseX, baseY, baseZ),
        swayPhase: Math.random() * Math.PI * 2,
        swayAmplitude: 0.001 + Math.random() * 0.002,
      });
      
      this.group.add(hairStrand);
    }
  }
  
  /**
   * 後ろ髪（ロング、1200本）
   */
  private createBackHair(count: number, baseColor: THREE.Color) {
    for (let i = 0; i < count; i++) {
      // 後頭部全体に分布
      const t = i / count;
      const xSpread = (t - 0.5) * 0.16;
      const baseX = xSpread + (Math.random() - 0.5) * 0.02;
      const baseY = 1.50 + (Math.random() - 0.5) * 0.08;
      const baseZ = -0.08 + Math.random() * 0.02;
      
      // 長い髪（腰まで）
      const hairLength = 0.50 + Math.random() * 0.10;
      
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(baseX, baseY, baseZ),
        new THREE.Vector3(
          baseX + (Math.random() - 0.5) * 0.03,
          baseY - hairLength * 0.25,
          baseZ - 0.03
        ),
        new THREE.Vector3(
          baseX + (Math.random() - 0.5) * 0.04,
          baseY - hairLength * 0.65,
          baseZ - 0.02 + Math.random() * 0.02
        ),
        new THREE.Vector3(
          baseX + (Math.random() - 0.5) * 0.05,
          baseY - hairLength,
          baseZ + (Math.random() - 0.5) * 0.04
        )
      );
      
      const hairGeo = new THREE.TubeGeometry(curve, 48, 0.00038, 4, false);
      
      // 毛先を細くする
      const positions = hairGeo.attributes.position.array as Float32Array;
      for (let j = 0; j < positions.length; j += 3) {
        const vertexIndex = j / 3;
        const segmentIndex = Math.floor(vertexIndex / 5);
        const t = segmentIndex / 48;
        const scaleFactor = 1 - t * 0.7;
        
        const x = positions[j];
        const y = positions[j + 1];
        const z = positions[j + 2];
        const centerPoint = curve.getPoint(t);
        
        positions[j] = centerPoint.x + (x - centerPoint.x) * scaleFactor;
        positions[j + 1] = centerPoint.y + (y - centerPoint.y) * scaleFactor;
        positions[j + 2] = centerPoint.z + (z - centerPoint.z) * scaleFactor;
      }
      
      hairGeo.computeVertexNormals();
      
      const hairColor = baseColor.clone();
      hairColor.offsetHSL((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.1);
      
      const hairMat = new THREE.MeshStandardMaterial({
        color: hairColor,
        roughness: 0.65 + Math.random() * 0.15,
        metalness: 0.28 + Math.random() * 0.12,
        side: THREE.DoubleSide,
      });
      
      const hairStrand = new THREE.Mesh(hairGeo, hairMat);
      hairStrand.castShadow = true;
      
      this.hairStrands.push({
        mesh: hairStrand,
        basePosition: new THREE.Vector3(baseX, baseY, baseZ),
        swayPhase: Math.random() * Math.PI * 2,
        swayAmplitude: 0.004 + Math.random() * 0.006,
      });
      
      this.group.add(hairStrand);
    }
  }
  
  /**
   * 髪飾り（雪の結晶、詳細版）
   */
  private createHairAccessories() {
    // メイン結晶（右側）
    const mainCrystal = this.createSnowflakeCrystal(0.025, 0xffffff);
    mainCrystal.position.set(0.08, 1.54, 0.06);
    mainCrystal.rotation.z = Math.PI / 6;
    this.group.add(mainCrystal);
    
    // サブ結晶1
    const subCrystal1 = this.createSnowflakeCrystal(0.015, 0xeef8ff);
    subCrystal1.position.set(0.06, 1.56, 0.04);
    subCrystal1.rotation.z = -Math.PI / 4;
    this.group.add(subCrystal1);
    
    // サブ結晶2
    const subCrystal2 = this.createSnowflakeCrystal(0.012, 0xe0f0ff);
    subCrystal2.position.set(0.09, 1.52, 0.05);
    subCrystal2.rotation.z = Math.PI / 3;
    this.group.add(subCrystal2);
    
    // 小さな装飾結晶（10個）
    for (let i = 0; i < 10; i++) {
      const tinyCrystal = this.createSnowflakeCrystal(0.005 + Math.random() * 0.003, 0xf5fbff);
      tinyCrystal.position.set(
        0.05 + Math.random() * 0.06,
        1.50 + Math.random() * 0.08,
        0.03 + Math.random() * 0.04
      );
      tinyCrystal.rotation.z = Math.random() * Math.PI * 2;
      this.group.add(tinyCrystal);
    }
  }
  
  /**
   * 雪の結晶を生成
   */
  private createSnowflakeCrystal(size: number, color: number): THREE.Group {
    const crystalGroup = new THREE.Group();
    
    const crystalMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: 0x99ccff,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.95,
    });
    
    // 中心の八面体
    const coreGeo = new THREE.OctahedronGeometry(size, 2);
    const core = new THREE.Mesh(coreGeo, crystalMat);
    crystalGroup.add(core);
    
    // 6本の腕
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      
      // メインアーム
      const armGeo = new THREE.BoxGeometry(size * 1.5, size * 0.15, size * 0.15);
      const arm = new THREE.Mesh(armGeo, crystalMat);
      arm.position.set(Math.cos(angle) * size * 0.75, Math.sin(angle) * size * 0.75, 0);
      arm.rotation.z = angle;
      crystalGroup.add(arm);
      
      // 枝
      for (let j = 0; j < 3; j++) {
        const branchSize = size * (0.4 - j * 0.1);
        const branchGeo = new THREE.BoxGeometry(branchSize, size * 0.1, size * 0.1);
        
        // 左の枝
        const leftBranch = new THREE.Mesh(branchGeo, crystalMat);
        leftBranch.position.set(
          Math.cos(angle) * size * (0.4 + j * 0.25),
          Math.sin(angle) * size * (0.4 + j * 0.25),
          0
        );
        leftBranch.rotation.z = angle + Math.PI / 4;
        crystalGroup.add(leftBranch);
        
        // 右の枝
        const rightBranch = new THREE.Mesh(branchGeo, crystalMat);
        rightBranch.position.set(
          Math.cos(angle) * size * (0.4 + j * 0.25),
          Math.sin(angle) * size * (0.4 + j * 0.25),
          0
        );
        rightBranch.rotation.z = angle - Math.PI / 4;
        crystalGroup.add(rightBranch);
      }
    }
    
    return crystalGroup;
  }
  
  /**
   * うぐいすの髪飾り
   */
  private createUguisuAccessory() {
    this.uguisuAccessory = new DetailedUguisu();
    
    // 雪の結晶の横に配置
    this.uguisuAccessory.group.position.set(0.08, 0.05, -0.02);
    this.uguisuAccessory.group.rotation.y = -Math.PI / 4;
    
    // サイズ調整（かわいいサイズに）
    this.uguisuAccessory.group.scale.setScalar(1.2);
    
    this.group.add(this.uguisuAccessory.group);
    
    console.log('[DetailedHair] うぐいす髪飾り追加完了！');
  }
  
  /**
   * アニメーション更新（髪の揺れ + うぐいすのアニメーション）
   */
  public update(deltaTime: number) {
    const time = Date.now() * 0.001;
    
    // 髪の毛の揺れ
    this.hairStrands.forEach((strand, index) => {
      // 風の影響（緩やかな揺れ）
      const windPhase = time * 0.8 + strand.swayPhase;
      const windSway = Math.sin(windPhase) * strand.swayAmplitude;
      const windSway2 = Math.cos(windPhase * 0.6) * strand.swayAmplitude * 0.5;
      
      // 回転で揺れを表現
      strand.mesh.rotation.z = windSway;
      strand.mesh.rotation.x = windSway2;
      
      // たまに大きな揺れ（頭を動かした時の慣性）
      const turbulence = Math.sin(time * 2 + index * 0.1) * 0.0005;
      strand.mesh.rotation.y = turbulence;
    });
    
    // うぐいすのアニメーション
    if (this.uguisuAccessory) {
      this.uguisuAccessory.update(deltaTime);
    }
  }
}
