# Blazor PWA Updater

Blazor PWA Updaterは、新しいバージョンが利用可能になったときにBlazor Progressive Web Applicationに「今すぐ更新」UIと機能を提供する.NETライブラリです。このライブラリは、UIコンポーネントパッケージとサービス層パッケージの2つの主要なNuGetパッケージで構成されています。

常にこれらの手順を最初に参照し、ここの情報と一致しない予期しない情報に遭遇した場合にのみ、検索やbashコマンドにフォールバックしてください。

## 効果的な作業方法

- リポジトリのブートストラップ、ビルド、テスト:
  - .NET 8.0と9.0 SDKをインストール（両方必要）: 
    - `wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb && sudo dpkg -i packages-microsoft-prod.deb && rm packages-microsoft-prod.deb`
    - `sudo apt-get update && sudo apt-get install -y dotnet-sdk-8.0 dotnet-sdk-9.0`
  - Node.js 22+をインストール: `curl -fsSL https://nodejs.org/dist/v22.17.1/node-v22.17.1-linux-x64.tar.xz | sudo tar -xJ -C /usr/local --strip-components=1`
  - `dotnet restore` -- 13秒かかります
  - `dotnet build` -- 10秒かかります。絶対にキャンセルしないでください。安全のため60分以上のタイムアウトを設定してください。
- .NETテストを実行: `dotnet test` -- 7.5秒かかります。絶対にキャンセルしないでください。安全のため30分以上のタイムアウトを設定してください。
- TypeScriptテストを実行:
  - `cd Tests/Updater.Service`
  - `/usr/local/bin/npm install` -- 初回実行時4秒かかります
  - `/usr/local/bin/npm test` -- 2秒かかります。絶対にキャンセルしないでください。安全のため15分以上のタイムアウトを設定してください。
- テスト用サンプルアプリケーションを実行:
  - Blazor Server PWA: `cd SampleSites/BlazorServerPWA1 && dotnet run --urls="http://localhost:8080"`
  - Blazor WebAssembly PWA: `cd SampleSites/BlazorPWA1 && dotnet build` (bin/Debug/net9.0/wwwrootに出力)

## 検証

- 変更後は常に.NETとTypeScriptの両方のテストを実行してください
- 変更後は必ずサンプルアプリケーションを実行して、少なくとも1つの完全なエンドツーエンドシナリオを実行してください
- BlazorServerPWA1サンプルは、HTTPリクエストを介して実行およびテストして機能を検証できます
- 手動検証のために両方のサンプルアプリケーションをビルドして実行できます
- PWA機能、サービスワーカーの動作、更新通知に特別な注意を払ってください

## よく使うタスク

以下は頻繁に実行されるコマンドの出力です。時間を節約するため、表示、検索、bashコマンドの実行の代わりにこれらを参照してください。

### リポジトリ構造
```
├── .github/workflows/unit-tests.yml   # CI/CDパイプライン
├── Updater/                           # メインUIコンポーネントパッケージ
│   ├── PWAUpdater.razor              # メインPWAアップデーターコンポーネント
│   ├── PWAUpdater.razor.css          # コンポーネントスタイル
│   └── Toolbelt.Blazor.PWA.Updater.csproj
├── Updater.Service/                   # コアサービスパッケージ
│   ├── IPWAUpdaterService.cs         # サービスインターフェース
│   ├── PWAUpdaterService.cs          # サービス実装
│   ├── script.ts                     # TypeScriptサービスワーカー統合
│   └── Toolbelt.Blazor.PWA.Updater.Service.csproj
├── Tests/
│   ├── Updater/                      # .NETコンポーネントテスト（Bunit + NUnit）
│   └── Updater.Service/              # TypeScriptサービステスト（Vitest）
├── SampleSites/                      # デモアプリケーション
│   ├── BlazorPWA1/                   # Blazor WebAssembly PWAサンプル
│   └── BlazorServerPWA1/             # Blazor Server PWAサンプル
└── Toolbelt.Blazor.PWA.Updater.sln  # メインソリューションファイル
```

### プロジェクト依存関係
- **.NET 8.0および9.0**: マルチターゲットフレームワークサポート
- **Microsoft.AspNetCore.Components.Web**: Blazorコンポーネントフレームワーク
- **Microsoft.TypeScript.MSBuild**: TypeScriptコンパイル
- **Node.js 22+**: TypeScriptテストのPromise.withResolversに必要
- **Bunit**: Blazorコンポーネントテストフレームワーク
- **NUnit**: .NETテストフレームワーク
- **Vitest**: TypeScriptテストフレームワーク

### 実装済みの主要機能
- **PWAUpdater Razorコンポーネント**: 更新通知のUI
- **PWAUpdaterService**: コア更新検出と管理
- **サービスワーカー統合**: PWA更新用JavaScriptブリッジ
- **環境対応表示**: デフォルトでProductionでのみ表示
- **カスタマイズ可能UI**: CSSカスタムプロパティと子コンテンツサポート
- **マルチプラットフォーム**: Blazor ServerとWebAssemblyの両方で動作

### 検証するテストシナリオ
1. **コンポーネントレンダリング**: 異なる環境でPWAUpdaterコンポーネントをテスト
2. **サービスワーカーライフサイクル**: 更新検出と通知フローをテスト
3. **ユーザーインタラクション**: 「今すぐ更新」ボタン機能をテスト
4. **環境フィルタリング**: 適切な環境でのみUIが表示されることを確認
5. **サンプルアプリケーション**: Blazor ServerとWebAssemblyの両方のサンプルを実行して手動テスト

### よくあるビルド問題と解決策
- **.NET 9.0 SDKの不足**: プロジェクトがマルチターゲットなので.NET 8.0と9.0の両方のSDKをインストール
- **TypeScriptテストの失敗**: Promise.withResolversサポートのためにNode.js 22+がインストールされていることを確認
- **TypeScript依存関係の不足**: Tests/Updater.Serviceディレクトリで`npm install`を実行
- **サンプルアプリエラー**: サンプルアプリケーションを実行する前に、まずソリューションをビルド

### 重要なファイルの場所
- **メインコンポーネント**: `Updater/PWAUpdater.razor`
- **サービスインターフェース**: `Updater.Service/IPWAUpdaterService.cs`
- **TypeScript統合**: `Updater.Service/script.ts`
- **CI設定**: `.github/workflows/unit-tests.yml`
- **パッケージ設定**: `nuget.config` (ローカル_distフォルダを含む)
- **コンポーネントテスト**: `Tests/Updater/PWAUpdaterTests.cs`
- **サービステスト**: `Tests/Updater.Service/tests/script.test.ts`

### パフォーマンス期待値
- **フレッシュクローンから準備完了まで**: 約30秒（.NET restore + Node.jsセットアップを含む）
- **増分ビルド**: 約5-10秒
- **フルテストスイート**: 合計約10秒（.NET + TypeScript）
- **サンプルアプリ起動**: Blazor Serverで約2-3秒、WebAssemblyでは即座（ビルド後）