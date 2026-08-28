---
title: Texo
description: Lattice ECP5向けのpacking、place-and-route、timing analysis、bitstream生成。
year: 2026
role: Creator / Physical Design Engineering
stack: [Rust, FPGA, Place & Route, Timing]
repository: https://github.com/fabrica-eda/texo
featured: true
order: 1
---

Struoのtechnology-mapped netlistを受け取り、packing、placement、routing、static timing analysis、configuration generationを経てECP5 bitstreamを生成するplace-and-route projectです。

## Typed physical model

cell、net、BEL、wire、PIPをひとつのtyped graphとして見せながら、storageはcompactなarenaへ分離。PnR algorithmはVeryl、Struo、特定FPGAのdatabaseへ依存せず、adapterとtarget固有情報を境界に置きます。

deterministicなsearchは、scratch flowと将来のincremental / ECO flowで同じmodelを共有します。常にbest legal implementationを保持し、追加の計算時間でquality of resultsを改善できるanytime searchを目指しています。

生成したcheckpointは、cellとroute topology、setup / hold slackをブラウザで探索できるself-containedなHTMLへ可視化できます。
