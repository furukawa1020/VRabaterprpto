# VRabater - よくある質問（FAQ）

## 一般的な質問

### Q1: VRabaterとは何ですか？

A: VRabaterは、Webブラウザ上で動作する3Dアバターシステムです。Webカメラの映像から表情を読み取り、VRMモデルをリアルタイムで動かします。音声変換やAI人格との対話機能も搭載しています。

---

### Q2: 完全無料で使えますか？

A: はい、すべてローカル実行で、クラウドサービスは使用しません。
- ソフトウェア: 無料（Ollama、Whisper等）
- モデル: VRMは自作 or 商用可モデル使用
- HDRI: CC0（パブリックドメイン）推奨
- ランニングコスト: 0円

---

### Q3: GPUは必要ですか？

A: **不要**です。CPU のみで動作します。
- 3D描画: three.js（WebGL）
- AI推論: Ollama（CPU量子化モデル）
- 音声処理: Web Audio API

GPUがあればより快適ですが、必須ではありません。

---

### Q4: 商用利用は可能ですか？

A: **可能**です。ただし以下を守ってください:
- 使用するVRM・HDRI・フォントが商用可ライセンスであること
- `licenses/third_party.md` に出典を記録
- 公式ロゴ・市章・地図素材を使わない

---

### Q5: 白山市の公式プロジェクトですか？

A: **いいえ、非公式**です。
- 白山市・白山手取川ジオパークとは無関係
- モチーフ（色・形状・語彙）は抽象化された連想表現
- 公式マークは一切使用していません

---

## 技術的な質問

### Q6: 対応OSは？

A: 以下のOSで動作確認済み:
- Windows 10/11
- macOS (Intel / Apple Silicon)
- Linux (Ubuntu 22.04以降)

---

### Q7: 必要なスペックは？

**最小構成**:
- CPU: Intel Core i5 / AMD Ryzen 5 以上
- RAM: 8GB以上
- ストレージ: 10GB以上の空き容量
- Webカメラ（内蔵 or 外付け）
- マイク

**推奨構成**:
- CPU: Intel Core i7 / AMD Ryzen 7 以上
- RAM: 16GB以上
- GPU: あれば快適（必須ではない）

---

### Q8: どのブラウザで動きますか？

推奨:
- Google Chrome（最新版）
- Microsoft Edge（最新版）

動作可能:
- Firefox（WebAudio機能に制約あり）
- Safari（macOS、一部機能制限）

非対応:
- Internet Explorer

---

### Q9: VRMモデルはどこで入手できますか？

**自作（推奨）**:
- VRoid Studio（無料）: https://vroid.com/studio

**既存モデル**:
- VRoid Hub: https://hub.vroid.com/
- BOOTH: https://booth.pm/
- ニコニ立体: https://3d.nicovideo.jp/

**重要**: 商用利用可のライセンスを確認してください。

---

### Q10: HDRIはどこで入手できますか？

**推奨サイト（CC0）**:
- Poly Haven: https://polyhaven.com/hdris
- HDRI Haven: https://hdrihaven.com/

解像度は 2K (2048x1024) を推奨。4Kは重い場合があります。

---

## 機能に関する質問

### Q11: Zoom/Discordで使えますか？

A: **使えます**。以下の方法で:

**OBS経由（推奨）**:
1. OBS Studioをインストール
2. ブラウザソースで `http://localhost:5173` を追加
3. OBSの「仮想カメラ開始」
4. Zoom/Discordで「OBS Virtual Camera」を選択

---

### Q12: 音声はどうやって相手に届けますか？

A: **仮想オーディオデバイス**を使います:

1. VB-Cable（無料）をインストール: https://vb-audio.com/Cable/
2. Windows設定で出力を「CABLE Input」に変更
3. Zoom/Discordで入力を「CABLE Output」に選択

---

### Q13: AI人格は日本語で話せますか？

A: **はい**、日本語対応しています。
- LLM: `qwen2.5:3b-instruct-q4_K_M`（日本語強化）
- STT: Whisper（日本語認識）
- TTS: Piper（日本語音声、将来実装）

---

### Q14: オフラインで使えますか？

A: **使えます**。ただし、初回のみ以下のダウンロードが必要:
- Ollamaモデル（LLM）
- Whisperモデル（STT）
- VRM・HDRI

