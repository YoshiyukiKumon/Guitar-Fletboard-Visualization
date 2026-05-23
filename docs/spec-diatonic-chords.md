# ダイアトニックコード表示

練習モード画面の**一番下**に、選択中のスケールから導出できるダイアトニックコード一覧を表示する機能の仕様（開発方針）。

関連: [spec-web-migration-plan.md](./spec-web-migration-plan.md)（指板・構成音 UI）、[spec-note-spelling-rules.md](./spec-note-spelling-rules.md)（音名表記）、[memo-diatonic-chords-pentatonic.md](./memo-diatonic-chords-pentatonic.md)（ペンタトニックと本機能の議論メモ）

---

## 目的

- ユーザーが選んだ **スケールルート + スケール** から、理論上成立する **ダイアトニックコード**（スケール音数 N に対し **N 個**）を一覧表示する
- 一覧は **四和音（4 音構成のセブンスコード）** のみで示す（三和音表示は行わない）
- 各コードを **相対コード名**（ローマ数字表記）と **実コード名**（ルート音付き）の **2 段** で表示する
- 各コード列に **再生** と **選択** の 2 ボタンを設ける。列全体のタップは行わない
- **選択** → **コードルート / コード種別の選択を更新**し、指板・構成音パネルと連動させる（再生はしない）
- **再生** → **`chordId` あり**なら `tonePlayer.playChord(chordKey, chord)`、**なし**なら `tonePlayer.playChordSemitonesFromRoot(chordKey, playbackSemitones)` で **同時再生**（構成音パネルの「▶ 同時」と同じ音量設定）。**ギター系**楽器ではルートから約 32ms ずつずらしたストローク風
- 理論は Web 上の一般的な説明と整合させつつ、本アプリの **半音ラベル体系**（`interval-labels.ts`）で機械的に再現する

---

## 用語

| 用語 | 意味 |
|------|------|
| **ダイアトニック** | あるスケール（調）に含まれる音だけで作った和音・旋律 |
| **三和音（トライアド）** | ルート・3 度・5 度の 3 音（算出の中間ステップ。UI には出さない） |
| **四和音（セブンス）** | 三和音に 7 度を加えた **4 音**。本機能の **表示・再生は常に四和音** |
| **ディグリー / 度数** | スケールの何番目の音か（1 〜 N） |
| **相対コード名** | スケールルートを I 度とみなした **ローマ数字 + 品質記号**（例: `I△7`, `IIm7`）。キーが変わっても度数パターンは不変 |
| **実コード名** | スケールルートのキーに応じた **具体コード名**（例: `C△7`, `Dm7`）。既存 `formatChordName` に準拠 |
| **ローマ数字** | 和声機能・度数表記。本アプリは **日本のギター教材系**（大文字度数 + `m` / `△7` suffix）を UI 表記の主とする |

---

## 音楽理論要件（調査結果）

