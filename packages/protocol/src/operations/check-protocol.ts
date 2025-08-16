import { SemVer } from "../common/shared-types";

/**
 * Used to check an extension's currently handled protocol version
 * and handle mismatches/what not
 */
export const MSG_PROTOCOL_CHECK = "scryhub.protocolCheck" as const;


/**
 * Defines the request for the protocol check operation
 */
export type ProtocolCheckReq = {
    /**
     * Type of this message
     */
    type: typeof MSG_PROTOCOL_CHECK;
}

/**
 * Expected response to a protocol check
 */
export type ProtocolCheckResp = {
    /**
     * Whether the message succeeds or not
     */
    ok: boolean;

    /**
     * The currently handled version by the extension, undefined when message does not succeed
     */
    protocolVersion?: SemVer;
}