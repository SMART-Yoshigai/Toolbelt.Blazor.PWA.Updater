import { test, expect, describe } from 'vitest';
import { ServiceWorkerMock } from './fixtures/serviceWorkerMock.ts';
import { createContext } from './fixtures/context.ts';
import './fixtures/customMatcher.ts';

// PWAアップデータースクリプトのテストスイート
// Service Workerのライフサイクル管理とBlazor連携機能の動作を検証
describe('test for PWA Updater script', () => {

    // デフォルトの初回実行テスト
    // Service Workerの初回インストールと次回更新時の動作パターンを検証
    test('default 1st execution', async () => {
        // GIVEN - インストール中のService Workerでテスト環境を初期化
        const { context, window } = await createContext({
            initialState: {
                installing: "installing"
            }
        });
        expect(context.registeredScriptPath).toBe("service-worker.js");

        // 登録状態の確認
        expect(context.registration.installing).toBeState("installing");
        expect(context.registration.waiting).toBeNull();
        expect(context.registration.active).toBeNull();

        // WHEN.1: Service Workerの初回インストールをエミュレート
        await context.registration.dispatchEvent('updatefound');

        context.registration.moveStage({ from: "installing", to: "waiting" });
        await context.registration.waiting?.dispatchStateChange('installed');

        context.registration.moveStage({ from: "waiting", to: "active" });
        await context.registration.active?.dispatchStateChange('activating');
        await context.registration.active?.dispatchStateChange('activated');

        // THEN.1: 初回インストールのためBlazorへの通知は行われない
        expect(context.dotNetObj.invokeHistories).toEqual([]);

        // -- ステップ 2 --

        // WHEN.2: Service Workerの次回インストールをエミュレート
        context.registration.installing = new ServiceWorkerMock("installing");
        await context.registration.dispatchEvent('updatefound');

        context.registration.moveStage({ from: "installing", to: "waiting" });
        await context.registration.waiting?.dispatchStateChange('installed');

        // 登録状態の確認
        expect(context.registration.installing).toBeNull();
        expect(context.registration.waiting).toBeState("installed");
        expect(context.registration.active).toBeState("activated");

        // THEN.2: 次回インストールが完了したためBlazorへの通知が送信される
        expect(context.dotNetObj.invokeHistories).toEqual(["OnNextVersionIsWaiting"]);

        // -- ステップ 3 --

        // WHEN.3: 待機をスキップ
        window.Toolbelt.Blazor.PWA.Updater.skipWaiting();
        const skipMessagePosted = await context.registration.waiting?.waitForSkipWaitingMessage({ timeout: 1000 });
        expect(skipMessagePosted).toBe(true);

        // アクティベート中...
        context.registration.moveStage({ from: "waiting", to: "active" });
        await context.registration.active?.dispatchStateChange('activating');

        // アクティベート完了
        await context.registration.active?.dispatchStateChange('activated');

        // 登録状態の確認
        expect(context.registration.installing).toBeNull();
        expect(context.registration.waiting).toBeNull();
        expect(context.registration.active).toBeState("activated");

        // THEN.3: Service Workerがアクティベートされたためページがリロードされる
        const pageReloaded = await context.waitForPageReload({ timeout: 1000 });
        expect(pageReloaded).toBe(true);
        expect(context.dotNetObj.invokeHistories).toEqual(["OnNextVersionIsWaiting"]);
    })

    // カスタムService Workerパステスト
    // register属性で指定されたカスタムパスでの登録動作を確認
    test('custom service worker path', async () => {
        const { context } = await createContext({
            serviceWorkerScriptPath: "custom-service-worker.js",
            initialState: {
                installing: "installing"
            }
        });
        expect(context.registeredScriptPath).toBe("custom-service-worker.js");
    })

    // 手動登録での初回実行テスト
    // no-register属性指定時の手動登録機能の動作を検証
    test('default 1st execution with manual registration', async () => {
        // GIVEN - 自動登録無効でテスト環境を初期化
        const { context, window, navigator, Toolbelt } = await createContext({
            noRegister: true,
            initialState: {
                installing: "installing"
            }
        });
        expect(context.registeredScriptPath).toBeNull();
        expect(context.dotNetObj.invokeHistories).toEqual([]);

        // WHEN.0: 手動登録
        const registration = await navigator.serviceWorker.register("manual-service-worker.js");
        Toolbelt.Blazor.PWA.Updater.handleRegistration(registration);

        // THEN.0: Service Workerが登録される
        expect(context.registeredScriptPath).toBe("manual-service-worker.js");

        // 登録状態の確認
        expect(context.registration.installing).toBeState("installing");
        expect(context.registration.waiting).toBeNull();
        expect(context.registration.active).toBeNull();

        // WHEN.1: Service Workerの初回インストールをエミュレート
        await context.registration.dispatchEvent('updatefound');

        context.registration.moveStage({ from: "installing", to: "waiting" });
        await context.registration.waiting?.dispatchStateChange('installed');

        context.registration.moveStage({ from: "waiting", to: "active" });
        await context.registration.active?.dispatchStateChange('activating');

        await context.registration.active?.dispatchStateChange('activated');

        // THEN.1: 初回インストールのためBlazorへの通知は行われない
        expect(context.dotNetObj.invokeHistories).toEqual([]);

        // -- ステップ 2 --

        // WHEN.2: Service Workerの次回インストールをエミュレート
        context.registration.installing = new ServiceWorkerMock("installing");
        await context.registration.dispatchEvent('updatefound');

        context.registration.moveStage({ from: "installing", to: "waiting" });
        await context.registration.waiting?.dispatchStateChange('installed');

        // 登録状態の確認
        expect(context.registration.installing).toBeNull();
        expect(context.registration.waiting).toBeState("installed");
        expect(context.registration.active).toBeState("activated");

        // THEN.2: 次回インストールが完了したためBlazorへの通知が送信される
        expect(context.dotNetObj.invokeHistories).toEqual(["OnNextVersionIsWaiting"]);

        // -- ステップ 3 --

        // WHEN.3: 待機をスキップ
        window.Toolbelt.Blazor.PWA.Updater.skipWaiting();
        const skipMessagePosted = await context.registration.waiting?.waitForSkipWaitingMessage({ timeout: 1000 });
        expect(skipMessagePosted).toBe(true);

        // アクティベート中...
        context.registration.moveStage({ from: "waiting", to: "active" });
        await context.registration.active?.dispatchStateChange('activating');

        // アクティベート完了
        await context.registration.active?.dispatchStateChange('activated');

        // 登録状態の確認
        expect(context.registration.installing).toBeNull();
        expect(context.registration.waiting).toBeNull();
        expect(context.registration.active).toBeState("activated");

        // THEN.3: Service Workerがアクティベートされたためページがリロードされる
        const pageReloaded = await context.waitForPageReload({ timeout: 1000 });
        expect(pageReloaded).toBe(true);
        expect(context.dotNetObj.invokeHistories).toEqual(["OnNextVersionIsWaiting"]);
    })

    // Service Workerアクティベート後のページリロードテスト
    // 既にアクティベート済みの状態からの動作を検証
    test('reload the page after the service worker is activated', async () => {
        // GIVEN - 既にアクティベート済みのService Workerでテスト環境を初期化
        const { context, window } = await createContext({
            initialState: {
                active: "activated"
            }
        });
        expect(context.registeredScriptPath).toBe("service-worker.js");

        // 登録状態の確認
        expect(context.registration.installing).toBeNull();
        expect(context.registration.waiting).toBeNull();
        expect(context.registration.active).toBeState("activated");

        // WHEN.1: しばらく待機
        await new Promise(resolve => setTimeout(resolve, 500));

        // THEN.1: Service Workerが既にアクティベート済みのため何も起こらない
        expect(context.dotNetObj.invokeHistories).toEqual([]);

        // -- ステップ 2 --

        // WHEN.2: Service Workerの次回インストールをエミュレート
        context.registration.installing = new ServiceWorkerMock("installing");
        await context.registration.dispatchEvent('updatefound');

        context.registration.moveStage({ from: "installing", to: "waiting" });
        await context.registration.waiting?.dispatchStateChange('installed');

        // 登録状態の確認
        expect(context.registration.installing).toBeNull();
        expect(context.registration.waiting).toBeState("installed");
        expect(context.registration.active).toBeState("activated");

        // THEN.2: 次回インストールが完了したためBlazorへの通知が送信される
        expect(context.dotNetObj.invokeHistories).toEqual(["OnNextVersionIsWaiting"]);

        // -- ステップ 3 --

        // WHEN.3: 待機をスキップ
        window.Toolbelt.Blazor.PWA.Updater.skipWaiting();
        const skipMessagePosted = await context.registration.waiting?.waitForSkipWaitingMessage({ timeout: 1000 });
        expect(skipMessagePosted).toBe(true);

        // アクティベート中...
        context.registration.moveStage({ from: "waiting", to: "active" });
        await context.registration.active?.dispatchStateChange('activating');

        // アクティベート完了
        await context.registration.active?.dispatchStateChange('activated');

        // 登録状態の確認
        expect(context.registration.installing).toBeNull();
        expect(context.registration.waiting).toBeNull();
        expect(context.registration.active).toBeState("activated");

        // THEN.3: Service Workerがアクティベートされたためページがリロードされる
        const pageReloaded = await context.waitForPageReload({ timeout: 1000 });
        expect(pageReloaded).toBe(true);
        expect(context.dotNetObj.invokeHistories).toEqual(["OnNextVersionIsWaiting"]);
    })

    // 新Service Workerアクティベート待ちからのページリロードテスト
    // 待機中のService Workerが既に存在する状態からの動作を検証
    test('reload the page when the next service worker is waiting for activated', async () => {
        // GIVEN - 新Service Workerが待機中の状態でテスト環境を初期化
        const { context, window } = await createContext({
            initialState: {
                waiting: "installed",
                active: "activated"
            }
        });

        // 登録状態の確認
        expect(context.registration.installing).toBeNull();
        expect(context.registration.waiting).toBeState("installed");
        expect(context.registration.active).toBeState("activated");

        // WHEN.1: しばらく待機
        await new Promise(resolve => setTimeout(resolve, 500));

        // THEN.1: 新Service Workerが検出されBlazorへの通知が送信される
        expect(context.dotNetObj.invokeHistories).toEqual(["OnNextVersionIsWaiting"]);

        // -- ステップ 2 --

        // WHEN.2: 待機をスキップ
        window.Toolbelt.Blazor.PWA.Updater.skipWaiting();
        if (context.registration.waiting == null) throw new Error("waiting is null");
        const skipMessagePosted = await context.registration.waiting.waitForSkipWaitingMessage({ timeout: 1000 });
        expect(skipMessagePosted).toBe(true);

        // アクティベート中...
        context.registration.moveStage({ from: "waiting", to: "active" });
        await context.registration.active?.dispatchStateChange('activating');

        // アクティベート完了
        await context.registration.active?.dispatchStateChange('activated');

        // 登録状態の確認
        expect(context.registration.installing).toBeNull();
        expect(context.registration.waiting).toBeNull();
        expect(context.registration.active).toBeState("activated");

        // THEN.2: Service Workerがアクティベートされたためページがリロードされる
        const pageReloaded = await context.waitForPageReload({ timeout: 1000 });
        expect(pageReloaded).toBe(true);
        expect(context.dotNetObj.invokeHistories).toEqual(["OnNextVersionIsWaiting"]);
    })
});
