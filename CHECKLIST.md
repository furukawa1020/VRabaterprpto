# VRabater - インストールチェックリスト

このチェックリストを使って、セットアップが正しく完了しているか確認しましょう！

## ✅ ステップ1: 必須ソフトウェア

- [ ] **Node.js** (v18以上) インストール済み
  ```powershell
  node --version
  # v18.0.0 以上が表示されればOK
  ```

- [ ] **Python** (3.10以上) インストール済み
  ```powershell
  python --version
  # Python 3.10.0 以上が表示されればOK
  ```

- [ ] **Ollama** インストール済み
  ```powershell
  ollama --version
  # バージョンが表示されればOK
  ```

- [ ] **Git** インストール済み（オプション）
  ```powershell
  git --version
  ```

---

## ✅ ステップ2: 依存関係のインストール

- [ ] **ルートディレクトリ**の依存関係
  ```powershell
  cd VRabater
  npm install
  # ✅ が表示されればOK
  ```

- [ ] **Web UI**の依存関係
  ```powershell
  cd apps/web
  npm install
  # node_modules フォルダが作成されればOK
  ```

- [ ] **Gateway**の依存関係
  ```powershell
  cd apps/gateway
  npm install
  # node_modules フォルダが作成されればOK
  ```

- [ ] **AI Service**の依存関係（Python）
  ```powershell
  cd apps/ai
  pip install -r requirements.txt
  # Successfully installed が表示されればOK
  ```

---

## ✅ ステップ3: モデルのダウンロード

- [ ] **Ollamaモデル**のダウンロード
  ```powershell
  ollama pull qwen2.5:3b-instruct-q4_K_M
  # success と表示されればOK（数分かかります）
  ```

- [ ] **Ollamaモデル**の確認
  ```powershell
  ollama list
  # qwen2.5:3b-instruct-q4_K_M が表示されればOK
  ```

- [ ] **Whisperモデル**の準備（初回実行時に自動ダウンロード）
  ```powershell
  cd apps/ai
  python download_models.py
  # 説明が表示されればOK
  ```

---

## ✅ ステップ4: VRMモデルの準備

### オプションA: VRoid Studioで自作

- [ ] VRoid Studio をダウンロード
  https://vroid.com/studio

- [ ] 新規キャラクターを作成

- [ ] 白山カラーでカスタマイズ
  - [ ] 髪色: #1E6F68（翠青）
  - [ ] 目: 碧い瞳
  - [ ] 服: #A67C52（木肌）+ #2E2B2B（玄岩）

- [ ] VRMファイルをエクスポート

- [ ] `hakusan_avatar.vrm` にリネーム

- [ ] `assets/vrm/` に配置

### オプションB: 既存VRMを使用

- [ ] VRoid Hub等で商用可モデルをダウンロード
  https://hub.vroid.com/

- [ ] `assets/vrm/hakusan_avatar.vrm` として配置

- [ ] `licenses/third_party.md` に出典を記録

---

## ✅ ステップ5: HDRI環境マップ（オプション）

- [ ] Poly Havenからダウンロード
  https://polyhaven.com/hdris

- [ ] 以下のファイルを配置:
  - [ ] `assets/hdris/snow_overcast_2k.hdr`
  - [ ] `assets/hdris/indoor_warm.hdr`
  - [ ] `assets/hdris/mountain_sunset.hdr`

**注意**: HDRIがない場合、デフォルト照明が使用されます（動作に問題なし）

---

## ✅ ステップ6: OpenSeeFace（顔トラッキング）

- [ ] OpenSeeFaceをダウンロード
  https://github.com/emilianavt/OpenSeeFace/releases

- [ ] 解凍して任意のフォルダに配置

- [ ] 動作確認（後で実施）

---

## ✅ ステップ7: 起動テスト

### 7-1. Gatewayの起動テスト

- [ ] Gateway起動
  ```powershell
  cd apps/gateway
  npm run dev
  ```

