---
title: pokedr-gto
description: CFRを実装したRust製ポーカーソルバーとReact viewer。
year: 2026
role: Research & Engineering
stack: [Rust, CFR, React, TypeScript]
repository: https://github.com/tignear/pokedr-gto
featured: false
---

ゲーム理論最適戦略を計算するポーカーソルバー。公開ゲーム木をたどりながら、Counterfactual Regret Minimization（CFR）で戦略を反復的に改善します。

## What is inside

- アクションごとのregretと平均戦略を保持する、node-localなCFR実装
- public chance isomorphismを使った、同型なボードの集約
- profile / best response traversalによるexploitabilityの計算
- TOML設定を受け取るCLIと、解を探索するReactベースのviewer

現在はCPU実装を正しさと性能の基準にし、将来GPUへ移せるデータレイアウトと計算境界を検討しています。

設計メモや最適化の試行もリポジトリ内に残し、実装だけでなく調査の過程まで追えるようにしています。
