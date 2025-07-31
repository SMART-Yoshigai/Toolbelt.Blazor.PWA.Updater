// Blazor .NET オブジェクトリファレンスのインターフェース
// BlazorのJavaScriptインターオペレーションで.NETメソッドを呼び出すために使用
interface IDotNetObjectRef {
    invokeMethodAsync(methodName: string, ...args: any[]): Promise<any>;
}

// PWAアップデーターのメインスクリプト
// Service Workerの登録と更新管理を行い、Blazorコンポーネントと連携してPWAの更新通知を提供する
((Toolbelt) => {
    ((Blazor) => {
        ((PWA) => {
            ((Updater) => {

                const NULL = null;

                // <script> タグのパラメータ取得
                // Service Worker登録パスや自動登録の無効化フラグを取得
                const getAttribute = (name: string) => document.currentScript?.getAttribute(name);
                const serviceWorkerScriptPath = getAttribute("register") || "service-worker.js";
                const noRegister = getAttribute("no-register");

                // PWAアップデーターの状態管理
                // 初回インストール判定、待機中Service Worker、.NETオブジェクト準備完了の管理
                let initialInstallation = false;
                let waiting: ServiceWorker | null = NULL;
                const waitForDotNetObjReady = Promise.withResolvers<IDotNetObjectRef>();

                // 新バージョン待機中の通知をBlazorに送信
                // Service Workerが新バージョンをインストール完了した際にBlazorコンポーネントに通知
                const notifyNextVersionIsWaitingToBlazor = async (waitingWorker: ServiceWorker | null) => {
                    if (waitingWorker === NULL) return;
                    waiting = waitingWorker;
                    const dotNetObjRef = await waitForDotNetObjReady.promise;
                    await dotNetObjRef.invokeMethodAsync("OnNextVersionIsWaiting");
                }

                // Service Workerの状態変化を監視
                // インストール完了時とアクティベート時の処理を管理
                const monitor = (worker: ServiceWorker | null) => {
                    if (worker === NULL) return;
                    worker.addEventListener('statechange', () => {
                        if (worker.state === 'installed') {
                            // 初回インストール以外の場合、新バージョン待機を通知
                            if (!initialInstallation) notifyNextVersionIsWaitingToBlazor(worker);
                        }
                        if (worker.state === 'activated') {
                            if (!initialInstallation) {
                                // 新バージョンがアクティベートされたらページをリロード
                                setTimeout(() => window.location.reload(), 10);
                            }
                            initialInstallation = false;
                        }
                    });
                }

                // Service Worker登録の処理
                // 初回インストール判定と既存/新規Service Workerの監視を開始
                const handleRegistration = (registration: ServiceWorkerRegistration) => {
                    initialInstallation = registration.active === NULL;
                    const waiting = registration.waiting;
                    notifyNextVersionIsWaitingToBlazor(waiting);
                    monitor(waiting);
                    registration.addEventListener('updatefound', () => monitor(registration.installing));
                }
                Updater.handleRegistration = handleRegistration;

                // .NETオブジェクトリファレンスの準備完了を設定
                // BlazorコンポーネントからJavaScriptへの通信チャネルを確立
                Updater.setToBeReady = (dotNetObj: IDotNetObjectRef) => {
                    waitForDotNetObjReady.resolve(dotNetObj);
                }

                // Service Workerの待機状態をスキップ
                // ユーザーが「今すぐ更新」ボタンをクリックした際に呼び出される
                Updater.skipWaiting = () => waiting?.postMessage({ type: 'SKIP_WAITING' });

                // 自動登録が無効でない場合、Service Workerを登録
                if (!noRegister) {
                    navigator.serviceWorker.register(serviceWorkerScriptPath).then(handleRegistration);
                }

            })(PWA.Updater ??= {});
        })(Blazor.PWA ??= {});
    })(Toolbelt.Blazor ??= {})
})((window as any).Toolbelt ??= {});
