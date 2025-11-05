/**
 * DetailedUguisu.ts
 * 白山市の鳥「うぐいす」を羽根一枚一枚まで細かく
 * 
 * - 体: ぽってり丸い、羽毛のテクスチャ
 * - 羽: 左右各50枚の羽根（風切羽・雨覆）
 * - 尾羽: 12枚の尾羽
 * - 足: 3本指+後ろ指、爪付き
 * - くちばし: 細く尖った形状
 * - 目: つぶらな瞳、まばたき
 * - アニメーション: 首かしげ、羽ばたき、さえずり
 */

import * as THREE from 'three';

export class DetailedUguisu {
  public group: THREE.Group;
  
  private bodyMesh!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private leftWingFeathers: THREE.Mesh[] = [];
  private rightWingFeathers: THREE.Mesh[] = [];
  private tailFeathers: THREE.Mesh[] = [];
  
  private animationTimer: number = 0;
  private blinkTimer: number = 0;
  private chirpTimer: number = 0;
  
  // うぐいす色
  private readonly UGUISU_COLOR = 0x928C36; // 鶯色
  private readonly BEAK_COLOR = 0x4A3C1A; // くちばし
  
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Uguisu';
    
    this.createBody();
    this.createHead();
    this.createWings();
    this.createTail();
    this.createLegs();
    this.createFeet();
    
