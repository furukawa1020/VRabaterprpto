# VRabater - 白山モチーフ3Dアバターシステム 💙❄️

> **非公式・商用利用可 / GPUなし・無料運用 / AI人格切替可能 / Zoom等どこでも使える**

白山手取川ジオパークの自然美をモチーフにした、めちゃくちゃかわいいWebベース3Dアバターシステムです。

## ✨ 特徴

- 🎭 **VRMアバター** - three.js + three-vrm による高品位PBRレンダリング
- 📹 **Webカメラトラッキング** - OpenSeeFaceによるリアルタイム表情追従（CPU動作）
- 🎤 **音声変換** - WebAudioベースのピッチ/フォルマント変換
- 🤖 **AI人格切替** - Ollama(ローカルLLM) + Whisper + Piper による対話機能
- 💎 **白山デザイン** - 雪白・翠青・玄岩・木肌の4色とモチーフ
- 🌐 **どこでも使える** - Zoom/Discord/OBS対応
- 💰 **完全無料** - クラウドコスト0円、すべてローカル処理

## 🎨 デザインコンセプト

### カラーパレット
- **雪白** (#F7F7F7) - 白山の雪
- **翠青** (#1E6F68) - 手取川の碧
- **玄岩** (#2E2B2B) - 火山岩の重み
- **木肌** (#A67C52) - 里山の温もり

### モチーフ
- 川のmeander（蛇行）→ 髪のライン
- 雪の粒子 → パーティクルエフェクト
- 玄武岩の六角形 → アクセサリーパターン
- 伏流水の透明感 → PBRマテリアル設定

## 🚀 クイックスタート

### 必要環境
- Node.js 18以上
- Python 3.10以上（AI機能用）
- Webカメラ
- マイク

### 1. インストール

```powershell
# 依存関係のインストール
npm install

# Web UI
cd apps/web
npm install

# Gateway
cd ../gateway
npm install

# AI サービス（Python）
cd ../ai
pip install -r requirements.txt
```

### 2. モデルのセットアップ

```powershell
# Ollama のインストール（初回のみ）
# https://ollama.ai からダウンロード

# LLMモデルのダウンロード
ollama pull qwen2.5:3b-instruct-q4_K_M

# Whisper モデル（STT）
python apps/ai/download_models.py

# Piper 音声モデル（TTS）
python apps/ai/download_piper.py
```

### 3. 起動

```powershell
# 全サービス一括起動
npm run dev

# または個別起動
npm run dev:web      # Web UI (http://localhost:5173)
npm run dev:gateway  # WebSocket Gateway (ws://localhost:8080)
python apps/ai/main.py  # AI サービス
```

### 4. OpenSeeFaceの起動

```powershell
# OpenSeeFaceを別途ダウンロード後
python facetracker.py -c 0 -W 640 -H 480 --discard-after 0 --scan-every 0 --no-3d-adapt 1
```

## 📁 プロジェクト構造

```
VRabater/
├── apps/
│   ├── web/              # Three.js フロントエンド
│   │   ├── src/
│   │   │   ├── avatar/   # VRM制御・表情・姿勢
│   │   │   ├── audio/    # 音声処理・ボイチェン
│   │   │   ├── tracking/ # トラッキングデータ受信
│   │   │   ├── ui/       # UIコンポーネント
│   │   │   └── main.ts   # エントリーポイント
│   │   └── public/
│   │       └── models/   # VRMファイル
│   ├── gateway/          # OpenSeeFace→WebSocketブリッジ
│   └── ai/               # STT/LLM/TTS パイプライン
├── assets/
│   ├── hdris/            # PBR環境マップ（CC0）
│   ├── vrm/              # ベースVRMモデル
│   └── fonts/            # UIフォント
├── scripts/
│   └── start_all.ps1     # 一括起動スクリプト
└── licenses/
    └── third_party.md    # ライセンス台帳
```

## 🎮 使い方

### 基本操作
1. ブラウザで http://localhost:5173 を開く
2. カメラとマイクのアクセスを許可
3. VRMモデルが表示され、顔の動きに追従します

### AI人格の切替
- **手動モード**: あなた自身が話し、ボイスチェンジャーが適用されます
- **AIモード**: マイクで話すとAIが応答します（STT→LLM→TTS）

### Zoom/Discordで使う
1. OBSで「ブラウザソース」を追加: http://localhost:5173
2. OBSの「仮想カメラ」を開始
3. Zoom/Discordのカメラ設定で「OBS Virtual Camera」を選択
4. 音声は「仮想オーディオデバイス」(VB-Cable等)を経由

## ⚙️ カスタマイズ

### VRMモデルの変更
`apps/web/public/models/` に自作VRMを配置し、`apps/web/src/config.ts` で指定

### AI人格の調整
`apps/ai/prompts/character.txt` でキャラクター設定を編集

### デザインテーマの変更
`apps/web/src/theme.ts` でカラーパレットとビジュアル設定を調整

## 📊 パフォーマンス目標

- **描画**: 30fps以上（1080p）
- **トラッキング遅延**: ≤150ms
- **AI応答**: 2〜4秒（CPU、qwen2.5:3b）
- **メモリ**: ≤4GB（アバター+AI合計）

## 🔒 プライバシー

- すべての処理はローカル実行
- 音声・映像・テキストは外部送信なし
- ログは任意で無効化可能

## 📜 ライセンス

- **プロジェクトコード**: MIT License
- **VRMモデル**: 自作/CC0/商用可ライセンスのみ使用
- **サードパーティ**: `licenses/third_party.md` 参照

**⚠️ 注意**: このプロジェクトは白山市・白山手取川ジオパークの**非公式**プロジェクトです。
公式ロゴ・市章・地図素材は使用していません。

## 🤝 コントリビューション

Issue/PRは歓迎です！ただし以下を守ってください：
- 商用利用可能なアセットのみ
- 公式マークの使用禁止
- プライバシー保護の原則

## 💖 開発者より

白山の自然の美しさと、里山の温かみを、デジタルアバターを通じて表現したいという想いから生まれました。
「めちゃくちゃかわいくて、親しみやすい」キャラクターで、あなたのオンラインコミュニケーションをより楽しく！

---

**作者**: VRabater Project  
**連絡先**: GitHub Issues  
**バージョン**: 1.0.0  
**更新日**: 2025年11月5日
