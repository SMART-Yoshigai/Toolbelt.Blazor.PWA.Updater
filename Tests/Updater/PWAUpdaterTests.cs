using Bunit;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Toolbelt.Blazor.PWA.Updater.Service;
using Toolbelt.Blazor.PWA.Updater.Test.Fixtures;

namespace Toolbelt.Blazor.PWA.Updater.Test;

/// <summary>
/// PWAアップデーターコンポーネントのテストクラス
/// 環境別の表示制御とユーザーインタラクションの動作を検証
/// </summary>
public class PWAUpdaterTests
{
    /// <summary>
    /// テスト用のBlazorコンテキストを作成
    /// プラットフォーム（Blazorサーバー/WebAssembly）と環境名を指定して設定
    /// </summary>
    static Bunit.TestContext CreateContext(Platform platform, string environment)
    {
        var ctx = new Bunit.TestContext();
        ctx.Services.TryAddScoped<PWAUpdaterService>();
        ctx.Services.TryAddScoped<IPWAUpdaterService>(sp => sp.GetRequiredService<PWAUpdaterService>());
        switch (platform)
        {
            case Platform.BlazorServer:
                // Blazorサーバー用のホスト環境サービスを設定
                ctx.Services.RemoveAll<IHostEnvironment>();
                ctx.Services.AddScoped<IHostEnvironment>(_ => new HostEnv(environment));
                break;
            case Platform.BlazorWebAssembly:
                // BlazorWebAssembly用のホスト環境サービスを設定
                ctx.Services.RemoveAll<IWebAssemblyHostEnvironment>();
                ctx.Services.AddScoped<IWebAssemblyHostEnvironment>(_ => new WasmHostEnv(environment));
                break;
            default: throw new NotImplementedException();
        }
        return ctx;
    }

    // テスト対象のプラットフォーム（BlazorサーバーとWebAssembly）
    private static readonly IEnumerable<Platform> _Platfoems = new[] {
        Platform.BlazorServer,
        Platform.BlazorWebAssembly };

    // デフォルトパラメーターでの環境別表示テストケース
    // [プラットフォーム, ホスト環境, 表示期待値]
    private static readonly IEnumerable<IEnumerable<object>> _TestCases1 = _Platfoems.SelectMany(platform => (new object[][] {
        ["Production", true],      // Productionでは表示
        ["Development", false], }  // Developmentでは非表示
    ).Select(pattern => pattern.Prepend(platform).ToArray()));

    /// <summary>
    /// デフォルトパラメーターでの環境別表示テスト
    /// Production環境では表示、Development環境では非表示になることを確認
    /// </summary>
    [TestCaseSource(nameof(_TestCases1))]
    public void Visibility_by_Environment_with_DefaultParams_Test(Platform platform, string hostEnv, bool expectedVisible)
    {
        // Given - テスト環境とコンポーネントを準備
        using var ctx = CreateContext(platform, hostEnv);
        var cut = ctx.RenderComponent<PWAUpdater>();
        cut.FindAll(".pwa-updater").Count.Is(0); // 初期状態では何も表示されないことを確認

        // When - 新バージョン待機状態をシミュレート
        ctx.Services.GetRequiredService<PWAUpdaterService>().OnNextVersionIsWaiting();

        // Then - 期待される表示状態を確認
        if (expectedVisible)
            cut.WaitForState(() => cut.Find(".pwa-updater").ClassList.Contains("visible"));
        else
            cut.FindAll(".pwa-updater").Count.Is(0);
    }

    // EnvironmentsForWorkパラメーター指定時の環境別表示テストケース
    // [プラットフォーム, ホスト環境, 動作対象環境設定, 表示期待値]
    private static readonly IEnumerable<IEnumerable<object>> _TestCases2 = _Platfoems.SelectMany(platform => (new object[][] {
        ["Production", "", true],           // 空文字指定時は全環境で表示
        ["Development", "", true],          // 空文字指定時は全環境で表示
        ["Production", "Development", false], // Production環境だがDevelopment指定のため非表示
        ["Development", "Development", true], // Development環境でDevelopment指定のため表示
        ["EnvA", "EnvA,EnvB", true],        // EnvAがリストに含まれるため表示
        ["EnvB", "EnvA, EnvB", true],       // EnvBがリスト（スペース含む）に含まれるため表示
        ["EnvC", "EnvA,EnvB", false], }     // EnvCがリストに含まれないため非表示
    ).Select(pattern => pattern.Prepend(platform).ToArray()));

    /// <summary>
    /// EnvironmentsForWorkパラメーター指定時の環境別表示テスト
    /// カスタム環境設定による表示制御の動作を確認
    /// </summary>
    [TestCaseSource(nameof(_TestCases2))]
    public void Visibility_by_Environment_and_EnvForWorkParam_Test(Platform platform, string hostEnv, string envForWork, bool expectedVisible)
    {
        // Given - テスト環境とカスタム動作環境パラメーターを設定
        using var ctx = CreateContext(platform, hostEnv);
        var cut = ctx.RenderComponent<PWAUpdater>(param => param.Add(_ => _.EnvironmentsForWork, envForWork));
        cut.FindAll(".pwa-updater").Count.Is(0); // 初期状態では何も表示されないことを確認

        // When - 新バージョン待機状態をシミュレート
        ctx.Services.GetRequiredService<PWAUpdaterService>().OnNextVersionIsWaiting();

        // Then - 期待される表示状態を確認
        if (expectedVisible)
            cut.WaitForState(() => cut.Find(".pwa-updater").ClassList.Contains("visible"));
        else
            cut.FindAll(".pwa-updater").Count.Is(0);
    }
}