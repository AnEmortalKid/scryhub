
interface Logger {
    /**
     * The **`console.log()`** static method outputs a message to the console.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/log_static)
     */
    log: (any),

    /**
     * The **`console.info()`** static method outputs a message to the console at the 'info' log level.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/info_static)
     */
    info: (any),
    
    /**
     * The **`console.warn()`** static method outputs a warning message to the console at the 'warning' log level.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/warn_static)
     */
    warn: (any),

    /**
     * The **`console.error()`** static method outputs a message to the console at the 'error' log level.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/error_static)
     */
    error: (any),

    /**
    * Wraps the **`console.debug()`** static method outputs a message to the console at the 'debug' log level with a prefix
    *
    * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/debug_static)
    */
    debug: (any),
    
    /**
     * The **`console.trace()`** static method outputs a stack trace to the console.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/trace_static)
     */
    trace: (any)
}

/**
 * Creates a logger with a fixed prefix.
 * Usage:
 *   const coreLogger = createLogger("[ScryHub Core]");
 *   coreLogger.log("removing library", libId);
 *   coreLogger.error("failed", err);
 */
export function createLogger(prefix: string): Logger {
    const wrap =
        (method: keyof Console) =>
            (...args: any[]) => {
                // @ts-expect-error because console has many overloads
                console[method](prefix, ...args);
            };

    return {
        log: wrap("log"),
        info: wrap("info"),
        warn: wrap("warn"),
        error: wrap("error"),
        debug: wrap("debug"),
        trace: wrap("trace"),
    };
}