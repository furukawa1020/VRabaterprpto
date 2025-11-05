/**
 * DetailedBody.ts
 * 肌の質感、筋肉、骨格まで表現した体
 */

import * as THREE from 'three';
import { DetailedUguisu } from './DetailedUguisu';

export class DetailedBody {
  public group: THREE.Group;
  private bones: Map<string, THREE.Bone>;
  private shoulderUguisu: DetailedUguisu | null = null;
  
  constructor() {
    this.group = new THREE.Group();
    this.bones = new Map();
    
    this.createSkeleton();
    this.createTorso();
    this.createArms();
    this.createLegs();
    this.createHands();
    this.createFeet();
    this.createShoulderUguisu();
  }
  
  /**
   * 骨格システム
   */
  private createSkeleton() {
    // === 脊椎（Spine） ===
    const spineBase = new THREE.Bone();
    spineBase.position.set(0, 0.95, 0);
    this.bones.set('spine_base', spineBase);
    
    const spineMid = new THREE.Bone();
    spineMid.position.set(0, 0.12, 0);
    spineBase.add(spineMid);
    this.bones.set('spine_mid', spineMid);
    
    const spineTop = new THREE.Bone();
    spineTop.position.set(0, 0.15, 0);
    spineMid.add(spineTop);
    this.bones.set('spine_top', spineTop);
    
    // === 首 ===
    const neck = new THREE.Bone();
    neck.position.set(0, 0.08, 0);
    spineTop.add(neck);
    this.bones.set('neck', neck);
    
    // === 頭 ===
    const head = new THREE.Bone();
    head.position.set(0, 0.08, 0);
    neck.add(head);
    this.bones.set('head', head);
    
    // === 左右の肩 ===
    for (let side = -1; side <= 1; side += 2) {
      const sideName = side < 0 ? 'left' : 'right';
      
      const shoulder = new THREE.Bone();
      shoulder.position.set(side * 0.08, 0.06, 0);
      spineTop.add(shoulder);
      this.bones.set(`${sideName}_shoulder`, shoulder);
      
      // 上腕
      const upperArm = new THREE.Bone();
      upperArm.position.set(side * 0.08, 0, 0);
      shoulder.add(upperArm);
      this.bones.set(`${sideName}_upper_arm`, upperArm);
      
      // 肘
      const elbow = new THREE.Bone();
      elbow.position.set(side * 0.01, -0.11, 0);
      upperArm.add(elbow);
      this.bones.set(`${sideName}_elbow`, elbow);
      
      // 前腕
      const forearm = new THREE.Bone();
      forearm.position.set(side * 0.01, -0.10, 0);
      elbow.add(forearm);
      this.bones.set(`${sideName}_forearm`, forearm);
      
      // 手首
      const wrist = new THREE.Bone();
      wrist.position.set(0, -0.06, 0);
      forearm.add(wrist);
      this.bones.set(`${sideName}_wrist`, wrist);
    }
    
    // === 左右の脚 ===
    for (let side = -1; side <= 1; side += 2) {
      const sideName = side < 0 ? 'left' : 'right';
      
      const hip = new THREE.Bone();
      hip.position.set(side * 0.06, -0.02, 0);
      spineBase.add(hip);
      this.bones.set(`${sideName}_hip`, hip);
      
      // 太もも
      const thigh = new THREE.Bone();
      thigh.position.set(0, -0.18, 0);
      hip.add(thigh);
      this.bones.set(`${sideName}_thigh`, thigh);
      
      // 膝
      const knee = new THREE.Bone();
      knee.position.set(0, -0.16, 0);
      thigh.add(knee);
      this.bones.set(`${sideName}_knee`, knee);
      
      // すね
      const shin = new THREE.Bone();
      shin.position.set(0, -0.15, 0.01);
      knee.add(shin);
      this.bones.set(`${sideName}_shin`, shin);
      
      // 足首
      const ankle = new THREE.Bone();
      ankle.position.set(0, -0.08, 0);
      shin.add(ankle);
      this.bones.set(`${sideName}_ankle`, ankle);
    }
    
    this.group.add(spineBase);
  }
  
  /**
   * 胴体（筋肉、リブケージ付き）
   */
  private createTorso() {
    // === ベース形状 ===
    const torsoGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.35, 64, 32);
    
