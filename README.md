# Blazor PWA Updater

[![NuGet Package](https://img.shields.io/nuget/v/Toolbelt.Blazor.PWA.Updater.svg)](https://www.nuget.org/packages/Toolbelt.Blazor.PWA.Updater/) [![unit tests](https://github.com/jsakamoto/Toolbelt.Blazor.PWA.Updater/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/jsakamoto/Toolbelt.Blazor.PWA.Updater/actions/workflows/unit-tests.yml) [![Discord](https://img.shields.io/discord/798312431893348414?style=flat&logo=discord&logoColor=white&label=Blazor%20Community&labelColor=5865f2&color=gray)](https://discord.com/channels/798312431893348414/1202165955900473375)

## 📝 概要

新しいバージョンが利用可能になったときに表示される「今すぐ更新」UIと機能をBlazor PWAに提供します。

![](https://raw.githubusercontent.com/jsakamoto/Toolbelt.Blazor.PWA.Updater/main/.assets/fig.001.png)

### サポートプラットフォーム

.NET 8、9以降。Blazor ServerとBlazor WebAssemblyの両方をサポートしています。

## 🤔 背景

通常、PWAのサービスワーカーは、サーバーに更新されたコンテンツがデプロイされても、そのPWAのページを再読み込みしても更新されません。ユーザーがすべてのタブでPWAから離れた後に、更新が完了します。これはBlazor固有の問題ではなく、標準的なWebプラットフォームの動作です。

詳細については、Microsoft Docsサイトの以下のリンクも参照してください。

[_"ASP.NET Core Blazor Progressive Web App (PWA)"_ | Microsoft Docs](https://docs.microsoft.com/aspnet/core/blazor/progressive-web-app?view=aspnetcore-6.0&tabs=visual-studio#update-completion-after-user-navigation-away-from-app)

しかし、時にはサイトオーナーや開発者ができるだけ早く更新を完了させたい場合があります。その場合、ブラウザ画面上でサービスワーカーの新しいバージョンが準備完了であることをユーザーに通知し、ユーザーの手動操作により更新プロセスをトリガーすることしかできません。

このNuGetパッケージを使用すると、以下のGIFアニメーションのような動作をBlazor PWAでより簡単に実装できます。

![](https://raw.githubusercontent.com/jsakamoto/Toolbelt.Blazor.PWA.Updater/main/.assets/movie.001.gif)

## 🚀 クイックスタート

### 1. このNuGetパッケージをインストール

```shell
dotnet add package Toolbelt.Blazor.PWA.Updater
```

### 2. DIコンテナに「PWA updater」サービスを登録

```csharp
// 📜 これはBlazor PWAの「Program.cs」ファイルです。
...
// 👇 名前空間を開くためにこの行を追加...
using Toolbelt.Blazor.Extensions.DependencyInjection;
...
// 👇 DIコンテナに「PWA updater」サービスを登録するためにこの行を追加。
builder.Services.AddPWAUpdater();
...
await builder.Build().RunAsync();
```

### 3. Blazor PWAのどこかに`<PWAUpdater>`コンポーネントを配置

`<PWAUpdater>`コンポーネントは、ユーザーに「今すぐ更新」ボタンとその通知バーを表示するユーザーインターフェース要素です。`<PWAUpdater>`コンポーネントを配置する良い場所の1つは、「MainLayout.razor」などの共有レイアウトコンポーネントのどこかです。

```razor
@* 📜 これはBlazor PWAの「MainLayout.razor」ファイルです *@
@inherits LayoutComponentBase

@* 👇 「今すぐ更新」ボタンUIを配置するためにこの行を追加。 *@
<PWAUpdater />
...
```

### 4. 「service-worker.published.js」ファイルを修正

```js
// 📜 これはBlazor PWAの「service-worker.published.js」ファイルです。

// 👇 このライブラリからのメッセージを受け入れるためにこれらの行を追加。
self.addEventListener('message', event => { 
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
...
```

### 5. 「index.html」ファイルを修正

```html
<!-- 📜 これはBlazor PWAの「index.html」ファイルです。 -->
  ...
  <script src="_framework/blazor.webassembly.js"></script>

  <!-- 👇 このスクリプトを削除し...
  <script>navigator.serviceWorker.register('service-worker.js');</script> -->

  <!-- 👇 代わりにこのスクリプト要素を追加。 -->
  <script src="_content/Toolbelt.Blazor.PWA.Updater.Service/script.min.js"></script>
</body>
</html>
```

以上です。

### 注意: CSSスタイルシートの含有

このパッケージは、アプリケーションがデフォルトでBlazorのCSS分離を使用することを前提としています。通常、この前提条件は適切です。しかし、残念ながら「empty」プロジェクトテンプレートで作成されたプロジェクトなど、一部のBlazorプロジェクトシナリオではCSS分離が設定されていません。この場合、このパッケージのCSSファイルはアプリで読み込まれることがなく、PWAUpdaterコンポーネントが正しく表示されません。この問題を解決するには、このパッケージのCSSファイルを自分で含める必要があります。

具体的には、以下のコードのように、フォールバックHTMLドキュメントファイルにプロジェクト用のバンドルCSSファイルを含めるか、

```html
<!DOCTYPE html>
<html lang="en">
<head>
    ...
    <!-- 👇 この行を追加。 -->
    <link href="{ASSEMBLY NAME}.styles.css" rel="stylesheet" />
    ....
```

または、以下のコードのように、このパッケージ用のCSSファイルを個別に含めます。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    ...
    <!-- 👇 この行を追加。 -->
    <link href="_content/Toolbelt.Blazor.PWA.Updater/Toolbelt.Blazor.PWA.Updater.bundle.scp.css"
        rel="stylesheet" />
    ...
```

参照: https://learn.microsoft.com/aspnet/core/blazor/components/css-isolation


## ⚙️ 設定

### `PWAUpdater`コンポーネントのパラメータ

パラメータ           | 型   | 説明
--------------------|--------|--------------
Text                | string | 通知バーUIに表示されるテキスト。デフォルト値は「The new version is ready.」です。
ButtonCaption       | string | 更新をトリガーするボタンのキャプションとして表示されるテキスト。デフォルト値は「UPDATE NOW」です。
Align               | PWAUpdater.Aligns | 通知バーの位置を指定する値で、`Top`または`Bottom`です。デフォルト値は`Top`です。
EnvironmentsForWork | string | 通知UIが動作する環境名を指定するカンマ区切りの文字列。このパラメータが空文字列の場合、開発中を含む現在の環境名に関係なく通知が常に動作します。通常、通知UIは開発中は煩わしいものなので、このパラメータのデフォルト値は「Development」を含まない「Production」です。
State (*バインド可能)   | PWAUpdater.States | 通知バーの表示状態を指定または表現する値で、`Hidden`、`Showing`、`Shown`、`Hiding`のいずれかです。デフォルト値は`Hidden`です。
StateChanged        | EventCallback<PWAUpdater.States> | `State`パラメータの値が変更されたときに呼び出されるイベントコールバック。
ChildContent        | Renderfragment | 通知バーの一部としてレンダリングされるコンテンツ。

### `PWAUpdater`の通知バーを強制的に表示する方法

開発者が通知バーの外観をカスタマイズする作業をしている場合など、サービスワーカーの更新が発生していなくても通知バーを表示したい場合があります。

その場合、`PWAUpdater`コンポーネントの`State`パラメータの初期値を一時的に`Showing`に設定することで実現できます。

```html
<PWAUpdater State="PWAUpdater.States.Showing"/>
```

リリース前に`State`パラメータの設定を削除することを忘れないでください。

### `PWAUpdater`の通知バーに子コンテンツを追加する方法

`PWAUpdater`の通知バーにその子コンテンツとしてカスタムコンテンツを追加したい場合は、通常のBlazorプログラミング方法で行うことができます。つまり、`<PWAUpdater>`タグの子ノードとしてマークアップを記述します。

例えば、コンポーネントを次のようにマークアップすると、

```html
<PWAUpdater>
    <a href="https://blazor.net" target="_blank"
       style="color: var(--pwa-updater-bar-color); margin-left: 26px; flex: 1">
        about Blazor
    </a>
</PWAUpdater>
```

以下の画像のような画面が表示されます。

![](https://raw.githubusercontent.com/jsakamoto/Toolbelt.Blazor.PWA.Updater/main/.assets/fig.003.png)

### `PWAUpdater`コンポーネント用のCSSカスタムプロパティ（変数）

通知UIの外観を設定するために、`.pwa-updater[b-pwa-updater]`スコープで以下のCSSカスタムプロパティ（変数）が定義されています。

プロパティ名               | 説明
----------------------------|---------------------------
--pwa-updater-font-size     | 通知UIのフォントサイズ。デフォルト値は`13px`です。
--pwa-updater-font-family   | 通知UIのフォントファミリー。デフォルト値は`sans-serif`です。
--pwa-updater-bar-height    | 通知UIの高さ。デフォルト値は`32px`です。
--pwa-updater-bar-color     | 通知UIの前景色。デフォルト値は`white`です。
--pwa-updater-bar-backcolor | 通知UIの背景色。デフォルト値は`darkorange`です。
--pwa-updater-bar-z-index   | 通知UIのZ-index値。デフォルト値は`10`です。

Blazor PWAで以下のようなCSSスタイルを定義すると、

```css
body .pwa-updater[b-pwa-updater] {
    --pwa-updater-bar-backcolor: forestgreen;
}
```

以下のような緑色の通知UIの外観を取得できます。

![](https://raw.githubusercontent.com/jsakamoto/Toolbelt.Blazor.PWA.Updater/main/.assets/fig.002.png)

### サービスワーカーのスクリプトファイル名をカスタマイズ

デフォルトでは、このパッケージはサービスワーカーとして「service-worker.js」JavaScriptファイルを読み込みます。Blazor PWAのサービスワーカーのスクリプトファイルパスが「service-worker.js」でない場合は、以下の例のように「PWA Updater」のJavaScriptファイルを読み込むスクリプト要素のプロパティとしてそのパスを指定する必要があります。

```html
<!-- 📜 これはBlazor PWAの「index.html」ファイルです。 -->
  ...
  <!-- 👇 サービスワーカースクリプトファイルを指定するために「register」を設定。 -->
  <script src="_content/Toolbelt.Blazor.PWA.Updater.Service/script.min.js"
          register="path/to/your-service-worker.js">
  </script> 
</body>
</html>
```

### サービスワーカーの登録プロセスをカスタマイズ

時には、サービスワーカーの登録プロセスで何かを行う必要がある場合があります。この場合、「PWA Updater」のJavaScriptファイルを読み込むスクリプト要素に`no-register`属性を追加して、自動的にサービスワーカーのスクリプトファイルが読み込まれるのを防ぐことができます。

その場合は、サービスワーカーの登録のコールバックで、「PWA Updater」JavaScriptコードの一部である`Toolbelt.Blazor.PWA.Updater.handleRegistration()`メソッドを手動で呼び出してください。

```html
<!-- 📜 これはBlazor PWAの「index.html」ファイルです。 -->
  ...
  <!-- 👇 サービスワーカーの登録を防ぐために「no-register」属性を設定。 -->
  <script src="_content/Toolbelt.Blazor.PWA.Updater.Service/script.min.js"
          no-register>
  </script>

  <script>
    navigator.serviceWorker.register('service-worker.js').then(registration => {
      ...
      // 👇 これを手動で呼び出し。
      Toolbelt.Blazor.PWA.Updater.handleRegistration(registration);
      ...
    });
  </script>
</body>
</html>
```

## ⛏️ UIをゼロから実装

「PWA Updater」用のUIコンポーネントをゼロから実装することができます。

そのためには、まず`Toolbelt.Blazor.PWA.Updater`NuGetパッケージの代わりに`Toolbelt.Blazor.PWA.Updater.Service`NuGetパッケージのみを参照します。

```shell
dotnet add package Toolbelt.Blazor.PWA.Updater.Service
```

次に、`IPWAUpdaterService`オブジェクトをRazorコンポーネントに注入します。

```razor
@* 📜 Razorコンポーネントファイル (.razor) *@
@using Toolbelt.Blazor.PWA.Updater.Service
@inject IPWAUpdaterService PWAUpdaterService
...
```

そして、コンポーネントで`NextVersionIsWaiting`イベントを購読します。`NextVersionIsWaiting`イベントが発生したとき、Blazor PWAは次のバージョンに更新する準備ができています。通常、このイベントが発生したときにコンポーネントはユーザーに通知を表示する必要があります。

```razor
@* 📜 Razorコンポーネントファイル (.razor) *@
...
@code {
  protected override void OnAfterRender(bool firstRender)
  {
    if (firstRender)
    {
      this.PWAUpdaterService.NextVersionIsWaiting += PWAUpdaterService_NextVersionIsWaiting;
    }
  }
  ...
```

> **警告**  
> そのイベントを`OnAfterRender`ライフサイクルイベントメソッドで購読することを強くお勧めします。`OnInitialized`などの他のライフサイクルメソッドでイベントを購読すると、Blazor PWAでサーバーサイドプリレンダリングを実装している場合、サーバーサイドプリレンダリング時にランタイムエラーが発生します。

> **警告**  
> 以下のサンプルコードのように、コンポーネントが破棄されるときに`NextVersionIsWaiting`イベントの購読を解除することを忘れないでください。

```razor
@* 📜 Razorコンポーネントファイル (.razor) *@
...
@implements IDisposable
...
@code {
  ...
  void IDisposable.Dispose()
  {
    this.PWAUpdaterService.NextVersionIsWaiting -= PWAUpdaterService_NextVersionIsWaiting;
  }
  ...
```

最後に、Blazor PWAを次のバージョンに更新するために`IPWAUpdaterService`オブジェクトの`SkipWaitingAsync`非同期メソッドを呼び出します。通常、このメソッドはユーザーのアクションに応じて呼び出される必要があります。`SkipWaitingAsync`メソッドはBlazor PWAを次のバージョンに更新し、Blazor PWAは即座に再読み込みされます。

```razor
@* 📜 Razorコンポーネントファイル (.razor) *@
...
@code {
  ...
  private async Task OnClickUpdateNowAsync()
  {
    await this.PWAUpdaterService.SkipWaitingAsync();
  }
  ...
```

さらに、UIがリリース環境でのみ動作するように実装することを検討してください。「PWA Updater」UIが開発フェーズを含めて常に動作する場合、開発速度が低下する必要があります。`Toolbelt.Blazor.PWA.Updater`NuGetパッケージによって提供されるUIは、`IWebAssemblyHostEnvironment`オブジェクトの`Environment`プロパティを参照することでそれを行っています。

## 🎉 リリースノート

- [Toolbelt.Blazor.PWA.Updater用](https://github.com/jsakamoto/Toolbelt.Blazor.PWA.Updater/blob/main/Updater/RELEASE-NOTES.txt)
- [Toolbelt.Blazor.PWA.Updater.Service用](https://github.com/jsakamoto/Toolbelt.Blazor.PWA.Updater/blob/main/Updater.Service/RELEASE-NOTES.txt)

## 📢 ライセンス

[Mozilla Public License Version 2.0](https://github.com/jsakamoto/Toolbelt.Blazor.PWA.Updater/blob/main/LICENSE)