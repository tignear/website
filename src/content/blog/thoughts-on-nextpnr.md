---
title: nextpnr-ecp5のタイミング解析にあるおかしな点
description: 配線遅延はmin/maxとも1.1倍、routerはholdを修正せず、global clock delayは0、CDC datapathのtiming constraintも扱えない。nextpnr-ecp5のタイミング解析について。
publishedAt: 2026-08-30
tags: [FPGA, EDA, nextpnr]
---

nextpnr-ecp5のタイミング解析結果は、そのまま信用できない。

nextpnr-ecp5では、minimumとmaximumの配線遅延が一律1.1倍される。routerはhold violationを修正しない。global clockの配線遅延は0として扱われ、非同期clock間のdatapath delayやbit間skewも制約できない。

表示されたslackの計算条件と、その値から判断できる範囲が分からない。精度以前の問題である。

## 配線遅延を一律1.1倍する「safety margin」

nextpnr-ecp5は、Project Trellisのinterconnect databaseから配線遅延を取り込んでいる。routing switchを種類ごとにまとめたpip classについて、遅延を読み出すコードはこうなっている。

```python
min_delay = pipdata["delay"][0] * 1.1
max_delay = pipdata["delay"][2] * 1.1
```

minimum delayとmaximum delayの両方を、文字どおり一律1.1倍している。[現在のコード](https://github.com/YosysHQ/nextpnr/blob/dec04b3b6494c8b14e8a91701dd9186c6e0ff7d9/ecp5/trellis_import.py#L419-L424)はこれだけである。この係数が追加された[2018年のcommit](https://github.com/YosysHQ/nextpnr/commit/94dc54f4fa03883c20f8d85da2a0ae9ce459a5a5)にも「Add 10% safety margin to pip delays」としか書かれていない。

maximum delayを10%増やせば、データが実際より遅く届くものとしてsetupを解析することになる。これは安全側である。

一方、minimum delayを10%増やすとhold slackは見かけ上増え、violationを見逃す方向に働く。現在のECP5 databaseにある1,484件のminimum delayはすべて非負なので、minimum側の1.1倍はsafety marginとは逆向きである。

10%という値の根拠、すべてのpip classに同じ係数を使う妥当性、元のdatabaseが表すprocess、voltage、temperatureとの関係は、コードにもcommitにも説明されていない。

もっとも、この処理が入った経緯はある程度推測できる。Project Trellisのpip delayは、Diamondが出力したSDFのmin/typ/maxをpip classごとの値に[非負最小二乗で分解した推定値](https://github.com/YosysHQ/prjtrellis/blob/3afe7b52b30f4b4417ee98f03016767a502006e3/timing/util/timing_solver.py#L12-L69)である。経路を単純なpip delayの和で表すmodelの誤差や、推定値の過小評価を雑に補うための1.1だった可能性はある。

さらに重要なのは時期である。1.1倍が追加された2018年のtiming engineは、配線遅延の計算に`maxDelay()`しか使っておらず、hold checkも存在しなかった。minimum delayを1.1倍しても、当時のタイミング判定には影響しなかった。hold/min-delay violationの検出が追加されたのは[2024年](https://github.com/YosysHQ/nextpnr/commit/c25da06d0351b6b07e356b6cae1aa57fde564408)である。

setup-onlyだった時代にminimumとmaximumをまとめて処理し、そのままhold対応後も残ったと考えれば不思議ではない。経験的な補正値を入れたくなる事情も、その根拠をきれいに残すのが面倒なのも分かる。それでも、現在のhold解析でminimum delayまで1.1倍することをsafety marginとして正当化できる理由は思いつかない。

なお、この1.1倍はnextpnrの全architectureに共通する処理ではない。現在のソースで確認できるのは、少なくともECP5とMachXO2/3のdatabase importである。

## hold violationは検出するだけ

2024年に追加されたのは主にhold violationの検出とreportである。現在のtiming engineはhold slackも計算するが、routerが経路の優先度に使うcriticalityは[setup slackだけから計算される](https://github.com/YosysHQ/nextpnr/blob/dec04b3b6494c8b14e8a91701dd9186c6e0ff7d9/common/kernel/timing.cc#L771-L787)。hold violationを見つけて最後にerrorにはできても、配線を遠回りさせるなどして解消するhold-driven routingにはなっていない。

自分がrouterを作るときも、hold violationをroute delayで解消するのは当然だと思って実装していた。Vivadoも実際にholdを直すための迂回配線を大量に入れる。AMDのdocumentationにも、Vivado routerは[setupよりholdの修正を優先し、必要なdelayをrouting detourで追加する](https://docs.amd.com/r/en-US/ug906-vivado-design-analysis/Determining-if-Hold-Fixing-is-Negatively-Impacting-the-Design)と明記されている。少なくともproduction向けのrouterでは普通に必要な処理である。nextpnrを読むまで、検出だけしてrouteには反映しない実装があるとは思っていなかった。こわい。

## 0から0を引いてclock skewを求める

タイミング解析ではデータ経路だけでなく、clockが各flip-flopに到着する時刻も結果に影響する。送り出す側と受け取る側でclockの到着時刻がずれれば、それがclock skewになる。

nextpnrの共通STA engineにも、この差を計算するコードはある。

```cpp
clock_skew = clock_delay_launch - clock_delay_capture;
```

[実際の計算部分](https://github.com/YosysHQ/nextpnr/blob/dec04b3b6494c8b14e8a91701dd9186c6e0ff7d9/common/kernel/timing.cc#L989-L1007)だけを見れば、clock skewは考慮されているように見える。

ところが、その計算が呼び出すroute delayの取得処理にはECP5専用の分岐がある。

```cpp
#ifdef ARCH_ECP5
    if (net_info->is_global)
        return 0;
#endif
```

ECP5のglobal netなら無条件に0を返す。[通常のroute delay](https://github.com/YosysHQ/nextpnr/blob/dec04b3b6494c8b14e8a91701dd9186c6e0ff7d9/common/kernel/context.cc#L117-L122)だけでなく、[min/maxを返す処理](https://github.com/YosysHQ/nextpnr/blob/dec04b3b6494c8b14e8a91701dd9186c6e0ff7d9/common/kernel/context.cc#L166-L171)でも同じである。

通常のclockがglobal networkにpromoteされると、launch側のclock delayは0、capture側も0となる。その差であるclock skewも必ず0である。さらにclock uncertaintyやjitterを与える仕組みもないため、解析上はそれらも0として扱われる。挿入遅延0、skew 0、jitter 0。あまりにも素晴らしいclocking networkとPLLである。もちろん、素晴らしいのは実際のECP5ではなくnextpnrのモデルの中だけである。

同一clockに共通する挿入遅延はsetup解析では相殺される。しかし、sinkごとの到着時刻の差やclockの周期変動は現実には残る。global clock networkを十分に低skewかつ低jitterとみなすなら、少なくともその根拠と上限値が必要である。現在の実装はskewを解析せず、global clockをideal clockとして固定している。

## cross-domain pathを列挙してもtimingは検証できない

複数のclock domainを持つ設計では、さらに話が難しくなる。

nextpnrは異なるclock domainをまたぐpathを見つけ、cross-domain pathとして表示できる。[reportを作るコード](https://github.com/YosysHQ/nextpnr/blob/dec04b3b6494c8b14e8a91701dd9186c6e0ff7d9/common/kernel/timing.cc#L1128-L1141)も存在する。

非同期なclock同士には決まった位相関係がないため、普通のsingle-cycle pathと同じsetup/hold checkは成立しない。しかし、CDC pathを無制約のまま放置してよいわけではない。同期化回路までのdatapath delayや、複数bitをまたぐCDCのskewなど、物理配線に対して課すべき制約は残る。

現在のnextpnrは、互いにrelatedではないclock domain間のhold/min-delay checkを明示的にskipする。[コード上もその条件で`continue`している](https://github.com/YosysHQ/nextpnr/blob/dec04b3b6494c8b14e8a91701dd9186c6e0ff7d9/common/kernel/timing.cc#L1215-L1230)。固定の位相関係を前提とするcheckを止めるところまではよい。その代わりとなる、非同期clock間のdatapath delayやbit間skewに上限を与えて検証する仕組みがない。

cross-domain pathの一覧には意味があるが、それだけでは安全性を検証できない。専用のCDC lintを別のtoolが担当するとしても、place and routeの段階でdatapath delayやbit間skewの上限を扱えなければ、CDCを考慮したタイミング収束はできない。

## PASSの前提が不明確である

自分のrouterを書くためにnextpnrを参考にして、そこで気が付いてしまった。配線遅延には説明のない1.1が掛かり、routerはholdを修正せず、global clock delayは0で、非同期clock間のdatapath delayやbit間skewも制約できない。

EDA toolがPASSを出す以上、実デバイスでその周波数を満たす見込みのある解析結果でなければ困る。仮定や未実装機能を説明して免責すれば済むとも思わない。粗い近似を使うとしても安全側に倒し、place and routeがtiming violationを実際に解消するところまで必要である。

もちろん、vendorはopen source toolchainのためにまともなtiming dataを提供してくれない。公開されていない情報をreverse engineeringで集め、精密なmodelを作り、その正しさまで検証するのが割に合わないことも分かる。真面目に取り組んだだけで簡単に解決する問題でもないし、nextpnrだけを責めても仕方がない。

それでも、多少粗くても根拠のある近似が使われ、modelの限界もある程度は分かるものだと期待していた。nextpnrがオープンソースであるおかげで、実装は自分で確認できる。その実装では、minimumとmaximumの配線遅延が一律1.1倍され、routerはhold violationを修正せず、global clock delayは0として扱われ、CDC datapathのtimingを制約して検証する仕組みもない。

難しい事情は理解していたつもりだが、実際の実装は期待していたものより、よほどひどかった。
