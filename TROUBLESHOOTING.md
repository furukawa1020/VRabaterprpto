# VRabater トラブルシューティングガイド

このガイドは、VRabaterで発生する可能性のある問題と解決方法をまとめています。

---

## 🔍 一般的な問題

### 問題: プロジェクトが起動しない

**症状**: `npm run dev` や起動スクリプトを実行してもエラーが出る

**解決方法**:

1. **依存関係を再インストール**
   ```powershell
   # プロジェクトルートで
   rm -rf node_modules
   npm install
   
   # 各アプリでも
   cd apps/web
   rm -rf node_modules
   npm install
   ```

2. **Node.jsのバージョン確認**
   ```powershell
   node --version
   # v18.0.0 以上が必要
   ```

3. **ポートの競合確認**
   ```powershell
   # 使用中のポートを確認
   netstat -ano | findstr :5173
   netstat -ano | findstr :8080
   netstat -ano | findstr :5000
   
   # プロセスを停止（PIDを確認後）
   taskkill /PID [PID番号] /F
   ```

---

## 🎭 VRM関連の問題

### 問題: VRMモデルが表示されない

**症状**: ブラウザにアバターが表示されない、黒い画面のまま

**解決方法**:

1. **ファイルの存在確認**
   ```powershell
   # VRMファイルがあるか確認
   ls assets/vrm/hakusan_avatar.vrm
   ```

2. **ファイル名の確認**
   - 拡張子は `.vrm`（小文字）
   - スペースや特殊文字が含まれていないか

3. **ブラウザのコンソールを確認**
   - F12 → Console タブ
   - エラーメッセージを確認

4. **VRMファイルの妥当性確認**
   - VRoid Hub Viewer等で開けるか確認
   - ファイルサイズが0バイトでないか確認

5. **代替パスを指定**
   `apps/web/src/config.ts`:
   ```typescript
   avatar: {
     defaultModel: '/models/your_model.vrm',
   }
   ```

---

### 問題: VRMの表示が崩れる・テクスチャがおかしい

**症状**: モデルの色がおかしい、真っ白、真っ黒

**解決方法**:

1. **HDRIが読み込めていない可能性**
   - `assets/hdris/` にHDRIファイルを配置
   - または `config.ts` でフォールバック照明を使用

2. **ブラウザのハードウェアアクセラレーションを確認**
   - Chrome: `chrome://settings/system`
   - 「ハードウェア アクセラレーションが使用可能な場合は使用する」をON

3. **VRMの仕様を確認**
   - VRM 0.0 or VRM 1.0？
   - three-vrm が対応しているか確認

---

## 📹 トラッキング関連の問題

### 問題: 表情が動かない

**症状**: OpenSeeFaceを起動しているのに反応しない

**解決方法**:

1. **Gatewayの起動確認**
   ```powershell
   # Gateway のログを確認
   cd apps/gateway
   npm run dev
   
   # 以下が表示されるはず:
   # ✅ OSCサーバー起動: 11573
   ```

2. **OpenSeeFaceのポート確認**
   ```powershell
   # OpenSeeFace起動時にポート指定
   python facetracker.py -c 0 -W 640 -H 480 \
     --ip 127.0.0.1 --port 11573
   ```

3. **WebSocket接続の確認**
   - ブラウザのコンソール（F12）で確認
   - `WebSocket connection to 'ws://localhost:8080' failed` が出ていないか

4. **カメラが使用可能か確認**
   ```powershell
   # カメラのリスト確認（OpenSeeFaceのフォルダで）
   python facetracker.py -l
   ```

5. **ファイアウォールの確認**
   - Windows Defenderでポート8080, 11573が許可されているか

---

### 問題: カメラにアクセスできない

**症状**: 「カメラへのアクセスが拒否されました」

**解決方法**:

1. **ブラウザの権限を確認**
   - Chrome: `chrome://settings/content/camera`
   - localhost を許可リストに追加

2. **カメラが他のアプリで使用中でないか確認**
   - Zoom、Skype等を終了

3. **デバイスマネージャーで確認**
   - カメラが正常に認識されているか

---

## 🎤 音声関連の問題

### 問題: 音声が聞こえない

**症状**: ボイスチェンジャーをオンにしても音が出ない

**解決方法**:

1. **マイクの権限を確認**
   - ブラウザで「マイクへのアクセス」を許可

2. **入力デバイスの選択**
   - VRabater UIで正しいマイクを選択

3. **音量レベルを確認**
   - Windows設定 → サウンド → 入力デバイス
   - マイクのテストで音が入るか確認

4. **ブラウザのミュート確認**
   - タブがミュートされていないか

---

### 問題: ボイスチェンジャーが効かない

**症状**: 声の高さが変わらない

**解決方法**:

1. **ボイスチェンジャーがオンになっているか確認**
   - UI右下のトグルボタンを確認

2. **ピッチ値を極端に設定してテスト**
   - スライダーを +12 や -12 にして変化を確認

3. **ブラウザのコンソールでエラー確認**
   - F12 → Console
   - Tone.js関連のエラーがないか

4. **WebAudioContext の状態確認**
   ```javascript
   // ブラウザコンソールで実行
   console.log(Tone.context.state);
   // "running" が表示されるはず
   ```

---

## 🤖 AI関連の問題

### 問題: AI応答がない

**症状**: AIモードにしても反応しない

**解決方法**:

1. **Ollamaが起動しているか確認**
   ```powershell
   # 別ウィンドウで実行
   ollama serve
   ```

2. **モデルがダウンロード済みか確認**
   ```powershell
   ollama list
   # qwen2.5:3b-instruct-q4_K_M が表示されるはず
   ```

