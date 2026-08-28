---
title: Celox
description: Veryl用RTL simulator。native / WebAssembly backendとTypeScript APIを実装。
year: 2026
role: Creator / Compiler Engineering
stack: [Rust, Veryl, TypeScript, WebAssembly]
url: https://celox-sim.github.io/celox/
repository: https://github.com/celox-sim/celox
featured: true
order: 3
---

Verylで書かれたRTLを実行可能なsimulation kernelへcompileし、型安全なTypeScript APIからテストできるRTL simulatorです。

## One pipeline, multiple backends

frontendで階層を展開したあと、source-independentな表現へ変換。依存関係とclock domainをscheduleし、backend共通のSimulator IRとstate layoutをつくります。

その先はcustom x86-64 / AArch64 backend、Cranelift JIT、WebAssemblyへ分岐します。どのbackendでもruntime contractとテスト側のAPIは同じです。

## RTL testing that feels native

Vite pluginがVeryl moduleからTypeScript sidecarを生成するため、port名、値、hierarchyをTypeScriptで検査できます。Vitestでassertionを書き、VCD waveformを出力し、複数clock domainや4-stateの値も扱えます。

ブラウザで動くplayground、Rust SDK、cocotb / VPI integrationまで含め、simulator architectureの実験場でありながら実際にRTLをテストできる道具を目指しています。
