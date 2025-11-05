# VRabater セットアップガイド 🚀

このガイドに従って、VRabaterを最初から起動できるようにします！

## 📋 前提条件

### 必須ソフトウェア

1. **Node.js** (v18以上)
   - ダウンロード: https://nodejs.org/
   - 確認: `node --version`

2. **Python** (3.10以上)
   - ダウンロード: https://www.python.org/
   - 確認: `python --version`

3. **Ollama** (ローカルLLM)
   - ダウンロード: https://ollama.ai/
   - インストール後、コマンドプロンプトで確認: `ollama --version`

4. **OpenSeeFace** (顔トラッキング)
   - ダウンロード: https://github.com/emilianavt/OpenSeeFace/releases
   - 解凍して任意のフォルダに配置

### 推奨ソフトウェア

- **VB-Cable** (仮想オーディオデバイス)
  - ダウンロード: https://vb-audio.com/Cable/
  - Zoom/Discordで音声を使うために必要

---

## ⚙️ インストール手順

### 1. 依存関係のインストール

```powershell
# プロジェクトルートで実行
npm install

# Web UIの依存関係
cd apps/web
npm install
cd ../..

# Gatewayの依存関係
cd apps/gateway
npm install
cd ../..

# AI Serviceの依存関係（Python）
cd apps/ai
pip install -r requirements.txt
cd ../..
```

### 2. Ollamaモデルのダウンロード

```powershell
# 推奨モデル（日本語最適・低メモリ）
ollama pull qwen2.5:3b-instruct-q4_K_M

# 代替モデル（より軽量）
ollama pull phi4:latest

# 代替モデル（より高性能）
ollama pull llama3.1:8b-instruct-q4_K_M
```

### 3. VRMモデルの準備

#### オプションA: VRoid Studioで自作（推奨）