3. **AIサービスが起動しているか確認**
   ```powershell
   cd apps/ai
   python main.py
   
   # http://localhost:5000/health にアクセスして確認
   ```

4. **AIサービスのログを確認**
   - ターミナルにエラーが出ていないか

5. **Ollamaのバージョン確認**
   ```powershell
   ollama --version
   # 最新版を推奨
   ```

---

### 問題: AI応答が遅い・タイムアウトする

**症状**: 応答に10秒以上かかる、途中で止まる

**解決方法**:

1. **より軽量なモデルに変更**
   ```powershell
   # 1.5GBの軽量モデル
   ollama pull phi4:latest
   ```
   
   `apps/ai/main.py` の設定を変更:
   ```python
   "model": "phi4:latest",
   ```

2. **maxTokensを減らす**
   ```python
   "max_tokens": 50,  # デフォルト100から50に
   ```

3. **temperatureを下げる**
   ```python
   "temperature": 0.5,  # デフォルト0.8から0.5に
   ```

4. **CPUの負荷を確認**
   - タスクマネージャーでCPU使用率を確認
   - 他のアプリを終了

---

### 問題: Whisper（STT）が動かない

**症状**: 音声認識ができない

**解決方法**:

1. **Whisperがインストールされているか確認**
   ```powershell
   pip list | findstr whisper
   # openai-whisper が表示されるはず
   ```

2. **再インストール**
   ```powershell
   pip uninstall openai-whisper
   pip install openai-whisper
   ```

3. **より軽量なモデルに変更**
   `apps/ai/main.py`:
   ```python
   "stt": {
     "model": "tiny",  # base から tiny に変更
   }
   ```

---

## 💻 パフォーマンス関連の問題

### 問題: FPSが低い・カクカクする

**症状**: 30fps以下、動きが重い

**解決方法**:

1. **品質設定を下げる**
   `apps/web/src/config.ts`:
   ```typescript
   performance: {
     quality: 'low',  // 'high' から 'low' に
   }
   ```

2. **HDRIを軽量化**
   - 2K → 1K版に変更
   - または削除してデフォルト照明を使用

3. **VRMモデルを軽量化**
   - ポリゴン数を減らす
   - テクスチャサイズを小さくする（2K → 1K）

4. **ブラウザの他のタブを閉じる**

5. **ハードウェアアクセラレーションを有効化**
   - Chrome: `chrome://settings/system`

---

### 問題: メモリ不足エラー

**症状**: 「Out of memory」エラー

**解決方法**:

1. **ブラウザを再起動**

2. **他のアプリを終了**

3. **より軽量なLLMモデルに変更**
   ```powershell
   ollama pull qwen2.5:1.5b-instruct-q4_K_M
   ```

4. **VRMモデルを軽量化**

---

## 🌐 ブラウザ関連の問題

### 問題: Safariで動かない

**症状**: Safari（macOS）で表示されない

**解決方法**:

1. **Chrome/Edgeを使用（推奨）**
   - SafariはWebAudio APIに制約あり

2. **Safari 実験的機能を有効化**
   - 開発 → 実験的機能 → WebGPU等を有効

3. **macOSとSafariのバージョンを最新に**

---

### 問題: Firefoxで音が出ない

**症状**: Firefoxでボイスチェンジャーが動かない

**解決方法**:

1. **Chrome/Edgeを使用（推奨）**
   - FirefoxはTone.jsに一部制約

2. **Firefoxの設定を確認**
   - `about:config` → `media.webaudio.enabled` を true

---

## 🔧 開発者向けの問題

### 問題: TypeScriptのコンパイルエラー

**症状**: `tsc` や `npm run build` でエラー

**解決方法**:

1. **型定義をインストール**
   ```powershell
   npm install --save-dev @types/three @types/ws
   ```

2. **node_modulesを再構築**
   ```powershell
   rm -rf node_modules
   npm install
   ```

3. **tsconfig.json を確認**
   - `skipLibCheck: true` が有効か

---

### 問題: Viteのビルドエラー

**症状**: `npm run build` が失敗

**解決方法**:

1. **キャッシュをクリア**
   ```powershell
   rm -rf .vite
   npm run build
   ```

2. **依存関係を更新**
   ```powershell
   npm update
   ```

---

## 📱 Zoom/Discord連携の問題

### 問題: OBSに映像が表示されない

**症状**: ブラウザソースで真っ黒

**解決方法**:

1. **URLが正確か確認**
   - `http://localhost:5173`（https ではない）

2. **OBSのブラウザソース設定**
   - 幅: 1920, 高さ: 1080
   - 「ページを再読み込み」をクリック

3. **VRMが読み込まれているか確認**
   - ブラウザで直接アクセスして確認

---

### 問題: 音声がZoomに届かない

**症状**: Zoomで相手に声が聞こえない

**解決方法**:

1. **VB-Cableが正しくインストールされているか**
   - Windows設定 → サウンド
   - 「CABLE Input」が表示されるか

2. **出力デバイスを確認**
   - ブラウザの出力を「CABLE Input」に設定

3. **Zoomの設定を確認**
   - マイク: CABLE Output
   - 「マイクの音量を自動調整」をオフ

---

## 🆘 その他の問題

### システムチェッカーを実行

すべての設定を自動チェック:

```powershell
python scripts/check_system.py
```

このスクリプトが、不足している要素を教えてくれます。

---

## 📞 サポート

それでも解決しない場合:

1. **GitHub Issues**: プロジェクトのIssueページで質問
2. **ログを添付**: ブラウザコンソール（F12）のログをコピー
3. **環境情報を提供**:
   - OS: Windows 10/11, macOS版数
   - ブラウザ: Chrome 120等
   - Node.js/Python/Ollamaのバージョン

---

**最終更新**: 2025年11月5日
