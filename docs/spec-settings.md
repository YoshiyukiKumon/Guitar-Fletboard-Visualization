# 設定画面仕様

## 概要

ヘッダーの **練習 / ライブラリ / 設定** から設定画面に遷移する。設定項目は **セクション単位** で追加できる構成とする。

## 永続化

| キー | フィールド | 説明 |
|------|------------|------|
| `guitar-practice-settings` | `appMode` | `practice` / `library` / `settings` |
| 同上 | `instrumentId` | 再生楽器 ID（下表） |
| 同上 | `volume` | 0〜100（練習画面・設定画面で共通） |

## 楽器一覧（`instrumentId`）

| ID | 表示名 | 再生方式 | 同梱 |
|----|--------|----------|------|
| `acoustic-steel` | アコースティック（スチール） | サンプル | ○ |
| `acoustic-nylon` | アコースティック（ナイロン） | サンプル | ○ |
| `electric-clean` | エレキ（クリーン） | サンプル | ○ |
| `electric-overdrive` | エレキ（オーバードライブ） | サンプル | ○ |
| `electric-distortion` | エレキ（ディストーション） | サンプル | ○ |
| `piano` | ピアノ | サンプル | ○ |
| `synth-tone` | シンセ | 合成音 | — |

- **シンセ** = 三角波オシレータ（Web Audio API）。**唯一の合成音**。
- サンプル楽器は `public/samples/<sampleDir>/manifest.json` を参照
- サンプル読込失敗時のみ、各楽器の合成フォールバックを使用
- **ナイロン弦**（Iowa MIS）: manifest は 1 ファイル 1 エントリ（`rootMidi` = ファイル名先頭音）。録音ピッチがやや低いため `samplePitchCents: 30` で補正

## UI

- **設定 > 再生音**: ラジオボタン + ▶ 試聴
- **設定 > 音量**: 練習画面と同じスライダー
- 新規セクションは `src/ui/settings-view.ts` の `SETTINGS_SECTIONS` に追加

## 関連コード

| ファイル | 役割 |
|----------|------|
| `src/domain/settings/instrument-catalog.ts` | 楽器定義レジストリ |
| `src/audio/tone-player.ts` | 楽器切替・サンプル/合成再生 |
| `src/audio/synth-presets.ts` | 合成音プリセット |
| `src/ui/settings-view.ts` | 設定 UI |

## 更新履歴

| 版 | 日付 | 内容 |
|----|------|------|
| 1.0 | 2026-05-23 | 設定タブ・楽器選択・音量セクション |
| 1.1 | 2026-05-23 | シンセ以外6楽器をサンプル再生に変更（FreePats / Iowa MIS） |
| 1.2 | 2026-05-23 | エレキ系サンプル減衰 0.5 秒、ピアノ 0.7 秒（アコースティックは 1.5 秒） |
| 1.3 | 2026-05-20 | ナイロン manifest 修正・`samplePitchCents` による音程補正 |
| 1.4 | 2026-05-20 | iOS Safari 向け AudioContext 解放・サンプル URL 正規化 |