    // 頂点を調整
    const positions = torsoGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // ウエストを細く
      if (y > -0.05 && y < 0.05) {
        const waistFactor = 0.85;
        positions[i] *= waistFactor;
        positions[i + 2] *= waistFactor;
      }
      
      // 肩幅を広く
      if (y > 0.10) {
        const shoulderFactor = 1.15;
        positions[i] *= shoulderFactor;
      }
      
      // 胸の膨らみ
      if (y > 0.05 && y < 0.15 && z > 0) {
        const bustZ = 1.18 + (0.15 - Math.abs(y - 0.10)) * 0.5;
        positions[i + 2] *= bustZ;
      }
      
      // 背中の曲線
      if (z < 0) {
        const backCurve = 0.92 - Math.abs(y) * 0.05;
        positions[i + 2] *= backCurve;
      }
    }
    
    torsoGeo.computeVertexNormals();
    
    // === 肌のテクスチャ（毛穴、産毛） ===
    const skinCanvas = document.createElement('canvas');
    skinCanvas.width = 1024;
    skinCanvas.height = 1024;
    const ctx = skinCanvas.getContext('2d')!;
    
    // ベース肌色
    const gradient = ctx.createRadialGradient(512, 300, 100, 512, 512, 700);
    gradient.addColorStop(0, '#fef5f1');
    gradient.addColorStop(0.5, '#fce8df');
    gradient.addColorStop(1, '#f8ddd1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);
    
    // 毛穴（3000個）
    ctx.fillStyle = 'rgba(220, 180, 160, 0.15)';
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      ctx.beginPath();
      ctx.arc(x, y, 0.3 + Math.random() * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 産毛（800本）
    ctx.strokeStyle = 'rgba(200, 160, 140, 0.1)';
    ctx.lineWidth = 0.3;
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const length = 2 + Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
    
    // 肌の微細な凹凸
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = 5 + Math.random() * 15;
      
      const localGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
      localGrad.addColorStop(0, 'rgba(255, 245, 240, 0.3)');
      localGrad.addColorStop(1, 'rgba(248, 221, 209, 0.1)');
      ctx.fillStyle = localGrad;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const skinTexture = new THREE.CanvasTexture(skinCanvas);
    
    // === ノーマルマップ（筋肉の凹凸） ===
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 512;
    normalCanvas.height = 512;
    const normalCtx = normalCanvas.getContext('2d')!;
    
    normalCtx.fillStyle = '#8080ff';
    normalCtx.fillRect(0, 0, 512, 512);
    
    // 腹筋のライン
    for (let i = 0; i < 3; i++) {
      const y = 200 + i * 80;
      normalCtx.fillStyle = '#7070ee';
      normalCtx.fillRect(220, y, 30, 15);
      normalCtx.fillRect(262, y, 30, 15);
    }
    
    // 肋骨の筋
    for (let i = 0; i < 6; i++) {
      const y = 80 + i * 25;
      normalCtx.strokeStyle = '#7575f0';
      normalCtx.lineWidth = 2;
      normalCtx.beginPath();
      normalCtx.moveTo(256, y);
      normalCtx.quadraticCurveTo(200, y + 10, 180, y + 20);
      normalCtx.stroke();
      
      normalCtx.beginPath();
      normalCtx.moveTo(256, y);
      normalCtx.quadraticCurveTo(312, y + 10, 332, y + 20);
      normalCtx.stroke();
    }
    
    const normalTexture = new THREE.CanvasTexture(normalCanvas);
    
    const torsoMat = new THREE.MeshStandardMaterial({
      map: skinTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.15, 0.15),
      color: 0xfff5f0,
      roughness: 0.85,
      metalness: 0.02,
    });
    
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 1.12, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    this.group.add(torso);
    
    // === 首 ===
    const neckGeo = new THREE.CylinderGeometry(0.028, 0.032, 0.08, 32);
    const neck = new THREE.Mesh(neckGeo, torsoMat);
    neck.position.set(0, 1.34, 0);
    neck.castShadow = true;
    this.group.add(neck);
    
    // === 鎖骨 ===
    for (let side = -1; side <= 1; side += 2) {
      const collarCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 1.30, 0.04),
        new THREE.Vector3(side * 0.04, 1.29, 0.03),
        new THREE.Vector3(side * 0.08, 1.27, 0.02)
      );
      
      const collarGeo = new THREE.TubeGeometry(collarCurve, 16, 0.004, 8, false);
      const collar = new THREE.Mesh(collarGeo, torsoMat);
      collar.castShadow = true;
      this.group.add(collar);
    }
  }
  
  /**
   * 腕（上腕、前腕、筋肉）
   */
  private createArms() {
    for (let side = -1; side <= 1; side += 2) {
      const sideName = side < 0 ? 'left' : 'right';
      
      // === 上腕 ===
      const upperArmGeo = new THREE.CylinderGeometry(0.024, 0.020, 0.12, 32, 16);
      
      // 筋肉の形状
      const upperPositions = upperArmGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < upperPositions.length; i += 3) {
        const x = upperPositions[i];
        const y = upperPositions[i + 1];
        const z = upperPositions[i + 2];
        
        // 上腕二頭筋の膨らみ
        if (y > 0.02 && z > 0) {
          const bulgeFactor = 1.08;
          upperPositions[i + 2] *= bulgeFactor;
        }
      }
      
      upperArmGeo.computeVertexNormals();
      
      const armMat = new THREE.MeshStandardMaterial({
        color: 0xfff5f0,
        roughness: 0.85,
        metalness: 0.02,
      });
      
      const upperArm = new THREE.Mesh(upperArmGeo, armMat);
      upperArm.position.set(side * 0.16, 1.27, 0);
      upperArm.castShadow = true;
      upperArm.receiveShadow = true;
      this.group.add(upperArm);
      
      // === 肘 ===
      const elbowGeo = new THREE.SphereGeometry(0.018, 16, 16);
      const elbow = new THREE.Mesh(elbowGeo, armMat);
      elbow.position.set(side * 0.17, 1.16, 0);
      elbow.castShadow = true;
      this.group.add(elbow);
      
      // === 前腕 ===
      const forearmGeo = new THREE.CylinderGeometry(0.018, 0.014, 0.11, 32, 16);
      const forearm = new THREE.Mesh(forearmGeo, armMat);
      forearm.position.set(side * 0.18, 1.05, 0);
      forearm.castShadow = true;
      forearm.receiveShadow = true;
      this.group.add(forearm);
      
      // 腕の産毛（100本）
      for (let i = 0; i < 100; i++) {
        const hairY = 1.05 + (Math.random() - 0.5) * 0.20;
        const hairAngle = Math.random() * Math.PI * 2;
        const hairRadius = 0.014 + Math.random() * 0.004;
        
        const hairCurve = new THREE.LineCurve3(
          new THREE.Vector3(
            side * 0.18 + Math.cos(hairAngle) * hairRadius,
            hairY,
            Math.sin(hairAngle) * hairRadius
          ),
          new THREE.Vector3(
            side * 0.18 + Math.cos(hairAngle) * (hairRadius + 0.002),
            hairY + 0.001,
            Math.sin(hairAngle) * (hairRadius + 0.002)
          )
        );
        
        const hairGeo = new THREE.TubeGeometry(hairCurve, 2, 0.0001, 4, false);
        const hairMat = new THREE.MeshBasicMaterial({ color: 0xd4b5a0, transparent: true, opacity: 0.3 });
        
        const hair = new THREE.Mesh(hairGeo, hairMat);
        this.group.add(hair);
      }
    }
  }
  
  /**
   * 脚（太もも、すね、筋肉）
   */
  private createLegs() {
    for (let side = -1; side <= 1; side += 2) {
      // === 太もも ===
      const thighGeo = new THREE.CylinderGeometry(0.040, 0.032, 0.20, 32, 16);
      
      const thighPositions = thighGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < thighPositions.length; i += 3) {
        const x = thighPositions[i];
        const y = thighPositions[i + 1];
        const z = thighPositions[i + 2];
        
        // 内側を細く
        if ((side < 0 && x > 0) || (side > 0 && x < 0)) {
          thighPositions[i] *= 0.92;
        }
        
        // 筋肉の形状
        if (z > 0 && y > 0) {
          thighPositions[i + 2] *= 1.05;
        }
      }
      
      thighGeo.computeVertexNormals();
      
      const legMat = new THREE.MeshStandardMaterial({
        color: 0xfff5f0,
        roughness: 0.85,
        metalness: 0.02,
      });
      
      const thigh = new THREE.Mesh(thighGeo, legMat);
      thigh.position.set(side * 0.06, 0.83, 0);
      thigh.castShadow = true;
      thigh.receiveShadow = true;
      this.group.add(thigh);
      
      // === 膝 ===
      const kneeGeo = new THREE.SphereGeometry(0.028, 16, 16);
      const knee = new THREE.Mesh(kneeGeo, legMat);
      knee.position.set(side * 0.06, 0.67, 0.01);
      knee.castShadow = true;
      knee.scale.z = 0.85;
      this.group.add(knee);
      
      // === すね ===
      const shinGeo = new THREE.CylinderGeometry(0.028, 0.022, 0.18, 32, 16);
      const shin = new THREE.Mesh(shinGeo, legMat);
      shin.position.set(side * 0.06, 0.52, 0.01);
      shin.castShadow = true;
      shin.receiveShadow = true;
      this.group.add(shin);
      
      // === 足首 ===
      const ankleGeo = new THREE.CylinderGeometry(0.020, 0.018, 0.06, 16);
      const ankle = new THREE.Mesh(ankleGeo, legMat);
      ankle.position.set(side * 0.06, 0.40, 0.01);
      ankle.castShadow = true;
      this.group.add(ankle);
    }
  }
  
  /**
   * 手（指、関節、爪、指紋）
   */
  private createHands() {
    for (let side = -1; side <= 1; side += 2) {
      const handGroup = new THREE.Group();
      handGroup.position.set(side * 0.18, 0.98, 0);
      
      const handMat = new THREE.MeshStandardMaterial({
        color: 0xfff5f0,
        roughness: 0.80,
        metalness: 0.02,
      });
      
      // === 手のひら ===
      const palmGeo = new THREE.BoxGeometry(0.045, 0.015, 0.055);
      
      // 頂点を調整して自然な形に
      const palmPositions = palmGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < palmPositions.length; i += 3) {
        const x = palmPositions[i];
        const y = palmPositions[i + 1];
        const z = palmPositions[i + 2];
        
        // 手のひらの丸み
        if (y < 0) {
          palmPositions[i + 1] -= Math.sqrt(x * x + z * z) * 0.05;
        }
      }
      
      palmGeo.computeVertexNormals();
      
      const palm = new THREE.Mesh(palmGeo, handMat);
      palm.castShadow = true;
      palm.receiveShadow = true;
      handGroup.add(palm);
      
      // === 掌紋（手相） ===
      const palmLinesMat = new THREE.LineBasicMaterial({ color: 0xd4b5a0, transparent: true, opacity: 0.4 });
      
      // 生命線
      const lifeLine = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.015, -0.008, 0.020),
        new THREE.Vector3(-0.012, -0.008, 0.000),
        new THREE.Vector3(-0.018, -0.008, -0.022)
      );
      
      const lifeLineGeo = new THREE.BufferGeometry().setFromPoints(lifeLine.getPoints(30));
      const lifeLineMesh = new THREE.Line(lifeLineGeo, palmLinesMat);
      handGroup.add(lifeLineMesh);
      
      // 頭脳線
      const headLine = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.018, -0.008, 0.015),
        new THREE.Vector3(0.000, -0.008, 0.005),
        new THREE.Vector3(0.018, -0.008, -0.005)
      );
      
      const headLineGeo = new THREE.BufferGeometry().setFromPoints(headLine.getPoints(30));
      const headLineMesh = new THREE.Line(headLineGeo, palmLinesMat);
      handGroup.add(headLineMesh);
      
      // 感情線
      const heartLine = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.020, -0.008, 0.020),
        new THREE.Vector3(0.000, -0.008, 0.025),
        new THREE.Vector3(0.020, -0.008, 0.022)
      );
      
      const heartLineGeo = new THREE.BufferGeometry().setFromPoints(heartLine.getPoints(30));
      const heartLineMesh = new THREE.Line(heartLineGeo, palmLinesMat);
      handGroup.add(heartLineMesh);
      
      // === 5本の指 ===
      const fingerData = [
        { name: 'thumb', angle: -40, length: 0.025, baseZ: 0.020, baseX: -0.018 }, // 親指
        { name: 'index', angle: -10, length: 0.035, baseZ: 0.028, baseX: -0.012 }, // 人差し指
        { name: 'middle', angle: 0, length: 0.038, baseZ: 0.028, baseX: 0.000 }, // 中指
        { name: 'ring', angle: 5, length: 0.035, baseZ: 0.028, baseX: 0.010 }, // 薬指
        { name: 'pinky', angle: 10, length: 0.028, baseZ: 0.026, baseX: 0.018 }, // 小指
      ];
      
      for (const finger of fingerData) {
        const fingerGroup = new THREE.Group();
        fingerGroup.position.set(finger.baseX, 0, finger.baseZ);
        fingerGroup.rotation.z = (finger.angle * Math.PI) / 180;
        
        const segmentLength = finger.length / 3;
        let fingerRadius = 0.005;
        
        // 3つの関節（指節）
        for (let segment = 0; segment < 3; segment++) {
          const radius = fingerRadius - segment * 0.001;
          const segmentGeo = new THREE.CylinderGeometry(radius, radius * 0.95, segmentLength, 12);
          const segmentMesh = new THREE.Mesh(segmentGeo, handMat);
          segmentMesh.position.y = segment * segmentLength + segmentLength / 2;
          segmentMesh.castShadow = true;
          fingerGroup.add(segmentMesh);
          
          // 関節のしわ
          if (segment < 2) {
            const jointY = (segment + 1) * segmentLength;
            
            for (let w = 0; w < 3; w++) {
              const wrinkleCurve = new THREE.EllipseCurve(
                0, jointY,
                radius * 0.95, radius * 0.95,
                0, Math.PI * 2,
                false, 0
              );
              
              const wrinklePoints = wrinkleCurve.getPoints(16);
              const wrinkleGeo = new THREE.BufferGeometry().setFromPoints(
                wrinklePoints.map(p => new THREE.Vector3(p.x, p.y + w * 0.0003, 0))
              );
              
              const wrinkleMat = new THREE.LineBasicMaterial({ color: 0xd4b5a0, transparent: true, opacity: 0.3 });
              const wrinkleLine = new THREE.Line(wrinkleGeo, wrinkleMat);
              wrinkleLine.rotation.x = Math.PI / 2;
              fingerGroup.add(wrinkleLine);
            }
          }
        }
        
        // === 爪 ===
        const nailRadius = fingerRadius - 2 * 0.001;
        const nailGeo = new THREE.BoxGeometry(nailRadius * 1.8, 0.001, nailRadius * 1.5);
        
        // 爪を丸く
        const nailPositions = nailGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < nailPositions.length; i += 3) {
          const x = nailPositions[i];
          const z = nailPositions[i + 2];
          
          if (z > 0) {
            nailPositions[i + 2] += Math.sqrt(Math.abs(x)) * 0.002;
          }
        }
        
        nailGeo.computeVertexNormals();
        
        const nailMat = new THREE.MeshStandardMaterial({
          color: 0xfff0e8,
          roughness: 0.2,
          metalness: 0.4,
          transparent: true,
          opacity: 0.9,
        });
        
        const nail = new THREE.Mesh(nailGeo, nailMat);
        nail.position.y = finger.length - 0.003;
        nail.position.z = 0.003;
        nail.castShadow = true;
        fingerGroup.add(nail);
        
        // 爪の半月（lunula）
        const lunaGeo = new THREE.CircleGeometry(0.002, 16, 0, Math.PI);
        const lunaMat = new THREE.MeshBasicMaterial({ color: 0xfff8f5, transparent: true, opacity: 0.7 });
        const luna = new THREE.Mesh(lunaGeo, lunaMat);
        luna.position.y = finger.length - 0.006;
        luna.position.z = 0.003;
        luna.rotation.x = -Math.PI / 2;
        fingerGroup.add(luna);
        
        // === 指紋（指先） ===
        const fingertipY = finger.length;
        
        for (let f = 0; f < 8; f++) {
          const fpRadius = 0.002 + f * 0.0003;
          const fpCurve = new THREE.EllipseCurve(
            0, fingertipY - 0.002,
            fpRadius, fpRadius,
            0, Math.PI * 2,
            false, 0
          );
          
          const fpPoints = fpCurve.getPoints(16);
          const fpGeo = new THREE.BufferGeometry().setFromPoints(
            fpPoints.map(p => new THREE.Vector3(p.x, p.y, 0))
          );
          
          const fpMat = new THREE.LineBasicMaterial({ color: 0xd0a585, transparent: true, opacity: 0.15 });
          const fpLine = new THREE.Line(fpGeo, fpMat);
          fpLine.rotation.x = Math.PI / 2;
          fingerGroup.add(fpLine);
        }
        
        handGroup.add(fingerGroup);
      }
      
      this.group.add(handGroup);
    }
  }
  
  /**
   * 足（つま先、かかと、足の爪）
   */
  private createFeet() {
    for (let side = -1; side <= 1; side += 2) {
      const footGroup = new THREE.Group();
      footGroup.position.set(side * 0.06, 0.36, 0.01);
      
      const footMat = new THREE.MeshStandardMaterial({
        color: 0xfff5f0,
        roughness: 0.85,
        metalness: 0.02,
      });
      
      // === 足の甲 ===
      const footGeo = new THREE.BoxGeometry(0.040, 0.025, 0.065);
      
      const footPositions = footGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < footPositions.length; i += 3) {
        const x = footPositions[i];
        const y = footPositions[i + 1];
        const z = footPositions[i + 2];
        
        // 足の甲のアーチ
        if (y > 0 && z < 0) {
          footPositions[i + 1] += Math.abs(z) * 0.08;
        }
        
        // つま先を丸く
        if (z > 0.025) {
          const dist = Math.sqrt(x * x + (z - 0.025) * (z - 0.025));
          footPositions[i + 2] -= dist * 0.15;
        }
      }
      
      footGeo.computeVertexNormals();
      
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.castShadow = true;
      foot.receiveShadow = true;
      footGroup.add(foot);
      
      // === かかと ===
      const heelGeo = new THREE.SphereGeometry(0.018, 16, 16);
      const heel = new THREE.Mesh(heelGeo, footMat);
      heel.position.z = -0.030;
      heel.position.y = -0.010;
      heel.scale.y = 0.8;
      heel.castShadow = true;
      footGroup.add(heel);
      
      // === 5本のつま先 ===
      const toeData = [
        { x: -0.015, length: 0.012 }, // 小指側
        { x: -0.008, length: 0.014 },
        { x: 0.000, length: 0.016 }, // 中央
        { x: 0.008, length: 0.015 },
        { x: 0.015, length: 0.013 }, // 親指側
      ];
      
      for (const toe of toeData) {
        const toeGeo = new THREE.CapsuleGeometry(0.004, toe.length, 8, 16);
        const toeMesh = new THREE.Mesh(toeGeo, footMat);
        toeMesh.position.set(toe.x, -0.008, 0.030 + toe.length / 2);
        toeMesh.rotation.x = Math.PI / 2;
        toeMesh.castShadow = true;
        footGroup.add(toeMesh);
        
        // 足の爪
        const toeNailGeo = new THREE.CircleGeometry(0.003, 12, 0, Math.PI);
        const toeNailMat = new THREE.MeshStandardMaterial({
          color: 0xfff0e8,
          roughness: 0.3,
          metalness: 0.3,
        });
        
        const toeNail = new THREE.Mesh(toeNailGeo, toeNailMat);
        toeNail.position.set(toe.x, 0.000, 0.030 + toe.length);
        toeNail.rotation.x = -Math.PI / 2;
        toeNail.castShadow = true;
        footGroup.add(toeNail);
      }
      
      this.group.add(footGroup);
    }
  }
  
  /**
   * 肩に止まるうぐいす
   */
  private createShoulderUguisu() {
    this.shoulderUguisu = new DetailedUguisu();
    
    // 右肩に配置
    this.shoulderUguisu.group.position.set(0.13, 1.28, 0.04);
    
    // 体を少し傾けて止まってる感じに
    this.shoulderUguisu.group.rotation.z = -0.2;
    this.shoulderUguisu.group.rotation.y = -Math.PI / 6;
    
    // サイズ調整（リアルサイズに）
    this.shoulderUguisu.group.scale.setScalar(1.5);
    
    this.group.add(this.shoulderUguisu.group);
    
    console.log('[DetailedBody] 肩乗りうぐいす追加完了！');
  }
  
  /**
   * アニメーション更新（うぐいすも動く）
   */
  public update(deltaTime: number) {
    if (this.shoulderUguisu) {
      this.shoulderUguisu.update(deltaTime);
    }
  }
  
  public getBone(name: string): THREE.Bone | undefined {
    return this.bones.get(name);
  }
}
