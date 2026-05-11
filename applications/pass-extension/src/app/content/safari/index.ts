import config from 'proton-pass-extension/app/config';
import { contentScriptMessage, sendMessage, successMessage } from 'proton-pass-extension/lib/message/send-message';
import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import type { MessageFailure, WorkerMessageWithSender, WorkerResponse } from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { ApiCallFn } from '@proton/pass/types/api/api';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { logger } from '@proton/pass/utils/logger';
import { configureApi } from '@proton/shared/lib/api';
import { pullForkSession } from '@proton/shared/lib/api/auth';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { protonFetch } from '@proton/shared/lib/fetch/fetch';

const api = configureApi({ ...config, clientID: getClientID(config.APP_NAME), protonFetch } as any) as ApiCallFn;

type AccountBridgeResponse = WorkerResponse<WorkerMessageWithSender> | MessageFailure;

type AccountBridgeMessage = {
    app?: string;
    from?: string;
    payload?: unknown;
    token?: string;
    type?: WorkerMessageType;
};

const postAccountBridgeResponse = (token: unknown, response: AccountBridgeResponse) => {
    window.postMessage({ token, ...response }, window.location.origin);
};

const accountForkRequests = new Map<string, Promise<AccountBridgeResponse>>();

const forwardAccountMessage = async (message: WorkerMessageWithSender, token: unknown) => {
    const response = await sendMessage(message);
    postAccountBridgeResponse(token, response);
};

const forwardAccountForkMessage = async (message: WorkerMessageWithSender, token: unknown, selector: string) => {
    const request =
        accountForkRequests.get(selector) ??
        sendMessage(message).finally(() => {
            accountForkRequests.delete(selector);
        });

    accountForkRequests.set(selector, request);
    postAccountBridgeResponse(token, await request);
};

const isAccountBridgeMessage = (message: MessageEvent<unknown>): message is MessageEvent<AccountBridgeMessage> => {
    const data = message.data as AccountBridgeMessage;
    const isPassApp = data?.app === 'proton-pass-extension' || data?.app === 'proton-extension';

    return (
        data?.from === 'proton-account' && isPassApp && typeof data.token === 'string' && typeof data.type === 'string'
    );
};

window.addEventListener('message', async (message) => {
    try {
        if (!isAccountBridgeMessage(message)) return;

        switch (message.data.type) {
            case WorkerMessageType.ACCOUNT_FORK:
                const selector = (message.data.payload as any)?.selector;
                const forkMessage = contentScriptMessage({
                    type: WorkerMessageType.ACCOUNT_FORK,
                    payload: message.data.payload as any,
                });

                return typeof selector === 'string'
                    ? await forwardAccountForkMessage(forkMessage, message.data.token, selector)
                    : await forwardAccountMessage(forkMessage, message.data.token);

            case WorkerMessageType.ACCOUNT_EXTENSION:
                return await forwardAccountMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.ACCOUNT_EXTENSION,
                    }),
                    message.data.token
                );

            case WorkerMessageType.ACCOUNT_ONBOARDING:
                return await forwardAccountMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.ACCOUNT_ONBOARDING,
                    }),
                    message.data.token
                );

            case WorkerMessageType.ACCOUNT_PROBE:
                return postAccountBridgeResponse(message.data.token, successMessage({}));
        }
    } catch (e) {
        logger.warn('[SafariContentScript::AccountBridge]', e);
    }
});

const handler: Runtime.OnMessageListenerCallback = (message: unknown, _, sendResponse: (res: any) => void) => {
    if (matchExtensionMessage(message, { sender: 'background', type: WorkerMessageType.AUTH_PULL_FORK })) {
        const pullForkParams = pullForkSession(message.payload.selector);
        pullForkParams.url = `${config.SSO_URL}/api/${pullForkParams.url}`;

        api(pullForkParams)
            .then(async (res) => sendResponse({ ok: true, ...(await res.json()) }))
            .catch((err) => sendResponse({ ok: false, error: getErrorMessage(err) }));

        return true;
    }

    /** Note: The type assertion is necessary because the OnMessageListener type
     * has constraints that don't properly handle conditional use of `sendResponse`.  */
    return undefined as any;
};

/** In Safari, there's a known problem with cross-domain cookies in service workers.
 * As a work-around, we execute the `pullFork` request in the content script instead
 * of the service worker to ensure that cookies are properly attached. */
browser.runtime.onMessage.addListener(handler);
