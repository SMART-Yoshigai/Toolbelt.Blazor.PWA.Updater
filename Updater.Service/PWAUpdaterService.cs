using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;

namespace Toolbelt.Blazor.PWA.Updater.Service;

/// <summary>
/// PWAアップデーターサービスの実装クラス
/// Service Workerとの連携によるPWA更新機能を提供し、
/// JavaScriptとBlazorコンポーネント間の橋渡しを行う
/// </summary>
internal class PWAUpdaterService : IPWAUpdaterService, IDisposable
{
    // 依存性注入されるサービス群
    private readonly IServiceProvider _ServiceProvider;

    private readonly IJSRuntime _JSRuntime;

    private readonly ILogger<PWAUpdaterService> _Logger;

    // サービスの初期化状態とJavaScript通信用のオブジェクトリファレンス
    private bool _Initialized = false;

    private DotNetObjectReference<PWAUpdaterService> _This;

    // 新バージョン待機イベントハンドラー
    private EventHandler? _NextVersionIsWaiting;

    // JavaScriptとの通信用名前空間
    private static readonly string _NS = "Toolbelt.Blazor.PWA.Updater";

    // ホスト環境名のキャッシュ
    public string? _HostEnvironment = null;

    /// <summary>
    /// ホスト環境名を取得
    /// BlazorサーバーまたはWebAssemblyの環境設定から動的に取得し、
    /// デフォルトでは"Production"を返す
    /// </summary>
    public string HostEnvironment
    {
        get
        {
            if (this._HostEnvironment == null)
            {
                this._HostEnvironment = GetHostEnvironmentName(this._ServiceProvider) ?? "Production";
            }
            return this._HostEnvironment;
        }
    }

    /// <summary>
    /// 新バージョン待機イベント
    /// Service Workerが新しいバージョンを検出した際に発生
    /// </summary>
    public event EventHandler? NextVersionIsWaiting
    {
        add
        {
            this._NextVersionIsWaiting += value;
            if (!this._Initialized)
            {
                // 初回イベント登録時にJavaScript側にDotNetオブジェクトを登録
                this._Initialized = true;
                var t = this._JSRuntime.InvokeVoidAsync(_NS + ".setToBeReady", this._This);
                t.GetAwaiter().OnCompleted(() =>
                {
                    try { t.GetAwaiter().GetResult(); }
                    catch (Exception e) { this._Logger.LogError(e, e.Message); }
                });
            }
        }
        remove
        {
            this._NextVersionIsWaiting -= value;
        }
    }

    /// <summary>
    /// PWAアップデーターサービスのコンストラクター
    /// 依存性注入によりJSランタイム、ロガー、サービスプロバイダーを受け取り、
    /// JavaScriptとの通信用DotNetオブジェクトリファレンスを作成
    /// </summary>
    [DynamicDependency(nameof(OnNextVersionIsWaiting))]
    public PWAUpdaterService(IServiceProvider serviceProvider, IJSRuntime jSRuntime, ILogger<PWAUpdaterService> logger)
    {
        this._ServiceProvider = serviceProvider;
        this._JSRuntime = jSRuntime;
        this._Logger = logger;
        this._This = DotNetObjectReference.Create(this);
    }

    /// <summary>
    /// ホスト環境名を動的に取得
    /// BlazorサーバーとWebAssembly両方の環境タイプに対応
    /// </summary>
    private static string? GetHostEnvironmentName(IServiceProvider serviceProvider)
    {
        var (serviceObject, propertyInfo) = EnumHostEnvironmentService()
            .Select(((Type serviceType, PropertyInfo? propInfo) a) => (serviceProvider.GetService(a.serviceType), a.propInfo))
            .Where(((object? service, PropertyInfo? propInfo) a) => a.service != null && a.propInfo != null)
            .FirstOrDefault();
        if (serviceObject != null && propertyInfo != null)
        {
            return propertyInfo.GetValue(serviceObject) as string;
        }
        return null;
    }

    /// <summary>
    /// ホスト環境サービスの列挙
    /// BlazorサーバーとWebAssembly環境の両方に対応するため、
    /// リフレクションを使用して動的に環境サービスを検出
    /// </summary>
    public static IEnumerable<(Type, PropertyInfo?)> EnumHostEnvironmentService()
    {
#pragma warning disable IL2026, IL2075
        foreach (var type in AppDomain.CurrentDomain.GetAssemblies().SelectMany(asm => { try { return asm.GetExportedTypes(); } catch { return Enumerable.Empty<Type>(); } }))
        {
            if (type.FullName == "Microsoft.AspNetCore.Components.WebAssembly.Hosting.IWebAssemblyHostEnvironment")
            {
                yield return (type, type.GetProperty("Environment"));
            }
            else if (type.FullName == "Microsoft.Extensions.Hosting.IHostEnvironment")
            {
                yield return (type, type.GetProperty("EnvironmentName"));
            }
        }
#pragma warning restore IL2026, IL2075
    }

    /// <summary>
    /// Service Workerの待機状態をスキップしてアップデートを開始
    /// ユーザーが「今すぐ更新」ボタンをクリックした際に呼び出される
    /// </summary>
    public async ValueTask SkipWaitingAsync()
    {
        await this._JSRuntime.InvokeVoidAsync(_NS + ".skipWaiting");
    }

    /// <summary>
    /// JavaScript側からの新バージョン待機通知を受信
    /// Service Workerが新しいバージョンを検出した際にJavaScriptから呼び出される
    /// </summary>
    [JSInvokable, EditorBrowsable(EditorBrowsableState.Never)]
    public void OnNextVersionIsWaiting()
    {
        this._NextVersionIsWaiting?.Invoke(this, EventArgs.Empty);
    }

    /// <summary>
    /// リソースの解放
    /// DotNetオブジェクトリファレンスを適切に解放してメモリリークを防ぐ
    /// </summary>
    public void Dispose()
    {
        this._This.Dispose();
    }
}
