export const cache = new Map();
const inFlight = new Map<string, Promise<unknown>>();

export const cacheFetch = async <T>(
    key: string,
    fetchCallback: () => ReturnType<typeof fetch>
): Promise<T> => {
    // Return cached result if available
    if (cache.has(key)) {
        return cache.get(key) as T;
    }

    // Reuse any in-flight request for the same key
    if (inFlight.has(key)) {
        return inFlight.get(key) as Promise<T>;
    }
    
    const requestPromise = (async (): Promise<T> => {
        const response = await fetchCallback();

        if (!response.ok) {
            throw new Error(
                `Fetch failed for key "${key}": ${response.status} ${response.statusText} (${response.url})`
            );
        }

        const payload = await response.text();
        let result: T;
        try {
            result = JSON.parse(payload) as T;
        } catch {
            const preview = payload.slice(0, 120).replace(/\s+/g, ' ');
            throw new Error(
                `Invalid JSON for key "${key}" from ${response.url}. Response starts with: ${preview}`
            );
        }

        cache.set(key, result);
        return result;
    })();

    inFlight.set(key, requestPromise);

    try {
        return await requestPromise;
    } finally {
        inFlight.delete(key);
    }
};