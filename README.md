# <img src="/applications/pass/src/favicon.svg" style="vertical-align: middle; margin-right: 5px;" height="25" width="25" /> <span style="vertical-align: middle; display: inline-block">Proton Pass Extension</span>

This is a Modified Proton Pass web extension with add-on features

- Custom E-Mail auto fill (1.36.1.1)
- Biometric unlock (1.36.1.3)
- More auto lock time selection (3, 8 hours, 1 day, until browser closed) (1.36.1.3)
- Domain wildcard support (1.36.1.4)
  - Ex. `https://*.google.com:*` will allow `maps.google.com:8123`

## Disclaimer

This project has been modified for personal use and is provided as-is, without any warranty of any kind. Use it at your own risk.

The author is not responsible for any data loss, account issues, security incidents, or other damages that may result from using this extension.

Do not provide your main Proton password, recovery codes, or other sensitive credentials to any third-party extensions, apps, or services that you do not fully trust. For better security, use a separate account or limited-access credentials whenever possible.

## Getting Started

### Prerequisites

You'll need to have the following environment to work with this project:

- Node.js LTS
- Yarn 4
- git

See `package.json` for specific version requirements.

### Installation on Apple Silicon Macs

```shell
arch -x86_64 yarn workspaces focus root proton-pass-extension
arch -x86_64 yarn workspace proton-pass-extension start
```

### Build for Chrome

```shell
arch -x86_64 yarn workspace proton-pass-extension build:extension
```

### Build for Safari

```shell
sed -i '' -E "s/(\"version\": )\"[^\"]*\"/\1\"$(date +%Y.%m%d.%H%M)\"/" manifest-safari.json && BUILD_TARGET=safari yarn build:extension && (
  cd safari &&
  ruby ./tools/reference_dist_directory.rb &&
  xcodebuild \
    -project "Proton Pass.xcodeproj" \
    -scheme "Open Pass" \
    -configuration Debug \
    -derivedDataPath ./build \
    build &&
  open "./build/Build/Products/Debug-maccatalyst/Open Pass for Safari.app" &&
  pkill -x Safari &&
  open -a Safari
)
```

## License

The code and data files in this distribution are licensed under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. See https://www.gnu.org/licenses/ for a copy of this license.

See [LICENSE](LICENSE) file
