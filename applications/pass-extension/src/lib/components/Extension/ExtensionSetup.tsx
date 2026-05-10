import type { FC, ReactNode } from 'react';
import { createContext, useEffect, useRef, useState } from 'react';

import { type ExtensionContextType, setupExtensionContext } from 'proton-pass-extension/lib/context/extension-context';
import { WithExtensionLocale } from 'proton-pass-extension/lib/hooks/useExtensionLocale';
import { resolveMessageFactory, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { reloadManager } from 'proton-pass-extension/lib/utils/reload';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import { registerLoggerEffect } from '@proton/pass/utils/logger';

import { ExtensionError } from './ExtensionError';

type Props = { children: ReactNode; recycle?: boolean };
const CONTEXT_SETUP_TIMEOUT = 5_000;

export const ExtensionReactContext = createContext<MaybeNull<ExtensionContextType>>(null);
export const useExtensionContext = createUseContext(ExtensionReactContext);

/** Sets up the `ExtensionContext` for an extension react app. Prefer accessing the
 * underlying context using `useExtensionContext` rather than reading it
 * from the global `ExtensionContext.get()` */
export const ExtensionSetup: FC<Props> = ({ children }) => {
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);
    const ctx = useRef<MaybeNull<ExtensionContextType>>(null);
    const { endpoint } = usePassCore();

    useEffect(() => {
        let mounted = true;

        registerLoggerEffect((...logs) =>
            sendMessage(
                resolveMessageFactory(endpoint)({
                    type: WorkerMessageType.LOG_EVENT,
                    payload: { log: logs.join(' ') },
                })
            )
        );

        const setup = async () => {
            const timeout = new Promise<never>((_, reject) => {
                window.setTimeout(
                    () => reject(new Error(`Extension context setup timed out for ${endpoint}`)),
                    CONTEXT_SETUP_TIMEOUT
                );
            });

            ctx.current = await Promise.race([
                setupExtensionContext({
                    endpoint,
                    /** Reload the app on port disconnection. SW re-registration
                     * timeout is handled by the `reloadManager.appReload` timeout. */
                    onDisconnect: reloadManager.appReload,
                }),
                timeout,
            ]);

            if (mounted) setReady(true);
        };

        void setup().catch(() => {
            if (mounted) setFailed(true);
        });

        return () => {
            mounted = false;
        };
    }, []);

    if (failed) return <ExtensionError />;

    return (
        <ExtensionReactContext.Provider value={ctx.current}>
            {ready && <WithExtensionLocale>{children}</WithExtensionLocale>}
        </ExtensionReactContext.Provider>
    );
};
