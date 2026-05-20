# GitHub Pages ワークフローのロールバック

Node 24 対応（Actions v5）でデプロイが失敗した場合、次のいずれかで **以前の v4 構成** に戻せます。

## 方法1: git revert（推奨）

```bash
cd /Users/kumon/git/guitar-practice
git log --oneline -5   # 「Actions v5 / Node 24 対応」のコミット ID を確認
git revert <コミットID>
git push origin main
```

push 後、Actions が自動で再実行されます。

## 方法2: ワークフローを手で差し替え

`.github/workflows/deploy-pages.yml` を以下に置き換えて commit / push します。

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## 確認

- Actions で `build` / `deploy` が成功すること
- https://yoshiyukikumon.github.io/Guitar-Fletboard-Visualization/ が開けること
