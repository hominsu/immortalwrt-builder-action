## About

Github Action to build ImmortalWrt

---

- [About](#about)
- [Usage](#usage)
- [Customizing](#customizing)
  - [inputs](#inputs)

## Usage

```yaml
name: ci

on:
  push:
    tags: ['v*']

jobs:
  build:
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Build
        uses: hominsu/immortalwrt-builder-action@v1
        env:
          PACKAGES: >-
            luci-theme-argon luci-i18n-ttyd-zh-cn luci-i18n-homeproxy-zh-cn
            luci-i18n-cloudflared-zh-cn luci-i18n-dockerman-zh-cn iptables-nft ip6tables-nft
            tailscale
        with:
          image: immortalwrt/imagebuilder:rockchip-armv8-openwrt-24.10.0
          config: ./rockchip/.config
          args: |
            PROFILE=friendlyarm_nanopi-r5c,ROOTFS_PARTSIZE=32000,PACKAGES=PACKAGES=${{ env.PACKAGES }}
```

## Customizing

### inputs

The following inputs can be used as `step.with` keys

> `List` type is a newline-delimited string
>
> ```yaml
> set: target.args.mybuildarg=value
> ```
>
> ```yaml
> set: |
>   target.args.mybuildarg=value
>   foo*.args.mybuildarg=value
> ```

> `CSV` type is a comma-delimited string
>
> ```yaml
> targets: default,release
> ```

| Name           | Type     | Description                                                               |
| -------------- | -------- | ------------------------------------------------------------------------- |
| `image`        | String   | Image tag of ImmortalWrt builder                                          |
| `workdir`      | String   | Working directory of builder                                              |
| `outdir`       | String   | Output directory for the build artifacts                                  |
| `config`       | String   | Configuration file for the builder                                        |
| `args`         | List/CSV | Arguments to pass to builder                                              |
| `github-token` | String   | API token used to authenticate to a Git repository for remote definitions |