その後は完全オフライン動作します。

---

## トラブルシューティング

### Q15: VRMが表示されません

**確認項目**:
1. `assets/vrm/hakusan_avatar.vrm` が存在するか
2. ブラウザのコンソール（F12）でエラーを確認
3. ファイル名が正確か（拡張子は `.vrm`）
4. VRMファイルが破損していないか

---

### Q16: 表情が動きません

**確認項目**:
1. OpenSeeFaceが起動しているか
2. Gatewayが起動しているか（`ws://localhost:8080`）
3. カメラが他のアプリで使われていないか
4. ブラウザがカメラアクセスを許可しているか

---

### Q17: AI応答がありません

**確認項目**:
1. Ollamaが起動しているか: `ollama serve`
2. モデルがダウンロード済みか: `ollama list`
3. AIサービスが起動しているか: http://localhost:5000/health
4. Pythonがインストールされているか

---

### Q18: 音声が聞こえません

**確認項目**:
1. マイクの許可を出したか
2. ボイスチェンジャーをオンにしているか
3. ブラウザの音量設定
4. OSの音量設定
5. マイクが正しく接続されているか

---

### Q19: パフォーマンスが悪いです

**対策**:
1. HDRIを軽量版（1K）に変更
2. ブラウザの他のタブを閉じる
3. VRMモデルのポリゴン数を減らす
4. `config.ts` で品質を `low` に設定:

```typescript
performance: {
  quality: {
    low: {
      shadowMapSize: 512,
      particleCount: 100,
      postProcessing: false,
    },
  },
},
```

---

### Q20: Ollamaがインストールできません

**手順**:
1. 公式サイト: https://ollama.ai/
2. OSに合わせたインストーラーをダウンロード
3. インストール後、コマンドプロンプト/ターミナルで確認:
   ```
   ollama --version
   ```
4. モデルのダウンロード:
   ```
   ollama pull qwen2.5:3b-instruct-q4_K_M
   ```

---

## カスタマイズに関する質問

### Q21: 声の高さを変えたい

A: UIの「ピッチ」スライダーで調整できます。
- 数値が大きい: 高い声（かわいい）
- 数値が小さい: 低い声

コードで固定値を設定する場合:
```typescript
// apps/web/src/config.ts
voiceChanger: {
  pitchShift: 3.5, // 半音単位
}
```

---

### Q22: キャラクターの性格を変えたい

A: `apps/ai/main.py` の `system_prompt` を編集:

```python
"system_prompt": """あなたは[キャラ設定]です。
[口調・語尾の設定]
[行動原則]
"""
```

---

### Q23: 色を変えたい

A: `apps/web/src/config.ts` の `THEME.colors`:

```typescript
export const THEME = {
  colors: {
    snowWhite: '#YOUR_COLOR',  // 雪白
    riverCyan: '#YOUR_COLOR',  // 翠青
    rockBlack: '#YOUR_COLOR',  // 玄岩
    woodBrown: '#YOUR_COLOR',  // 木肌
  },
};
```

---

### Q24: 表情をもっと細かく調整したい

A: VRMモデルにブレンドシェイプを追加し、`AvatarSystem.ts` で制御:

```typescript
this.vrm.expressionManager.setValue('yourExpression', 0.5);
```

---

## その他

### Q25: サポートはどこで受けられますか？

A: GitHub Issues でお問い合わせください:
- バグ報告
- 機能提案
- 使い方の質問

---

### Q26: 開発に参加したいです

A: プルリクエスト歓迎です！
1. `DEVELOPMENT.md` を読む
2. Issue作成（機能提案・バグ報告）
3. Fork & ブランチ作成
4. コード変更 + テスト
5. プルリクエスト作成

---

### Q27: ライセンスについて詳しく知りたい

A: `LICENSE` と `licenses/third_party.md` を参照。
- プロジェクトコード: MIT License
- 使用するアセット: 個別に確認が必要

---

### Q28: 将来の機能予定は？

A: ロードマップ（`DEVELOPMENT.md` 参照）:
- Piper TTS 統合
- パーティクルシステム（雪・霧）
- WebRTC 多人数ルーム
- モバイル対応

---

**他に質問がある場合**: GitHub Issues でお気軽に！ 💙
