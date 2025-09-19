var _a;
var _b;
// PWAアップデーターのメインスクリプト
// Service Workerの登録と更新管理を行い、Blazorコンポーネントと連携してPWAの更新通知を提供する
((Toolbelt) => {
    var _a;
    ((Blazor) => {
        var _a;
        ((PWA) => {
            var _a;
            ((Updater) => {
                const NULL = null;
                // <script> タグのパラメータ取得
                // Service Worker登録パスや自動登録の無効化フラグを取得
                const getAttribute = (name) => { var _a; return (_a = document.currentScript) === null || _a === void 0 ? void 0 : _a.getAttribute(name); };
                const serviceWorkerScriptPath = getAttribute("register") || "service-worker.js";
                const noRegister = getAttribute("no-register");
                // PWAアップデーターの状態管理
                // 初回インストール判定、待機中Service Worker、.NETオブジェクト準備完了の管理
                let initialInstallation = false;
                let waiting = NULL;
                let currentRegistration = NULL;
                const waitForDotNetObjReady = Promise.withResolvers();
                // 新バージョン待機中の通知をBlazorに送信
                // Service Workerが新バージョンをインストール完了した際にBlazorコンポーネントに通知
                const notifyNextVersionIsWaitingToBlazor = async (waitingWorker) => {
                    if (waitingWorker === NULL)
                        return;
                    waiting = waitingWorker;
                    const dotNetObjRef = await waitForDotNetObjReady.promise;
                    await dotNetObjRef.invokeMethodAsync("OnNextVersionIsWaiting");
                };
                // Service Workerの状態変化を監視
                // インストール完了時とアクティベート時の処理を管理
                const monitor = (worker) => {
                    if (worker === NULL)
                        return;
                    worker.addEventListener('statechange', () => {
                        if (worker.state === 'installed') {
                            // 初回インストール以外の場合、新バージョン待機を通知
                            if (!initialInstallation)
                                notifyNextVersionIsWaitingToBlazor(worker);
                        }
                        if (worker.state === 'activated') {
                            if (!initialInstallation) {
                                // 新バージョンがアクティベートされたらページをリロード
                                setTimeout(() => window.location.reload(), 10);
                            }
                            initialInstallation = false;
                        }
                    });
                };
                // Service Worker登録の処理
                // 初回インストール判定と既存/新規Service Workerの監視を開始
                const handleRegistration = (registration) => {
                    currentRegistration = registration;
                    initialInstallation = registration.active === NULL;
                    const waiting = registration.waiting;
                    notifyNextVersionIsWaitingToBlazor(waiting);
                    monitor(waiting);
                    registration.addEventListener('updatefound', () => monitor(registration.installing));
                };
                Updater.handleRegistration = handleRegistration;
                // .NETオブジェクトリファレンスの準備完了を設定
                // BlazorコンポーネントからJavaScriptへの通信チャネルを確立
                Updater.setToBeReady = (dotNetObj) => {
                    waitForDotNetObjReady.resolve(dotNetObj);
                };
                // Service Workerの待機状態をスキップ
                // ユーザーが「今すぐ更新」ボタンをクリックした際に呼び出される
                Updater.skipWaiting = () => waiting === null || waiting === void 0 ? void 0 : waiting.postMessage({ type: 'SKIP_WAITING' });
                // ユーザー主導でService Workerの更新チェックを実行
                // 手動更新チェック機能 - ユーザーが明示的に更新を確認したい場合に使用
                Updater.checkForUpdate = async () => {
                    if (currentRegistration) {
                        try {
                            await currentRegistration.update();
                        }
                        catch (error) {
                            console.error('Service Worker update check failed:', error);
                        }
                    }
                };
                // 自動登録が無効でない場合、Service Workerを登録
                if (!noRegister) {
                    navigator.serviceWorker.register(serviceWorkerScriptPath).then(handleRegistration);
                }
            })((_a = PWA.Updater) !== null && _a !== void 0 ? _a : (PWA.Updater = {}));
        })((_a = Blazor.PWA) !== null && _a !== void 0 ? _a : (Blazor.PWA = {}));
    })((_a = Toolbelt.Blazor) !== null && _a !== void 0 ? _a : (Toolbelt.Blazor = {}));
})((_a = (_b = window).Toolbelt) !== null && _a !== void 0 ? _a : (_b.Toolbelt = {}));
