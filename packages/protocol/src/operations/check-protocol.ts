import { SemVer } from "../common/shared-types";
import { BaseOperationResponseFailure } from "./base";

/**
 * Used to check an extension's currently handled protocol version
 * and handle mismatches/what not
 */
export const MSG_PROTOCOL_CHECK = "scryhub.library.protocolCheck" as const;


/**
 * Defines the request for the protocol check operation
 */
export type ProtocolCheckRequest = {
    /**
     * Type of this message
     */
    type: typeof MSG_PROTOCOL_CHECK;
}

type ProtocolCheckResponseSuccess = {
    /**
     * The operation succeeded
     */
    ok: true;
    /**
     * The currently handled version by the extension
     */
    protocolVersion: SemVer;
}

/**
 * Expected response to a protocol check
 */
export type ProtocolCheckResponse = 
    BaseOperationResponseFailure | ProtocolCheckResponseSuccess;