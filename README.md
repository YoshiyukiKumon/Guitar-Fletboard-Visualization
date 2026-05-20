# ギター練習ツール

キー・スケール・コードに応じてギター指板のインターバルを表示する Web アプリです。

## 概要

Google スプレッドシート版をブラウザ向けに移植したものです。キー・スケール・コードを選んで指板を表示します（初期値: C / Major / △7）。

**Web サーバーは不要**です。ビルド後の HTML 1 ファイルをローカルで開いて使えます。

## セットアップ

```bash
npm install
npm run build
```

## 使い方（スタンドアロン）

1. `npm run build` を実行する
2. `standalone/guitar-practice.html` をブラウザで開く（ダブルクリック可）

画面上部で **スケールのルート・スケール・コードのルート・コード** を選び、**表示**（指板／スケール／コード／複合）と **インターバル／音名** の切り替えができます（選択はブラウザに保存）。スケールとコードはルートを別々に指定できます（例: C Altered + Am7）。

- **指板**: ルート（R）のみ強調
- **スケール**: スケール構成音を強調
- **コード**: コード構成音を強調
- **複合**: スケールとコードを重ねて表示

指板上では **インターバル**が弦とフレットの交点に表示され、**フレット目印（●）**はフレットとフレットの間（例: 3 番目 → 2 と 3 の間）に表示されます。カプセルを **タップ／クリック**すると、その位置の実音が鳴ります。

構成音パネルの **▶ 再生** で、スケールは 1 オクターブを順番に、コードはまとめて鳴らせます（ブラウザの Web Audio API を使用）。**音量** はスライダーで調整でき、設定は保存されます。

## 開発時

```bash
npm run dev          # http://localhost:5173/
npm test
npm run verify:ui -- http://localhost:5173
npm run verify:standalone   # file:// で単体 HTML を検証
```

## GitHub Pages

`main` への push で自動デプロイされます（`.github/workflows/deploy-pages.yml`）。

- 公開 URL: https://yoshiyukikumon.github.io/Guitar-Fletboard-Visualization/
- 初回はリポジトリ **Settings → Pages → Source** を **GitHub Actions** に設定してください
- デプロイ失敗時の戻し方: [docs/github-actions-pages-rollback.md](docs/github-actions-pages-rollback.md)

## その他

- 仕様・方針: [docs/spec-web-migration-plan.md](docs/spec-web-migration-plan.md)
- プロジェクト運用ルール: 仕様書 §0 / `.cursor/rules/project-workflow.mdc`
- マスターデータは `master` シート準拠（`src/domain/data/`）
