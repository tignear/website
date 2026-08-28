---
title: Struo
description: VerylからLattice ECP5 netlistへのlogic synthesisとequivalence checkを実装。
year: 2026
role: Creator / Synthesis Engineering
stack: [Rust, Veryl, AIG, SAT, ECP5]
repository: https://github.com/fabrica-eda/struo
featured: true
order: 2
---

Verylの設計をtarget-independentなbit-level netlistへ下げ、Lattice ECP5のLUT4 / TRELLIS_FFなどへtechnology mappingするlogic synthesis workspaceです。

## Verification is part of the flow

RTL simulation、synthesized netlistとのequivalence、unresolved primitiveの検査、post-synthesis simulation、place-and-route、timing closure。すべてが揃うまでbitstreamのreleaseを許可しません。

equivalence checkはVerilogや外部のYosys / ABCを経由せず、RTLとnetlistのsemanticsをAIGへbit-blastし、内蔵のCDCL SAT kernelでmiterを解きます。非等価なら、最初に出力が食い違うcycleまでのinput traceを返します。

frontend固有の型をsynthesis coreへ漏らさず、Veryl以外の入力やCelox以外のsimulatorにも境界から接続できる構成です。
