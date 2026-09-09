# tignear.com

Astro 7で静的生成し、Cloudflare Workers Static Assetsから配信するblog + portfolioです。通常の閲覧ではサーバー処理を呼ばず、静的ファイルだけを返します。

## ローカル開発

Node.js 24以降を使用します。

```sh
npm install
npm run dev
```

本番相当の確認:

```sh
npm test
npm run build
npm run preview
```

## コンテンツを更新する

- ブログ: `src/content/blog/` にMarkdownまたはMDXを追加
- 制作実績: `src/content/works/` にMarkdownまたはMDXを追加
- 名前・説明・連絡先: `src/site.config.ts`

トップページのNotesには、`src/site.config.ts`の`externalPosts`で指定したZenn・Qiitaアカウントの記事もビルド時に取得し、公開日順で表示します。外部フィードを一時的に取得できない場合も、ローカルの記事だけでビルドを続行します。

frontmatterは`src/content.config.ts`で検証されます。公開前の記事には`draft: true`を指定してください。変更をcommitしてGitHubへpushすると、Cloudflare側で自動ビルドできます。

## 記事に図を書く

Markdownで `d2` コードブロックを書くと、開発時・ビルド時にSVGへ変換します。`npm install` だけで利用でき、D2 CLIの追加インストールは不要です。

````markdown
```d2 合成からbitstream生成までの流れ
direction: right

source: Veryl
synthesis: 論理合成
route: 配置配線
output: bitstream

source -> synthesis -> route -> output
```
````

`d2` に続けて書いた説明文は図のキャプションと読み上げ用の名前になります。説明文は省略できます。サイトに合わせた配色、ダークモード、横長の図の横スクロールに対応しています。通常のコードブロックの表示は従来どおりです。

図は静的なSVGとしてHTMLに埋め込むので、閲覧時にD2のJavaScriptやWASMをダウンロードしません。図内の欧文フォントは必要な文字だけSVGに埋め込みます。構文エラーは記事のファイル名とコードブロックの行番号を付けて報告し、ビルドを失敗させます。

D2の書き方は[公式ドキュメント](https://d2lang.com/tour/intro/)、ブラウザでの試作は[Playground](https://play.d2lang.com/)を参照してください。

## Cloudflare Workersへ公開する

Cloudflare Dashboardの **Workers & Pages → Create → Import a repository** からGitHubリポジトリを接続します。

| 設定 | 値 |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Version command | `npx wrangler versions upload` |

初回デプロイ後、Workerの **Settings → Domains & Routes → Add → Custom Domain** で`tignear.com`を追加します。apexドメインを使うには、そのドメインのDNSを同じCloudflareアカウントで管理します。`www.tignear.com`はCloudflareのRedirect Ruleで`https://tignear.com`へ301転送するのが単純です。

CLIから手動で公開する場合:

```sh
npx wrangler login
npm run deploy
```

## 費用と配信方針

- ホスティング: Cloudflare Workers Free（静的アセットのリクエスト、保存、転送は無料）
- 固定費: `tignear.com`のドメイン更新料のみ
- ページ: ビルド時にHTML化し、閲覧時のSSRやデータベースを使わない
- JavaScript: 現在のページにはクライアントJavaScriptを配信しない
- フォント: OS標準フォントを使い、外部フォントをダウンロードしない
- キャッシュ: ハッシュ付きのCSSなどを1年間immutableでキャッシュ

Cloudflare Freeでは静的ファイル20,000件、1ファイル25 MiBまでです。大きな動画や配布物はGitに入れず、必要になった時点でR2などへ分離してください。
