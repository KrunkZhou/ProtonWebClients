import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { BROWSER_SESSION_LOCK_TTL } from '@proton/pass/constants';

type Props = {
    ttl?: number;
    disabled?: boolean;
    onChange: (ttl: number) => void;
    label?: ReactNode;
    includeBrowserSession?: boolean;
};

export const TTL_LABELS: Partial<Record<number, () => string>> = {
    [BROWSER_SESSION_LOCK_TTL]: () => c('Label').t`Until browser closes`,
    30: () => c('Label').t`30 seconds`,
    60: () => c('Label').t`1 minute`,
    120: () => c('Label').t`2 minutes`,
    300: () => c('Label').t`5 minutes`,
    600: () => c('Label').t`10 minutes`,
    900: () => c('Label').t`15 minutes`,
    1_800: () => c('Label').t`30 minutes`,
    3_600: () => c('Label').t`1 hour`,
    10_800: () => c('Label').t`3 hours`,
    28_800: () => c('Label').t`8 hours`,
    86_400: () => c('Label').t`1 day`,
};

export const TTL_OPTIONS: number[] = [60, 120, 300, 600, 3_600, 10_800, 28_800, 86_400, BROWSER_SESSION_LOCK_TTL];

export const LockTTLField: FC<Props> = ({ ttl, disabled, onChange, label, includeBrowserSession = true }) => (
    <InputFieldTwo
        as={SelectTwo<number>}
        label={label}
        disabled={disabled}
        placeholder={TTL_LABELS[ttl ?? 600]?.()}
        onValue={onChange}
        value={ttl}
        dense
    >
        {TTL_OPTIONS.filter((value) => includeBrowserSession || value !== BROWSER_SESSION_LOCK_TTL).map((value) => (
            <Option key={value} title={TTL_LABELS[value]?.() ?? ''} value={value} />
        ))}
    </InputFieldTwo>
);