    console.log('[DetailedUguisu] うぐいす生成完了！羽根112枚');
  }
  
  /**
   * 体（ぽってり丸い、羽毛テクスチャ）
   */
  private createBody() {
    // === 体の基本形状 ===
    const bodyGeo = new THREE.SphereGeometry(0.012, 32, 32);
    
    // ぽってり形状に調整
    const positions = bodyGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // 前後に伸ばす（楕円形）
      positions[i + 2] *= 1.3;
      
      // お腹を膨らませる
      if (y < 0 && z > 0) {
        positions[i + 1] -= 0.002;
        positions[i + 2] += 0.001;
      }
      
      // 背中を丸く
      if (y > 0) {
        positions[i + 1] += Math.abs(z) * 0.1;
      }
    }
    
    bodyGeo.computeVertexNormals();
    
    // === 羽毛のテクスチャ ===
    const featherCanvas = document.createElement('canvas');
    featherCanvas.width = 512;
    featherCanvas.height = 512;
    const ctx = featherCanvas.getContext('2d')!;
    
    // ベース色（グラデーション）
    const gradient = ctx.createLinearGradient(0, 512, 0, 0);
    gradient.addColorStop(0, '#E8E4B8'); // お腹（薄い）
    gradient.addColorStop(0.4, '#B8B070');
    gradient.addColorStop(1, '#928C36'); // 背中（濃い）
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // 羽毛の模様（500本）
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const length = 3 + Math.random() * 8;
      const angle = Math.random() * Math.PI * 2;
      
      // 羽毛の色（位置によって変える）
      const darkness = y / 512; // 上（背中）ほど濃い
      const alpha = 0.15 + darkness * 0.25;
      ctx.strokeStyle = `rgba(70, 60, 30, ${alpha})`;
      ctx.lineWidth = 0.5;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
    
    // 羽毛のふわふわ感（ハイライト）
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256; // 背中側
      ctx.fillStyle = `rgba(180, 176, 112, ${0.2 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const featherTexture = new THREE.CanvasTexture(featherCanvas);
    
    const bodyMat = new THREE.MeshStandardMaterial({
      map: featherTexture,
      color: this.UGUISU_COLOR,
      roughness: 0.9,
      metalness: 0.05,
    });
    
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);
  }
  
  /**
   * 頭（丸い、目、くちばし）
   */
  private createHead() {
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.008, 0.014);
    
    // === 頭の球 ===
    const headGeo = new THREE.SphereGeometry(0.007, 24, 24);
    const headMat = new THREE.MeshStandardMaterial({
      color: this.UGUISU_COLOR,
      roughness: 0.9,
      metalness: 0.05,
    });
    
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.headMesh.castShadow = true;
    headGroup.add(this.headMesh);
    
    // === 目（左右）===
    for (let side = -1; side <= 1; side += 2) {
      // 白目
      const eyeWhiteGeo = new THREE.SphereGeometry(0.0015, 12, 12);
      const eyeWhiteMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
      });
      
      const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      eyeWhite.position.set(side * 0.004, 0.002, 0.006);
      eyeWhite.name = side < 0 ? 'leftEye' : 'rightEye';
      headGroup.add(eyeWhite);
      
      // 黒目
      const pupilGeo = new THREE.SphereGeometry(0.001, 12, 12);
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(side * 0.004, 0.002, 0.0072);
      headGroup.add(pupil);
      
      // ハイライト
      const highlightGeo = new THREE.SphereGeometry(0.0003, 8, 8);
      const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      
      const highlight = new THREE.Mesh(highlightGeo, highlightMat);
      highlight.position.set(side * 0.0038, 0.0025, 0.0075);
      headGroup.add(highlight);
    }
    
    // === くちばし ===
    const beakGeo = new THREE.ConeGeometry(0.0008, 0.003, 8);
    const beakMat = new THREE.MeshStandardMaterial({
      color: this.BEAK_COLOR,
      roughness: 0.7,
      metalness: 0.1,
    });
    
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 0, 0.0085);
    beak.rotation.x = Math.PI / 2;
    beak.castShadow = true;
    headGroup.add(beak);
    
    this.group.add(headGroup);
  }
  
  /**
   * 翼（左右各50枚の羽根）
   */
  private createWings() {
    for (let side = -1; side <= 1; side += 2) {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(side * 0.008, 0.002, 0);
      wingGroup.name = side < 0 ? 'leftWing' : 'rightWing';
      
      const featherArray = side < 0 ? this.leftWingFeathers : this.rightWingFeathers;
      
      // === 風切羽（Primary Flight Feathers）20枚 ===
      for (let i = 0; i < 20; i++) {
        const feather = this.createFeather({
          length: 0.012 - i * 0.0003,
          width: 0.003,
          color: this.UGUISU_COLOR,
          darkTip: true,
        });
        
        const angle = (i / 20) * Math.PI * 0.5;
        feather.position.set(
          side * Math.cos(angle) * 0.003,
          -Math.sin(angle) * 0.002,
          -0.002 - i * 0.0004
        );
        feather.rotation.y = side * (Math.PI / 2 - angle);
        feather.rotation.z = side * angle * 0.3;
        
        wingGroup.add(feather);
        featherArray.push(feather);
      }
      
      // === 雨覆（Covert Feathers）30枚 ===
      for (let i = 0; i < 30; i++) {
        const row = Math.floor(i / 10);
        const col = i % 10;
        
        const feather = this.createFeather({
          length: 0.006 - row * 0.001,
          width: 0.002,
          color: this.UGUISU_COLOR,
          darkTip: false,
        });
        
        feather.position.set(
          side * col * 0.0008,
          0.001 - row * 0.001,
          0.002 - col * 0.0005
        );
        feather.rotation.y = side * Math.PI / 4;
        
        wingGroup.add(feather);
        featherArray.push(feather);
      }
      
      this.group.add(wingGroup);
    }
  }
  
  /**
   * 尾羽（12枚）
   */
  private createTail() {
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0, -0.015);
    
    for (let i = 0; i < 12; i++) {
      const feather = this.createFeather({
        length: 0.014,
        width: 0.0025,
        color: this.UGUISU_COLOR,
        darkTip: true,
      });
      
      const spreadAngle = ((i - 5.5) / 12) * Math.PI * 0.4;
      
      feather.position.set(
        Math.sin(spreadAngle) * 0.003,
        -Math.abs(Math.sin(spreadAngle)) * 0.002,
        -Math.cos(spreadAngle) * 0.002
      );
      feather.rotation.y = spreadAngle;
      feather.rotation.x = -Math.PI / 6;
      
      tailGroup.add(feather);
      this.tailFeathers.push(feather);
    }
    
    this.group.add(tailGroup);
  }
  
  /**
   * 羽根を生成（羽軸、羽弁）
   */
  private createFeather(options: {
    length: number;
    width: number;
    color: number;
    darkTip: boolean;
  }): THREE.Mesh {
    const { length, width, color, darkTip } = options;
    
    // === 羽弁（Vane）の形状 ===
    const vaneShape = new THREE.Shape();
    
    // 羽軸を中心に左右非対称
    vaneShape.moveTo(0, 0);
    
    // 右側（広い）
    vaneShape.quadraticCurveTo(
      width * 0.6, length * 0.3,
      width, length * 0.7
    );
    vaneShape.quadraticCurveTo(
      width * 0.5, length * 0.9,
      0, length
    );
    
    // 左側（狭い）
    vaneShape.lineTo(0, length);
    vaneShape.quadraticCurveTo(
      -width * 0.3, length * 0.9,
      -width * 0.4, length * 0.7
    );
    vaneShape.quadraticCurveTo(
      -width * 0.4, length * 0.3,
      0, 0
    );
    
    const vaneGeo = new THREE.ShapeGeometry(vaneShape);
    
    // === テクスチャ（羽弁の繊維） ===
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // ベース色
    const baseColor = darkTip ? '#6B6530' : '#928C36';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 64, 128);
    
    // 先端を暗く
    if (darkTip) {
      const tipGrad = ctx.createLinearGradient(0, 0, 0, 128);
      tipGrad.addColorStop(0, 'rgba(50, 40, 20, 0)');
      tipGrad.addColorStop(0.8, 'rgba(50, 40, 20, 0)');
      tipGrad.addColorStop(1, 'rgba(50, 40, 20, 0.5)');
      ctx.fillStyle = tipGrad;
      ctx.fillRect(0, 0, 64, 128);
    }
    
    // 羽弁の繊維（50本）
    ctx.strokeStyle = 'rgba(70, 60, 30, 0.2)';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < 50; i++) {
      const y = (i / 50) * 128;
      const xOffset = Math.sin(i * 0.5) * 2;
      
      ctx.beginPath();
      ctx.moveTo(32 + xOffset, y);
      ctx.lineTo(60, y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(32 + xOffset, y);
      ctx.lineTo(4, y);
      ctx.stroke();
    }
    
    const featherTexture = new THREE.CanvasTexture(canvas);
    
    const featherMat = new THREE.MeshStandardMaterial({
      map: featherTexture,
      color: color,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    
    const featherMesh = new THREE.Mesh(vaneGeo, featherMat);
    featherMesh.castShadow = true;
    
    // === 羽軸（Rachis） ===
    const rachisGeo = new THREE.CylinderGeometry(0.0001, 0.00005, length, 8);
    const rachisMat = new THREE.MeshStandardMaterial({
      color: 0x4A3C1A,
      roughness: 0.7,
    });
    
    const rachis = new THREE.Mesh(rachisGeo, rachisMat);
    rachis.position.y = length / 2;
    rachis.castShadow = true;
    featherMesh.add(rachis);
    
    return featherMesh;
  }
  
  /**
   * 脚
   */
  private createLegs() {
    for (let side = -1; side <= 1; side += 2) {
      const legGeo = new THREE.CylinderGeometry(0.0002, 0.0002, 0.006, 8);
      const legMat = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.9,
      });
      
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(side * 0.003, -0.009, 0);
      leg.castShadow = true;
      this.group.add(leg);
    }
  }
  
  /**
   * 足（3本指+後ろ指、爪付き）
   */
  private createFeet() {
    for (let side = -1; side <= 1; side += 2) {
      const footGroup = new THREE.Group();
      footGroup.position.set(side * 0.003, -0.012, 0);
      
      // === 前の3本指 ===
      for (let toe = 0; toe < 3; toe++) {
        const angle = ((toe - 1) / 3) * Math.PI * 0.6;
        
        const toeGeo = new THREE.CylinderGeometry(0.00015, 0.0001, 0.003, 6);
        const toeMat = new THREE.MeshStandardMaterial({
          color: 0x8B7355,
          roughness: 0.9,
        });
        
        const toeMesh = new THREE.Mesh(toeGeo, toeMat);
        toeMesh.position.set(
          Math.sin(angle) * 0.0015,
          -0.0015,
          Math.cos(angle) * 0.002
        );
        toeMesh.rotation.x = Math.PI / 2 - angle * 0.5;
        toeMesh.castShadow = true;
        footGroup.add(toeMesh);
        
        // 爪
        const clawGeo = new THREE.ConeGeometry(0.00008, 0.0005, 6);
        const clawMat = new THREE.MeshStandardMaterial({
          color: 0x4A3C1A,
          roughness: 0.7,
        });
        
        const claw = new THREE.Mesh(clawGeo, clawMat);
        claw.position.set(
          Math.sin(angle) * 0.002,
          -0.003,
          Math.cos(angle) * 0.0035
        );
        claw.rotation.x = Math.PI / 2;
        claw.castShadow = true;
        footGroup.add(claw);
      }
      
      // === 後ろ指 ===
      const backToeGeo = new THREE.CylinderGeometry(0.00015, 0.0001, 0.002, 6);
      const backToeMat = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.9,
      });
      
      const backToe = new THREE.Mesh(backToeGeo, backToeMat);
      backToe.position.set(0, -0.001, -0.002);
      backToe.rotation.x = -Math.PI / 4;
      backToe.castShadow = true;
      footGroup.add(backToe);
      
      // 後ろ爪
      const backClawGeo = new THREE.ConeGeometry(0.00008, 0.0005, 6);
      const backClawMat = new THREE.MeshStandardMaterial({
        color: 0x4A3C1A,
        roughness: 0.7,
      });
      
      const backClaw = new THREE.Mesh(backClawGeo, backClawMat);
      backClaw.position.set(0, -0.0015, -0.0035);
      backClaw.rotation.x = Math.PI / 2;
      backClaw.castShadow = true;
      footGroup.add(backClaw);
      
      this.group.add(footGroup);
    }
  }
  
  /**
   * アニメーション更新
   */
  public update(deltaTime: number) {
    this.animationTimer += deltaTime;
    this.blinkTimer += deltaTime;
    this.chirpTimer += deltaTime;
    
    // === 首かしげ ===
    const headTilt = Math.sin(this.animationTimer * 2) * 0.3;
    this.headMesh.rotation.z = headTilt;
    
    // === まばたき（5秒周期） ===
    if (this.blinkTimer > 5.0) {
      this.blinkBird();
      this.blinkTimer = 0;
    }
    
    // === 羽ばたき（呼吸のような動き） ===
    const wingFlap = Math.sin(this.animationTimer * 3) * 0.15;
    
    const leftWing = this.group.getObjectByName('leftWing');
    const rightWing = this.group.getObjectByName('rightWing');
    
    if (leftWing) leftWing.rotation.z = wingFlap;
    if (rightWing) rightWing.rotation.z = -wingFlap;
    
    // === 尾羽の揺れ ===
    this.tailFeathers.forEach((feather, index) => {
      const sway = Math.sin(this.animationTimer * 2 + index * 0.3) * 0.1;
      feather.rotation.x = -Math.PI / 6 + sway;
    });
    
    // === さえずり（10秒周期でくちばく開閉） ===
    if (this.chirpTimer > 10.0 && this.chirpTimer < 10.5) {
      const chirpProgress = (this.chirpTimer - 10.0) * 4;
      const beakOpen = Math.sin(chirpProgress * Math.PI) * 0.3;
      
      // くちばしを探して開閉
      this.headMesh.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.geometry.type === 'ConeGeometry') {
          obj.rotation.x = Math.PI / 2 + beakOpen;
        }
      });
    }
    
    if (this.chirpTimer > 12.0) {
      this.chirpTimer = 0;
    }
  }
  
  /**
   * まばたき
   */
  private blinkBird() {
    const leftEye = this.group.getObjectByName('leftEye');
    const rightEye = this.group.getObjectByName('rightEye');
    
    if (leftEye && rightEye) {
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 150, 1);
        
        if (progress < 0.5) {
          leftEye.scale.y = 1 - progress * 2 * 0.9;
          rightEye.scale.y = 1 - progress * 2 * 0.9;
        } else {
          leftEye.scale.y = 0.1 + (progress - 0.5) * 2 * 0.9;
          rightEye.scale.y = 0.1 + (progress - 0.5) * 2 * 0.9;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          leftEye.scale.y = 1;
          rightEye.scale.y = 1;
        }
      };
      
      animate();
    }
  }
}
