# VRabater コントリビューションガイド

VRabaterへのコントリビューションに興味を持っていただき、ありがとうございます！🎉

このガイドでは、プロジェクトへの貢献方法を説明します。

---

## 🌟 貢献の種類

以下のような貢献を歓迎します:

- **バグ報告**: 問題を見つけたらIssueで報告
- **機能提案**: 新しい機能のアイデア
- **ドキュメント改善**: 誤字修正、説明の追加
- **コード貢献**: バグ修正、新機能実装
- **翻訳**: 他言語への翻訳
- **テスト**: バグ再現、テストケース追加

---

## 🐛 バグ報告

### バグを見つけたら

1. **既存のIssueを検索**
   - 同じ問題が報告されていないか確認

2. **新しいIssueを作成**
   - タイトル: 簡潔で具体的に（例: `VRMモデルが表示されない`）
   - 内容:
     ```markdown
     ## 問題の説明
     VRMファイルを配置しても黒い画面のまま
     
     ## 再現手順
     1. `assets/vrm/hakusan_avatar.vrm` を配置
     2. `npm run dev` を実行
     3. ブラウザで http://localhost:5173 にアクセス
     
     ## 期待される動作
     VRMモデルが表示される
     
     ## 実際の動作
     黒い画面のまま、コンソールにエラー
     
     ## 環境
     - OS: Windows 11
     - ブラウザ: Chrome 120
     - Node.js: v18.0.0
     - VRMファイル: VRoid Studio v1.0でエクスポート
     
     ## ログ・スクリーンショット
     ```
     ブラウザコンソール (F12) のエラーログ
     ```
     ```

---

## 💡 機能提案

### 新機能を提案するには

1. **Issueを作成**（ラベル: `enhancement`）
   ```markdown
   ## 提案内容
   雪のパーティクルエフェクトを追加
   
   ## 動機・背景
   白山モチーフをより強調するため
   
   ## 実装案（任意）
   - three.jsのPointsを使用
   - 500個の粒子
   - 上から下に降る
   
   ## 代替案
   シェーダーでの実装も検討
   ```

2. **議論に参加**
   - 他の人のフィードバックを待つ
   - 実装の詳細を詰める

---

## 🔧 コード貢献

### プルリクエストの流れ

#### 1. リポジトリをフォーク

GitHub上で「Fork」ボタンをクリック

#### 2. ローカルにクローン

```powershell
git clone https://github.com/YOUR_USERNAME/VRabater.git
cd VRabater
```

#### 3. ブランチを作成

```powershell
# 機能追加の場合
git checkout -b feature/パーティクルエフェクト

# バグ修正の場合
git checkout -b fix/vrm-表示エラー
```

#### 4. 開発環境のセットアップ

```powershell
npm install
cd apps/web && npm install
cd ../gateway && npm install
cd ../ai && pip install -r requirements.txt
```

#### 5. コードを書く

- **スタイルガイドに従う**（後述）
- **コミットメッセージ規約**（後述）
- **テストを追加**（該当する場合）

#### 6. 動作確認

```powershell
# システムチェック
python scripts/check_system.py

# 起動テスト
.\scripts\start_all.ps1
```

#### 7. コミット

```powershell
git add .
git commit -m "feat: 雪のパーティクルエフェクトを追加"
```

#### 8. プッシュ

```powershell
git push origin feature/パーティクルエフェクト
```

#### 9. プルリクエストを作成

GitHub上で「Pull Request」を作成

---

## 📝 コミットメッセージ規約

**形式**:
```
<type>: <subject>

<body>

<footer>
```

**type の種類**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードスタイル（機能変更なし）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・設定変更

**例**:
```
feat: 雪のパーティクルエフェクトを追加

白山モチーフを強化するため、降雪エフェクトを実装。
- three.jsのPointsを使用
- 500個の粒子を生成
- config.tsで有効/無効を切替可能

Closes #42
```

---

## 🎨 コーディングスタイル

### TypeScript/JavaScript

- **インデント**: 2スペース
- **セミコロン**: あり
- **クォート**: シングル (`'`)
- **命名**:
  - 変数・関数: `camelCase`
  - クラス: `PascalCase`
  - 定数: `UPPER_SNAKE_CASE`

