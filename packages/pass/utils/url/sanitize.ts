import type { SanitizedUrl } from './types';
import { MAX_HOSTNAME_LENGTH, RegexURL, isValidURLScheme, isValidWildcardHostname } from './utils';

const WILDCARD_PORT = '*';
const WILDCARD_PORT_PLACEHOLDER = '65535';
const SCHEME_WITH_AUTHORITY_REGEX = /^[a-z][a-z\d+.-]*:\/\//i;
const HOST_WITH_PORT_REGEX = /^[^/?#:\s]+\.[^/?#:\s]+:\d+(?=\/|[?#]|$)/i;
const replaceWildcardPort = (url: string) => url.replace(/:\*(?=\/|[?#]|$)/, `:${WILDCARD_PORT_PLACEHOLDER}`);

/* Will first try to validate against the URL constructor.
 * If it fails, try to append https:// scheme and revalidate
 * Final step is to test against a URL regex (https://urlregex.com/) */
export const sanitizeURL = (maybeUrl: string, scheme?: string): SanitizedUrl => {
    try {
        if (!maybeUrl) return { valid: false, protocol: null, port: null, hostname: null, url: maybeUrl };

        const url = (scheme ? `${scheme}//${maybeUrl}` : maybeUrl).trim();
        /* invalidate if contains white-space after sanitization */
        if (/\s/.test(url)) return { valid: false, protocol: null, port: null, hostname: null, url };
        if (scheme === undefined && url.includes(':*') && !SCHEME_WITH_AUTHORITY_REGEX.test(url)) {
            return sanitizeURL(maybeUrl, 'https:');
        }
        if (scheme === undefined && HOST_WITH_PORT_REGEX.test(url) && !SCHEME_WITH_AUTHORITY_REGEX.test(url)) {
            return sanitizeURL(maybeUrl, 'https:');
        }

        const normalizedUrl = replaceWildcardPort(url);
        const hasWildcardPort = normalizedUrl !== url;

        /* will throw a TypeError on invalid URL */
        const urlObj = new URL(normalizedUrl);

        /* if scheme is unsupported for our use-case */
        if (!isValidURLScheme(urlObj)) return { valid: false, hostname: null, protocol: null, port: null, url };

        const { protocol, hostname, href, port } = urlObj;
        const safeUrl = hasWildcardPort ? href.replace(`:${WILDCARD_PORT_PLACEHOLDER}`, ':*') : href;
        const valid =
            hostname.length <= MAX_HOSTNAME_LENGTH &&
            (hostname.includes('*') ? isValidWildcardHostname(hostname) : Boolean(RegexURL.test(urlObj.href)));

        return { valid, hostname, protocol, port: hasWildcardPort ? WILDCARD_PORT : port || null, url: safeUrl };
    } catch (_) {
        const startsWithHttpProtocol = /^https?:\/\//.test(maybeUrl);
        return scheme === undefined && !startsWithHttpProtocol
            ? sanitizeURL(maybeUrl, 'https:')
            : { valid: false, hostname: null, protocol: null, port: null, url: maybeUrl };
    }
};
