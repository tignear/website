---
title: node-openjtalk-binding
description: Open JTalkをNode.jsから呼び出すN-API native addon。
year: 2021
role: Library Engineering
stack: [C++, C, Node.js, N-API]
repository: https://github.com/tignear/node-openjtalk-binding
featured: false
---

Open JTalkの音声合成機能をNode.jsから呼び出すためのネイティブアドオンです。日本語テキストとHTS voiceを受け取り、WAVに変換できるPCMデータを返します。

## Between C++ and JavaScript

Open JTalk、MeCab、HTS EngineをC/C++側に組み込み、JavaScriptにはPromiseベースの小さなAPIとして公開しています。TypeScript用の型定義も同梱しています。

`node-gyp`によるソースビルドに加え、GitHub Releasesから環境に合うプリビルドバイナリを取得できる構成です。ネイティブの複雑さを、Node.js側へ持ち込まないことを目指しました。