1. VRoid Studio をダウンロード: https://vroid.com/studio
2. 新規キャラクター作成
3. **白山モチーフ**でカスタマイズ:
   - 髪色: 翠青(#1E6F68) グラデーション
   - 目: 碧い瞳、雪白(#F7F7F7)のハイライト
   - 服: 木肌(#A67C52) + 玄岩(#2E2B2B)
   - アクセ: 六角形の髪飾り（玄武岩モチーフ）
4. エクスポート → VRM
5. ファイル名を `hakusan_avatar.vrm` に変更
6. `assets/vrm/` フォルダに配置

#### オプションB: 既存VRMを使用

1. VRoid Hub等で商用可モデルを探す
2. ダウンロードして `assets/vrm/hakusan_avatar.vrm` に配置
3. `licenses/third_party.md` に出典を記載

### 4. HDRIのダウンロード（オプション）

HDRIがない場合、デフォルトのフォールバック照明が使われます。
高品質な描画には以下から入手を推奨:

1. **Poly Haven**: https://polyhaven.com/hdris
   - `snowy_forest_01_2k.hdr` → `assets/hdris/snow_overcast_2k.hdr`
   - `kloppenheim_02_2k.hdr` → `assets/hdris/mountain_sunset.hdr`
   - `studio_small_03_2k.hdr` → `assets/hdris/indoor_warm.hdr`

2. ダウンロード後、ファイル名をリネームして配置

---

## 🚀 起動方法

### クイックスタート（全サービス一括起動）

```powershell
# PowerShellで実行
.\scripts\start_all.ps1
```

3つの新しいウィンドウが開きます:
- Gateway (WebSocket)
- Web UI (Vite)
- AI Service (Flask)

### 個別起動

#### 1. Gateway起動

```powershell
cd apps/gateway
npm run dev
```

出力例:
```
✅ OSCサーバー起動: 11573
WebSocket: ws://localhost:8080
```

#### 2. Web UI起動

```powershell
cd apps/web
npm run dev
```

出力例:
```
VITE v5.0.8  ready in 500 ms
➜  Local:   http://localhost:5173/
```

#### 3. AI Service起動

```powershell
cd apps/ai
python main.py
```

出力例:
```
✅ Whisper初期化完了
✅ Ollama接続OK
🚀 AIサービス起動: http://localhost:5000
```

#### 4. OpenSeeFace起動

```powershell
# OpenSeeFaceのフォルダで実行
python facetracker.py -c 0 -W 640 -H 480 --discard-after 0 --scan-every 0 --no-3d-adapt 1 --ip 127.0.0.1 --port 11573
```

---

## 🎮 使い方

### 1. ブラウザでアクセス

http://localhost:5173 を開く

### 2. カメラとマイクの許可

ブラウザのポップアップで「許可」をクリック

### 3. UIコントロール

右下のパネルで以下を操作:

- **AI人格**: 手動モード ↔ AIモード
- **ボイスチェンジャー**: オフ ↔ オン
- **ピッチ調整**: スライダーで声の高さ変更
- **照明プリセット**: 雪曇り / 屋内 / 夕景
- **表情**: 絵文字ボタンで瞬間表情

### 4. Zoomで使う

1. **OBS Studio** をインストール: https://obsproject.com/
2. OBSで「ソース」→「ブラウザ」追加
   - URL: `http://localhost:5173`
   - 幅: 1920, 高さ: 1080
3. OBSの「仮想カメラ開始」をクリック
4. Zoomのビデオ設定で「OBS Virtual Camera」を選択

### 5. 音声をZoomに流す

1. **VB-Cable** をインストール
2. Windows サウンド設定で出力を「CABLE Input」に変更
3. Zoomのマイク設定で「CABLE Output」を選択

---

## 🐛 トラブルシューティング

### VRMモデルが表示されない

- `assets/vrm/hakusan_avatar.vrm` が存在するか確認
- ブラウザのコンソール（F12）でエラーを確認
- ファイル名が正確か確認

### 表情が動かない

- OpenSeeFaceが起動しているか確認
- Gatewayが起動しているか確認（`ws://localhost:8080`）
- カメラが他のアプリで使われていないか確認

### AI応答がない

- Ollamaが起動しているか確認: `ollama serve`
- モデルがダウンロード済みか確認: `ollama list`
- AIサービスが起動しているか確認: http://localhost:5000/health

### 音声が聞こえない

- マイクの許可を出したか確認
- ボイスチェンジャーをオンにしているか確認
- ブラウザの音量設定を確認

### パフォーマンスが悪い

- HDRIを軽量版（1K）に変更
- ブラウザの他のタブを閉じる
- VRMモデルのポリゴン数を減らす
- `apps/web/src/config.ts` で `performance.quality` を `low` に変更

---

## 📚 追加情報

### カスタマイズ

- **色の変更**: `apps/web/src/config.ts` の `THEME.colors`
- **キャラ設定**: `apps/ai/main.py` の `CONFIG.llm.system_prompt`
- **表情パラメータ**: `apps/web/src/config.ts` の `avatar.expression`

### 開発者向け

```powershell
# TypeScriptのビルド
cd apps/web
npm run build

# テストの実行
npm test

# 本番ビルド
npm run build
```

---

## ❓ よくある質問

**Q: 商用利用は本当に可能？**
A: はい。使用するVRM、HDRI、フォント等が商用可ライセンスであれば可能です。必ず `licenses/third_party.md` に記録してください。

**Q: GPUは必要？**
A: 不要です。CPUのみで動作します（AI含む）。GPUがあればより快適ですが、必須ではありません。

**Q: オフラインで使える？**
A: はい。初回のモデルダウンロード後は完全オフライン動作です。

**Q: 白山市の公式プロジェクト？**
A: いいえ。非公式の個人プロジェクトです。公式ロゴ等は使用していません。

---

## 🆘 サポート

問題が解決しない場合:
1. GitHub Issues: [プロジェクトURL]/issues
2. ログを確認: ブラウザのコンソール（F12）、ターミナル出力

---

**次のステップ**: README.md で使い方を確認して楽しんでください！ 💙❄️
