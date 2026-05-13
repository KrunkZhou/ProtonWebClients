import { withContext } from 'proton-pass-extension/app/worker/context/inject';

import { BROWSER_SESSION_LOCK_TTL } from '@proton/pass/constants';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { RequiredProps } from '@proton/pass/types/utils';
import type { ExtensionForkPayload } from '@proton/shared/lib/authentication/fork/extension';

export const shouldForceLock = withContext<() => Promise<boolean>>(async (ctx) => {
    try {
        const forceLock = (await ctx.service.storage.local.getItem('forceLock')) ?? false;
        if (forceLock) return true;

        const [persistedSession, memoryUID] = await Promise.all([
            ctx.service.storage.local.getItem<string>('ps'),
            ctx.service.storage.session.getItem<string>('UID').catch(() => undefined),
        ]);

        if (memoryUID || !persistedSession) return false;

        const session = JSON.parse(persistedSession);
        return session.lockTTL === BROWSER_SESSION_LOCK_TTL && session.lockMode !== LockMode.NONE;
    } catch {
        return false;
    }
});

export const validateExtensionForkPayload = (
    payload: ExtensionForkPayload
): payload is RequiredProps<ExtensionForkPayload, 'keyPassword'> => Boolean(payload.keyPassword);
