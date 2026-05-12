import { contentScriptMessage, sendMessage, successMessage } from 'proton-pass-extension/lib/message/send-message';
import type { MessageFailure, WorkerMessageWithSender, WorkerResponse } from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { logger } from '@proton/pass/utils/logger';

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
        logger.warn('[ChromeContentScript::AccountBridge]', e);
    }
});