```typescript
// Good
const avatarSystem = new AvatarSystem();
const MAX_PARTICLES = 500;

class ParticleEffect {
  private particleCount: number;
  
  initialize() {
    // ...
  }
}

// Bad
const AvatarSystem = new avatarSystem();
const max_particles = 500;

class particleEffect {
  private ParticleCount: number;
  
  Initialize() {
    // ...
  }
}
```

### Python

- **インデント**: 4スペース
- **命名**:
  - 変数・関数: `snake_case`
  - クラス: `PascalCase`
  - 定数: `UPPER_SNAKE_CASE`

```python
# Good
class AudioProcessor:
    MAX_BUFFER_SIZE = 1024
    
    def process_audio(self, audio_data):
        pass

# Bad
class audioProcessor:
    max_buffer_size = 1024
    
    def ProcessAudio(self, AudioData):
        pass
```

---

## 🧪 テスト

### テストの追加

新機能を追加する場合、テストも追加してください。

```typescript
// apps/web/src/avatar/__tests__/AvatarSystem.test.ts
import { describe, it, expect } from 'vitest';
import { AvatarSystem } from '../AvatarSystem';

describe('AvatarSystem', () => {
  it('should initialize correctly', async () => {
    const system = new AvatarSystem();
    await system.init();
    
    expect(system).toBeDefined();
  });
});
```

### テストの実行

```powershell
cd apps/web
npm test
```

---

## 📚 ドキュメント

### ドキュメントの更新

コードの変更に伴い、以下のドキュメントも更新してください:

- `README.md`: 概要・使い方
- `SETUP.md`: セットアップ手順
- `DEVELOPMENT.md`: 開発者向け情報
- `FAQ.md`: よくある質問
- `licenses/third_party.md`: サードパーティライセンス（新規依存関係追加時）

---

## 🔒 ライセンス・法務

### 重要な注意事項

1. **商用利用可能なアセットのみ**
   - VRM、HDRI、フォント等は商用可ライセンス確認

2. **公式ロゴ・市章の使用禁止**
   - 白山市・白山手取川ジオパークの公式マークは使わない

3. **ライセンス台帳の更新**
   - 新しいアセット追加時は `licenses/third_party.md` に記録

4. **著作権表示**
   - 他者のコードを参考にした場合は出典を明記

---

## 🎯 プルリクエストのチェックリスト

プルリクエストを作成する前に確認:

- [ ] コードがスタイルガイドに従っている
- [ ] コミットメッセージが規約に従っている
- [ ] テストを追加・更新した
- [ ] ドキュメントを更新した
- [ ] `python scripts/check_system.py` が成功する
- [ ] 手動で動作確認した
- [ ] `licenses/third_party.md` を更新（該当する場合）

---

## 🤝 コミュニティガイドライン

### 行動規範

- 🙏 **敬意を持つ**: すべての人を尊重
- 💬 **建設的なフィードバック**: 批判的にならず提案的に
- 🤗 **歓迎する**: 初心者にも優しく
- 🚫 **禁止事項**:
  - 差別的・攻撃的な発言
  - スパム・宣伝
  - 個人情報の公開

### コミュニケーション

- **GitHub Issues**: バグ報告・機能提案
- **Pull Requests**: コードレビュー
- **Discussions**（将来）: 質問・雑談

---

## 🌈 翻訳への貢献

### 他言語への翻訳

VRabaterを他の言語で使えるようにしたい方:

1. `docs/i18n/` フォルダを作成
2. 各言語のフォルダを作成（例: `en/`, `zh/`）
3. ドキュメントを翻訳
4. プルリクエストを作成

---

## 🎖️ 貢献者

貢献者リストは `README.md` に掲載します。

---

## ❓ 質問・相談

- **一般的な質問**: GitHub Discussions（将来）
- **バグ・機能**: GitHub Issues
- **セキュリティ**: セキュリティポリシー（`SECURITY.md`、将来）

---

## 🙏 謝辞

あなたの貢献は、VRabaterをより良いプロジェクトにします。
時間と労力を割いていただき、本当にありがとうございます！💙❄️

---

**Happy Coding!** 🚀
