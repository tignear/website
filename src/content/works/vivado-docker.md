---
title: Vivado in Docker
description: Vivado / Vitis 2025.2をUbuntu 22.04へ導入するDocker環境。
year: 2026
role: Developer Tooling
stack: [Docker, Vivado, Linux, Shell]
repository: https://github.com/tignear/vivado-docker
featured: false
---

AMD Vivado / VitisをUbuntuコンテナへbatch installし、HDL開発環境を再現できるようにしたセットアップです。

## Reproducible, without leaking secrets

大きなインストーラーはbind mount、認証トークンはBuildKit secretとして渡し、イメージのlayerやbuild logへ残さない構成にしています。

GUI関連ライブラリや32bit runtimeを含む依存関係、コンテナ固有のライブラリ衝突へのworkaroundもDockerfileに固定。セットアップスクリプトから認証、buildまでの手順を短く保っています。