- [ ] 以下が表示されればOK:
  ```
  ✅ OSCサーバー起動: 11573
  WebSocket: ws://localhost:8080
  ```

- [ ] Ctrl+C で停止

### 7-2. Web UIの起動テスト

- [ ] Web UI起動
  ```powershell
  cd apps/web
  npm run dev
  ```

- [ ] 以下が表示されればOK:
  ```
  VITE v5.0.8  ready in 500 ms
  ➜  Local:   http://localhost:5173/
  ```

- [ ] ブラウザで http://localhost:5173 を開く

- [ ] ローディング画面が表示されればOK

- [ ] Ctrl+C で停止

### 7-3. AI Serviceの起動テスト

- [ ] Ollama起動（別ウィンドウで）
  ```powershell
  ollama serve
  ```

- [ ] AI Service起動
  ```powershell
  cd apps/ai
  python main.py
  ```

- [ ] 以下が表示されればOK:
  ```
  ✅ Whisper初期化完了
  ✅ Ollama接続OK
  🚀 AIサービス起動: http://localhost:5000
  ```

- [ ] ブラウザで http://localhost:5000/health を開く

- [ ] JSON応答が表示されればOK

- [ ] Ctrl+C で停止

---

## ✅ ステップ8: 統合テスト（全サービス起動）

- [ ] 一括起動スクリプト実行
  ```powershell
  .\scripts\start_all.ps1
  ```

- [ ] 3つのウィンドウが開く:
  - [ ] Gateway
  - [ ] Web UI
  - [ ] AI Service

- [ ] ブラウザで http://localhost:5173 を開く

- [ ] カメラとマイクのアクセスを許可

- [ ] VRMモデルが表示される

---

## ✅ ステップ9: 機能テスト

### 基本機能

- [ ] **表情ボタン**をクリックして表情が変わる

- [ ] **ボイスチェンジャー**をオンにして話すと声が変わる

- [ ] **ピッチスライダー**を動かすと声の高さが変わる

- [ ] **照明プリセット**を変更して見た目が変わる

### AI機能（オプション）

- [ ] **AI人格**を「AIモード」に切り替え

- [ ] マイクで話しかける

- [ ] AI応答が返ってくる（2〜4秒後）

### トラッキング（OpenSeeFace必要）

- [ ] OpenSeeFaceを起動
  ```powershell
  python facetracker.py -c 0 -W 640 -H 480 --discard-after 0 --scan-every 0 --no-3d-adapt 1
  ```

- [ ] 顔を動かすとアバターが追従する

- [ ] 口を開けるとアバターの口が開く

- [ ] まばたきすると自動で反映される

---

## ✅ ステップ10: 外部連携（オプション）

### OBS Studio（Zoom/Discord用）

- [ ] OBS Studioをインストール
  https://obsproject.com/

- [ ] 「ソース」→「ブラウザ」追加

- [ ] URL: `http://localhost:5173`

- [ ] 幅: 1920, 高さ: 1080

- [ ] 「仮想カメラ開始」

- [ ] Zoomでカメラに「OBS Virtual Camera」を選択

### VB-Cable（音声）

- [ ] VB-Cableをインストール
  https://vb-audio.com/Cable/

- [ ] Windows設定で出力を「CABLE Input」に変更

- [ ] Zoomでマイクに「CABLE Output」を選択

---

## 🎉 完了！

すべてのチェックが完了したら、VRabaterを楽しんでください！

---

## ❓ トラブルが発生した場合

1. **このチェックリスト**でどこまで完了したか確認
2. **FAQ.md**で該当する問題を検索
3. **GitHub Issues**で質問（このチェックリストの進捗を添えて）

---

## 📝 メモ欄

問題が発生した場合、ここにメモを残しておきましょう:

```
[日付] [問題内容]
例: 2025-11-05 VRMモデルが表示されない → ファイル名の拡張子が .VRM（大文字）だった
```

---

**次のステップ**: すべて完了したら、`README.md`を読んで使い方を確認しましょう！🚀
