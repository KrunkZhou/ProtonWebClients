const ACCOUNT_APP = 'proton-account';
const EXTENSION_APP = 'proton-pass-extension';

const ACCOUNT_MESSAGE_TYPES = new Set(['auth-ext', 'fork', 'pass-onboarding', 'pass-installed']);

const createToken = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const forwardAccountMessage = (message: any, callback?: (response: any) => void) => {
    const token = createToken();

    const promise = new Promise((resolve, reject) => {
        let listener: (event: MessageEvent<any>) => void;
        const timeout = setTimeout(() => {
            window.removeEventListener('message', listener);
            reject(new Error('Open Pass extension did not respond'));
        }, 10000);

        listener = (event: MessageEvent<any>) => {
            const data = event.data;
            if (!data || data.token !== token || data.from === ACCOUNT_APP) return;

            clearTimeout(timeout);
            window.removeEventListener('message', listener);
            resolve(data);
        };

        window.addEventListener('message', listener);
        window.postMessage({ ...message, app: EXTENSION_APP, from: ACCOUNT_APP, token }, window.location.origin);
    });

    if (typeof callback === 'function') {
        promise.then(callback, (error) =>
            callback({
                type: 'error',
                error: error?.message || 'Open Pass extension did not respond',
                payload: error?.message,
            })
        );

        return undefined;
    }

    return promise;
};

const patchRuntime = (api: any) => {
    const runtime = api?.runtime;

    if (!runtime || typeof runtime.sendMessage !== 'function' || runtime.sendMessage.__openPassBridge) return;

    const original = runtime.sendMessage.bind(runtime);
    const patched = (...args: any[]) => {
        const [extensionId, message, callback] = args;

        if (typeof extensionId === 'string' && ACCOUNT_MESSAGE_TYPES.has(message?.type)) {
            return forwardAccountMessage(message, callback);
        }

        return original(...args);
    };

    Object.defineProperty(patched, '__openPassBridge', { value: true });
    runtime.sendMessage = patched;
};

patchRuntime((window as any).browser);
patchRuntime((window as any).chrome);

const startedAt = Date.now();
const patchInterval = window.setInterval(() => {
    patchRuntime((window as any).browser);
    patchRuntime((window as any).chrome);

    if (Date.now() - startedAt > 10_000) {
        window.clearInterval(patchInterval);
    }
}, 25);
