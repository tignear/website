---
title: Discord Embed Editor
description: Discord message / Embedの編集、preview、Webhook送信を行うSvelteアプリ。
year: 2024
role: Product Engineering
stack: [Svelte, TypeScript, Cloudflare]
url: https://discord-embed.tignear.com/
repository: https://github.com/tignear/discord-embed-editor
featured: false
---

DiscordのEmbedメッセージを、実際の表示に近いプレビューを見ながら編集できるWebツールです。

## Editor and renderer

本文、フィールド、画像、author、色などを画面上で組み立て、Webhookへ送るところまでをひとつのUIにまとめています。Discord固有のMarkdown、メンション、絵文字、タイムスタンプも個別のコンポーネントとして描画します。

SvelteとTypeScriptで実装し、ブラウザ操作はPlaywright、ロジックはVitestで確認。Cloudflareへ継続的にデプロイする構成です。