以下は [er-music.jp の解説](https://er-music.jp/theory/629/)、[Open Music Theory（Chord-Scale Theory）](https://viva.pressbooks.pub/openmusictheory/chapter/chord-scale-theory/)、[Puget Sound Music Theory（Diatonic Chords in Major）](https://musictheory.pugetsound.edu/mt21c/DiatonicChordsInMajor.html) 等を踏まえた**本機能の要件定義**である。

### 1. 基本ルール

1. **対象スケールの N 音**（N ≧ 4）それぞれをルート（根音）とする
2. スケール内の音を **1 つ飛ばし（3 度ずつ）** で重ね、四和音を作る（ルート・3 度・5 度・7 度 ＝ スケール度数 `i`, `i+2`, `i+4`, `i+6` を **mod N** で循環）
3. 1 スケールあたり **N 種類** のダイアトニックコードができる
4. コードの種類（メジャー / マイナー / ディミニッシュ等）は、**スケール内の音程間隔** から決まる
5. **7 音スケール** は従来の I〜VII ダイアトニック和声。**8 音以上**（オクタトニック等）も同じ積み上げ規則で N 行算出する

### 2. メジャースケール（Ionian・7 音）の代表例

**四和音（セブンス）**（C メジャーを例）— **本アプリの表示形式**:  
`C△7` · `Dm7` · `Em7` · `F△7` · `G7` · `Am7` · `Bm7(♭5)`  
品質パターン: **M7 – m7 – m7 – M7 – 7 – m7 – m7♭5**

（三和音の理論: M – m – m – M – M – m – dim — UI には表示しない）

参考: [4和音のダイアトニックコード解説（er-music.jp）](https://er-music.jp/theory/2392/)

### 3. ナチュラルマイナー（Aeolian・7 音）の代表例

**四和音**:  
`Am7` · `Bm7(♭5)` · `C△7` · `Dm7` · `Em7` · `F△7` · `G7`

### 4. 各モード（7 音ダイアトニック）

本アプリの `dorian` / `phrygian` / `lydian` / `mixolydian` / `locrian` も **7 音スケール** として同じ積み上げルールを適用する。

| 相対（例） | 代表的モード | 実コード（C 基準） |
|-----------|--------------|-------------------|
| I△7 | Ionian | C△7 |
| IIm7 | Dorian（II 度） | Dm7 |
| IIIm7 | Phrygian（III 度） | Em7 |
| IV△7 | Lydian | F△7 |
| V7 | Mixolydian | G7 |
| VIm7 | Aeolian | Am7 |
| VIIm7(♭5) | Locrian | Bm7(♭5) |

参考: [Open Music Theory — Chord-Scale Theory](https://viva.pressbooks.pub/openmusictheory/chapter/chord-scale-theory/)

### 5. 8 音以上のスケール

- **半全減 / 全半減**（`whole-half-dim`, `half-whole-dim`）など **8 音** スケールは、各度数から四和音を積み上げ **8 行** 表示する
- 正しい 8 音定義（半全減: 末尾 `b7`、全半減: 末尾 `△7`）では、スケール内を 1 音飛ばしで積み上げた四和音は **各度数とも減三和音 + 減7度（9 半音）** となり、すべて **`dim7`** にマップされる（対称的オクタトニックの性質）
- ローマ数字は **VIII** まで拡張（9 音以上は **IX**, **X** … と続ける）
- カスタムスケールで `tones.length >= 8` の定義も同様に **N 行** 算出する
- 理論上、8 音スケールの四和音列は教科書の「メジャー 7 コード表」と一致しない場合があるが、**スケール定義を正** として機械生成する

### 6. 4 音未満のスケール

| 条件 | 扱い |
|------|------|
| `tones.length < 4` | 四和音を 3 度積み上げできないため **非表示**（説明メッセージ） |
| `tones.length >= 4` | **N 行** 算出・表示（5 音ペンタトニック → 5 行、6 音 Whole Tone → 6 行） |

### 7. テンションコード

9・11・13 等の **テンション付加コード** はダイアトニック四和音の拡張であり、本機能では **四和音（ルート・3・5・7）まで** とする。表示・再生とも `maj7` / `m7` / `7` / `m7b5` 等の **4 音 `ChordDef`** にマップする。

### 8. 相対コード名（ローマ数字）表記規則

コード進行分析で用いる **相対表記** は、キー（スケールルート）に依存しない度数ラベルとして機能する（[Wikipedia — Roman numeral analysis](https://en.wikipedia.org/wiki/Roman_numeral_analysis)）。

#### 学術系（参考・本 UI では副次）

| 要素 | 規則 | 例 |
|------|------|-----|
| 三和音 | 大文字＝メジャー、小文字＝マイナー | I, ii, iii, IV, V |
| ディミニッシュ | 小文字 + `°` | vii° |
| セブンス | 数字 `7` を付加 | V7, ii7 |
| ハーフディミニッシュ | 小文字 + `ø7` | viiø7 |

参考: [Open Music Theory — Roman Numerals](https://viva.pressbooks.pub/openmusictheory/chapter/roman-numerals/)

#### 本アプリ UI 採用（日本のギター・ポップス系）

[ギターマガジン「コード進行をローマ数字で表記」](https://guitarmagazine.jp/for_beginners/2021-0907-shibanzukun-seminar-32/) および [音楽力の泉 — 表記方法](https://composer-instruments.com/notation-system-of-chord-analysis/) に合わせ、**実コード名の suffix と対になる相対表記** とする。

| 四和音種別 | 相対表記 suffix | 相対例 | 実コード例（C メジャー） |
|-----------|----------------|--------|-------------------------|
| メジャー7 | `△7` | `I△7`, `IV△7` | `C△7`, `F△7` |
| マイナー7 | `m7` | `IIm7`, `IIIm7`, `VIm7` | `Dm7`, `Em7`, `Am7` |
| ドミナント7 | `7` | `V7` | `G7` |
| ハーフディミニッシュ7 | `m7(♭5)` | `VIIm7(♭5)` | `Bm7(♭5)` |
| マイナーメジャー7 | `m△7` | `Im△7` 等 | `Cm△7` 等 |
| 増三和音 + 長7度 | `△7(+5)` | `♭IV△7(+5)` 等 | `E△7(+5)` 等 |

**度数ローマ数字**

| ルール | 内容 |
|--------|------|
| 度数 | スケール 1 度目を **I**、2 度目を **II** … **VIII**, **IX** …（8 音以上も拡張） |
| I 度のマイナー | **小文字 `i`** + 品質（例: ナチュラルマイナー先頭 → `Im7`） |
| I 度のメジャー | **大文字 `I`** + 品質（例: メジャー先頭 → `I△7`） |
| II 度以降 | **大文字 `II`〜** + 品質 suffix（例: `IIm7`, `IIIm7`, `IV△7`） |
| 品質 suffix | 実コード名と同系統（`△7`, `m7`, `7`, `m7(♭5)`）。`ChordDef.name` から機械生成 |

**C メジャー・7 四和音の対応表（表示例）**

| 相対 | 実コード |
|------|----------|
| I△7 | C△7 |
| IIm7 | Dm7 |
| IIIm7 | Em7 |
| IV△7 | F△7 |
| V7 | G7 |
| VIm7 | Am7 |
| VIIm7(♭5) | Bm7(♭5) |

参考: [BASS NOTE — コード進行パターン（IV△7-V7-IIIm7-VIm7 等）](https://bassnote.jp/blog/chord-progression/)

#### ♯ / ♭ の付き方（2 種類）

| 種類 | 位置 | 意味 | 例 |
|------|------|------|-----|
| **度数の ♯ / ♭** | ローマ数字の **前** | 同じ度数番号の **メジャースケール（Ionian）の音** より半音上下したルート | `♭III△7`, `♯IV△7` |
| **コード品質の ♯ / ♭** | **suffix 内** | 三和音・七度の変化（ルート度数とは別） | `VIIm7(♭5)`, `V7(♭9)` ※後者は本機能対象外 |

本機能で四和音として扱う **品質側** は `m7(♭5)` のみ（`ChordDef` の `m7-5 (∅)` に対応）。**度数側** の `♭III` 等は下記ルールで付与する。

#### 度数 ♯ / ♭ の判定（本アプリ採用）

スケールの **各度数**（1 〜 N）について、ルートの半音位置 `s[i]` を、**同じ tonic のメジャースケール（Ionian）** の i 度目の半音 `major[i]` と比較する。

```text
major = [0, 2, 4, 5, 7, 9, 11]   // R, 2, 3, 4, 5, 6, 7（7 音周期）
delta = s[i] - major[i mod 7]      // -1 → ♭, +1 → ♯, 0 → なし
```

| delta | 度数 prefix | ローマ数字例（7 音スケール） |
|-------|-------------|------------------------------|
| 0 | なし | `I`, `II`, `III`, … |
| -1（1 半音低い） | `♭` | `♭III`, `♭VI`, `♭VII` |
| +1（1 半音高い） | `♯` | `♯IV`（リディアン 4 度）, `♯VII`（ハーモニックマイナー 7 度）等 |
| その他 | 非対応 | 8 音以上・非ダイアトニック変化は **prefix なし + 注釈** または `invalid-tones`（実装時に決定） |

**7 度以降（8 音以上）**: `i mod 7` で Ionian パターンと比較。ローマ数字自体は **VIII, IX, …** と度数番号を増やし、prefix は上記と同様。

#### 代表例

**A ナチュラルマイナー**（tonic = Am7）

| 度数 | 実コード | 相対（本規則） | 補足 |
|------|----------|----------------|------|
| 1 | Am7 | `Im7` | i 度・マイナー → 小文字 `i` |
| 2 | Bm7(♭5) | `IIm7(♭5)` | 2 度は Ionian と同位置 |
| 3 | C△7 | `♭III△7` | 3 度が major より 1 半音低い |
| 4 | Dm7 | `IVm7` | |
| 5 | Em7 | `Vm7` | ナチュラルマイナー |
| 6 | F△7 | `♭VI△7` | |
| 7 | G7 | `♭VII7` | ナチュラルマイナー（7 度 major より低い） |

**A ハーモニックマイナー**（5 度・7 度のみ変化）

| 度数 | 実コード | 相対 | 変化点 |
|------|----------|------|--------|
| 5 | E7 | `V7` | 5 度は Ionian と同位置 → **♭ なし** |
| 7 | G#dim7 等 | `♯VII…` または `viio7` 系 | 7 度が major より 1 半音高い → **`♯` prefix**（マップ先 `dim7` / `m7b5` による suffix） |

**C リディアン**（4 度が ♯4）

| 度数 | 実コード | 相対 |
|------|----------|------|
| 4 | F#△7 | `♯IV△7` |

**C フリジアン**（2 度が ♭2）

| 度数 | 実コード | 相対 |
|------|----------|------|
| 2 | Dbm7 等 | `♭IIm7` |

**C メジャー** — 全度数 `delta = 0` のため **prefix なし**（`I△7`, `IIm7`, …）。

#### 表記記号

| 項目 | 方針 |
|------|------|
| フラット / シャープ | UI では **`♭` / `♯`**（Unicode）。ASCII `#` / `b` は使わない |
| 配置 | prefix + ローマ数字 + suffix 例: `♭III△7`, `♯IVm7` |
| 実コード名 | 従来どおり `formatChordName`（スケールルート基準の異名同音。例: F# キーで `Gb△7` 等） |

参考: [ギターマガジン — マイナーキー表（♭III, ♭VI 等）](https://guitarmagazine.jp/for_beginners/2021-0907-shibanzukun-seminar-32/)、[Roman numeral analysis — accidentals](https://en.wikipedia.org/wiki/Roman_numeral_analysis)

---

## 本アプリへの適用方針

### 表示内容

| 項目 | 方針 |
|------|------|
| 見出し | `ダイアトニックコード`（画面最下部、`tone-panel` の下） |
| 行数 | **N = scale.tones.length` 行**（各スケール度数 1 〜 N） |
| 和音の種類 | **原則四和音（セブンス）**。4 音積み上げで **ユニークな pitch class が 3 以下**のときは **三和音**で表記・再生 |
| 表示形式 | **2 段 × N 列**（列＝コード 1 個）。上段＝相対コード名、下段＝実コード名 |
| 相対表記 | §8 のローマ数字規則（例: `I△7` / `IIm7` / `IIIm7`） |
| 実コード名 | `formatChordName(chordKey, chord, scaleKey)`（例: `C△7` / `Dm7` / `Em7`） |
| 対象モード | **練習モードのみ** |
| 入力 | `scaleKeyId` + `scaleId` の変更で再計算 |

### インタラクション（必須）

各列（コード 1 個）の下部に **2 ボタン** を配置する:

| ボタン | ラベル | 動作 |
|--------|--------|------|
| 再生 | `▶` | **`chordId` あり** → `tonePlayer.playChord(chordKey, chord)`。**`chordId` なし** → `tonePlayer.playChordSemitonesFromRoot(chordKey, playbackSemitones)`。いずれも同時再生のみ。セレクタは変更しない |
| 選択 | `選択` | `chordKeyId` と `chordId` を更新（`chordId` が **null の列は無効**）。再生はしない |

1. **選択** 実行後、現在選択中のコードと一致する **列** を **ハイライト**
2. アルペジオ再生は **ダイアトニック列では行わない**（構成音パネルの「▶ アルペジオ」は従来どおり）

### 非対応スケール時

`tones.length < 4` または構成音ラベルが解釈不能な場合:

```text
このスケールではダイアトニックコード（四和音）を表示できません。
```

と見出し下に説明のみ表示（リストは出さない）。

---

## アルゴリズム（ドメイン）

新規: `src/domain/diatonic-chords.ts`（仮）

### 入力

```typescript
interface DiatonicChordsInput {
  scaleKey: KeyDef;
  scale: ScaleDef;
}
```

### 出力

```typescript
interface DiatonicChordEntry {
  /** 1〜N（スケール音数） */
  degree: number;
  /** 相対コード名（例: "I△7", "IIm7", "VIIm7(♭5)"） */
  relativeLabel: string;
  chordKeyId: string;
  /** 常に四和音の ChordDef.id */
  chordId: string;
  /** 実コード名（formatChordName 済み、例: "C△7", "Dm7"） */
  displayName: string;
  /** 四和音の構成音ラベル（最大 4 要素） */
  toneLabels: readonly string[];
}

type DiatonicChordsResult =
  | { supported: true; entries: DiatonicChordEntry[] }
  | { supported: false; reason: 'too-few-tones' | 'invalid-tones' };
```

### 手順

1. `N = scale.tones.length`。`N < 4` なら `supported: false`（`too-few-tones`）
2. `semitonesFromTones(scale.tones)` で N 個の半音列 `s[0..N-1]` を得る（ルート = 0 基準・昇順）
3. 各度数 `i = 0 .. N-1` について:
   - ルート = `s[i]`
   - まず 3・5・7 度 = `s[(i+2)%N]`, `s[(i+4)%N]`, `s[(i+6)%N]` を積み上げ
   - **4 音の pitch class が 3 以下**（重複あり）→ **三和音モード**（3 度・5 度のみ、`[0,2,4]` ステップ）
   - ルートからの半音差で **三和音品質** を判定 → 四和音モードなら **7 度** を加え **四和音品質** を確定
4. 品質 → 既存 `ChordDef.id` にマッピング（四和音 id を優先。三和音モード時は `major-triad` / `m` / `dim` / `aug`）
5. ルート pitch class → `chordKeyId`（スケールルート表記規則に従う）
6. **相対コード名** `relativeLabel`: §8 の規則で生成（`relativeLabelForEntry(degree, triadQuality, seventhQuality)`）
7. **実コード名** `displayName`: `formatChordName(chordKey, chord, scaleKey)`

### 品質判定（三和音・内部用）

| 3 度 | 5 度 | 三和音 |
|------|------|--------|
| 4 | 7 | メジャー |
| 3 | 7 | マイナー |
| 3 | 6 | ディミニッシュ |
| 4 | 8 | オーギュメント |

### 品質判定（四和音・UI / 再生用）

| 三和音 | 7 度（ルートから） | 四和音 | マップ先 `chordId` |
|--------|-------------------|--------|-------------------|
| メジャー | 11 | メジャー7 | `maj7` |
| メジャー | 10 | ドミナント7 | `7` |
| メジャー | 9 | メジャー6 | `6` |
| マイナー | 10 | マイナー7 | `m7` |
| マイナー | 11 | マイナーメジャー7 | `m-maj7` |
| ディミニッシュ | 10 | ハーフディミニッシュ | `m7b5` |
| ディミニッシュ | 9 | ディミニッシュ7 | `dim7` |
| オーギュメント | 10 | 7(♯5) 系 | `7sharp5` |
| オーギュメント | 11 | 増三和音 + 長7度 | `maj7-sharp5`（表示名 `△7(+5)`） |
| 同一音集合・別ルート | — | 低い度数の直接解決を `/` + ローマ数字 | 例: `I6/III`（実 `C6/E`） |

**マッピングできない四和音** → 次の順で **列はスキップせず N 行を維持**する:

1. **直接解決** — 三和音 + 7 度 → 既存 `ChordDef`
2. **転回形（スラッシュ相対表記）** — 同一 4 音集合を、より低い度数で直接解決できた列を `{相対}/{ローマ}` とする（例: `I6/III`、実 `C6/E`）。`/` 右は **アラビア数字ではなくスケール度数のローマ数字**
3. **相対表記のみ** — 音程パターンから suffix を推定（`ChordDef` なし、`chordId: null`）
4. **フォールバック** — `{ローマ}[R-3-5-…]` とルート + 構成音ラベル

`chordId: null` の列は **選択ボタンのみ無効**。**再生ボタンは `playbackSemitones` があれば常に有効**。

### 検証例（自動テスト）

| スケール | N | 期待（抜粋） |
|----------|---|--------------|
| C Major | 7 | 相対 `I△7,IIm7,…` / 実 `C△7,Dm7,…` |
| A Natural Minor | 7 | i=`Am7`, III=`C△7` |
| C Harmonic Minor | 7 | V=`G7` |
| C Altered | 7 | IV=`E△7(+5)`（`maj7-sharp5`） |
| C Diminished 6th | 8 | I=`I6`, III=`I6/III`, V=`I6/V` 等 |
| C Major Penta | 5 | **5 行**（未マップ時も再生可） |
| Whole Tone | 6 | **6 行・三和音**（各 `aug`） |
| Half/Whole Dim | 8 | **8 行**・すべて `dim7` |
| Whole/Half Dim | 8 | **8 行**・すべて `dim7` |
| 3 音以下のカスタム | ≤3 | 非表示 |

---

## 組み込みスケール対応表

| scale id | 音数 N | 表示 |
|----------|--------|------|
| `major`, 各モード, harmonic/melodic minor 等 | 7 | 7 行・四和音 |
| `major-penta`, `minor-penta`, `kumoi-penta` | 5 | **5 行**（四和音算出を試行するが **ChordDef 未マップが通常**。理由は [memo-diatonic-chords-pentatonic.md](./memo-diatonic-chords-pentatonic.md)） |
| `whole-tone` | 6 | **6 行・四和音** |
| `whole-half-dim`, `half-whole-dim`, `diminished-6th` | 8 | **8 行・四和音** |
| `altered`, `hp5`, `lydian-b7` 等 | 7 | 7 行・四和音 |
| カスタム | N ≧ 4 | N 行・四和音 |
| カスタム | N < 4 | 非表示メッセージ |

---

## UI 配置

```
[ header ]
[ music-selectors ]
[ app-controls ]
[ legend ]
[ fretboard ]
[ tone-panel ]          ← 既存（スケール / コード構成音）
[ diatonic-chords ]     ← 新規（画面最下部）
```

### コンポーネント

| ファイル | 責務 |
|----------|------|
| `src/domain/diatonic-chords.ts` | N 音対応の算出・四和音マッピング・ローマ数字 |
| `src/ui/diatonic-chords-panel.ts` | リスト描画・再生 / 選択ボタン |
| `src/ui/app-shell.ts` | `createTonePanel` の **後** に panel を append。`onPlayChord` コールバックを渡す |
| `src/styles/main.css` | `.diatonic-chords` ブロック |

### レイアウト（2 段 × N 列・列揃え）

**禁止**: 相対名・実名をそれぞれ 1 本の長い文字列（スペース区切り）にする。列ごとの縦位置がずれる。

**採用**: **コード 1 個 = 列 1 本**。各列内で上に相対・下に実コードを **縦積み中央揃え**。

#### 表示イメージ（C メジャー・抜粋）

```text
  I△7      IIm7     IIIm7
  C△7      Dm7      Em7
  ▶ 選択   ▶ 選択   ▶ 選択   ← 各列に再生・選択ボタン
```

#### DOM 構造（案）

```html
<section class="diatonic-chords">
  <h2 class="diatonic-chords__title">ダイアトニックコード</h2>
  <motion/div class="diatonic-chords__scroll">
    <motion/div class="diatonic-chords__grid"><!-- N 列 -->
      <div class="diatonic-chords__cell">
        <div class="diatonic-chords__labels">
          <span class="diatonic-chords__relative">I△7</span>
          <span class="diatonic-chords__actual">C△7</span>
        </div>
        <div class="diatonic-chords__actions">
          <button type="button" class="diatonic-chords__btn diatonic-chords__btn--play">▶</button>
          <button type="button" class="diatonic-chords__btn diatonic-chords__btn--apply">選択</button>
        </div>
      </div>
      <!-- … -->
    </motion/div>
  </motion/div>
</section>
```

#### CSS 方針（案）

| プロパティ | 値・意図 |
|-----------|----------|
| `.diatonic-chords__grid` | `display: grid`; `grid-template-columns: repeat(N, minmax(3.25rem, 1fr))`; 列数は JS で `--diatonic-cols: N` を設定 |
| `.diatonic-chords__scroll` | `overflow-x: auto`（狭幅で N 列が収まらないとき横スクロール） |
| `.diatonic-chords__cell` | 列コンテナ。`flex-direction: column`; ラベル + アクション行 |
| `.diatonic-chords__actions` | 再生・選択ボタン行。`display: flex`; `justify-content: center` |
| `.diatonic-chords__btn` | 構成音パネルの `.tone-panel__play` に準じた pill ボタン |
| `.diatonic-chords__relative` | やや小さめ・控えめ色（`#b8aea3`） |
| `.diatonic-chords__actual` | やや大きめ・主テキスト色（`#f5f0eb`） |
| `.diatonic-chords__cell--active` | 選択中コード列のハイライト（枠線または背景） |

**可変幅**: 列 `minmax` の最小幅は **実コード名の最長列** に合わせて CSS `ch` または `min-width` で調整し、同一列内で相対・実の中心軸を一致させる。`tabular-nums` は不要（音名主体）だが、`text-align: center` を列全体に統一する。

#### レスポンシブ

| 幅 | 挙動 |
|----|------|
| 広幅 | N 列を 1 行に収める |
| 狭幅 | 横スクロール（指板と同様）。列幅は維持し縦位置ずれを防ぐ |

---

## 既存機能との関係

| 既存 | 関係 |
|------|------|
| `tonePlayer.playChord()` / `playChordSemitonesFromRoot()` | **再生** ボタン押下時（`chordId` の有無で切替） |
| `buildFretboard` | `chordKeyId` / `chordId` 更新で再描画 |
| `formatChordName` | **実コード名**（下段） |
| `relativeLabelForEntry`（新規） | **相対コード名**（上段） |
| `CHORDS` | **四和音 id のみ** 参照（`major-triad` 等の三和音 id は使わない） |
| `localStorage` | ダイアトニック専用キーは不要 |

---

## テスト方針

| 種別 | 内容 |
|------|------|
| ユニット | Major(7) / Penta(5) / Octatonic(8) / 3 音以下（非対応） |
| ゴールデン | C Major の 7 **四和音** 名リスト |
| UI 検証 | 見出し・**N 列**・相対/実の **列内縦揃え**・再生 / 選択ボタン |

---

## 実装フェーズ（提案）

| Phase | 内容 |
|-------|------|
| **1** | ドメイン算出（N 音・四和音のみ）+ パネル表示 + **再生 / 選択ボタン** |
| **2** | 選択ハイライト + 非対応スケールメッセージ + 8 音スケールの UI 確認 |

---

## 参考資料

| 資料 | URL | 確認日 |
|------|-----|--------|
| ダイアトニックコードとは（3和音） | https://er-music.jp/theory/629/ | 2026-05-20 |
| 4和音のダイアトニックコード | https://er-music.jp/theory/2392/ | 2026-05-20 |
| Diatonic Chords in Major | https://musictheory.pugetsound.edu/mt21c/DiatonicChordsInMajor.html | 2026-05-20 |
| Chord-Scale Theory | https://viva.pressbooks.pub/openmusictheory/chapter/chord-scale-theory/ | 2026-05-20 |
| Diatonic Harmony | https://pianoowl.com/docs/diatonic-harmony | 2026-05-20 |
| コード進行のローマ数字表記（ギターマガジン） | https://guitarmagazine.jp/for_beginners/2021-0907-shibanzukun-seminar-32/ | 2026-05-20 |
| Roman Numerals（学術系参考） | https://viva.pressbooks.pub/openmusictheory/chapter/roman-numerals/ | 2026-05-20 |
| Roman numeral analysis（概説） | https://en.wikipedia.org/wiki/Roman_numeral_analysis | 2026-05-20 |
| コード進行分析の表記方法 | https://composer-instruments.com/notation-system-of-chord-analysis/ | 2026-05-20 |

---

## 更新履歴

| 版 | 日付 | 内容 |
|----|------|------|
| 1.0 | 2026-05-20 | 初版（理論調査・開発方針） |
| 1.1 | 2026-05-20 | 8 音以上対応、四和音固定表示、タップ同時再生を要件化 |
| 1.2 | 2026-05-20 | 相対/実コード名の 2 段表示・列揃えレイアウト・相対表記規則（§8）を追加 |
| 1.3 | 2026-05-20 | 相対表記の度数 ♯/♭ 規則（§8・Ionian 比較）を追加 |
| 1.4 | 2026-05-20 | 列タップを廃止。各列に再生（▶）・選択ボタンを分離 |
| 1.5 | 2026-05-20 | 半全減・全半減マスタを 8 音に修正（`b7` / `△7` 追加） |
| 1.6 | 2026-05-20 | 四和音 `maj7-sharp5`（`△7(+5)`）追加。Altered IV 度等の aug+長7 対応 |
| 1.7 | 2026-05-20 | `6` 定義修正（`R·3·5·6/13`） |
| 1.8 | 2026-05-20 | 転回形を `I6/III` 等の相対スラッシュ表記に統一。N 行必ず表示・未マップ列はボタン無効 |
| 1.9 | 2026-05-20 | 組み込みスケール `diminished-6th` を追加 |
| 1.10 | 2026-05-20 | 未マップ列も再生可（`playChordSemitonesFromRoot`）。4 音積み上げで PC≦3 のとき三和音表記 |
