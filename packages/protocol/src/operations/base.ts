
/**
 * An extension received our message but failed to act on it, 
 * possibly it received an internal error or could not match our message payload
 */
export type BaseOperationResponseFailure = {
    /**
     * The extension received the message but performing the request failed
     */
    ok: false;

    /**
     * Additional diagnostic information for the failure
     */
    error?: string;
}
