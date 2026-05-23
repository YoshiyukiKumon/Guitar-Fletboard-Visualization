# 音源クレジット

## スチール弦アコースティックギター（指板・構成音の再生）

| 項目 | 内容 |
|------|------|
| 名称 | FreePats FSS Steel-String Acoustic Guitar (small) |
| 原音源 | [FS Seagull Steel String Acoustic Guitar](http://www.flamestudios.org/free/GigaSamples) by FlameStudios |
| 提供 | [FreePats project](https://freepats.zenvoid.org/Guitar/steel-acoustic-guitar.html) |
| 使用ファイル | `FSS-SteelStringGuitar-small-SFZ-20200521.tar.xz` 内の 13 単音 |
| ライセンス | GPL-3.0+ with FreePats sound sample exception（`public/samples/steel-guitar/gpl.txt` 参照） |

本リポジトリに同梱している `public/samples/steel-guitar/` は、上記 SFZ パックから単音 WAV を抽出し、モノラル 44.1kHz / 16bit に変換・ラウドネス正規化したものです。

再生成:

```bash
curl -L -o /tmp/steel-small.tar.xz \
  "https://freepats.zenvoid.org/Guitar/FSS-SteelStringGuitar/FSS-SteelStringGuitar-small-SFZ-20200521.tar.xz"
npm run prepare:samples -- /tmp/steel-small.tar.xz
```

確認日: 2026-05-23
