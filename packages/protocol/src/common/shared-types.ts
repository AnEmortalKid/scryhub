
/**
 * Defines a semantic version using SemVer2 format (Major.Minor.Patch)
 */
export type SemVer = `${number}.${number}.${number}`;

export type Money = {
    /**
     * Numerical amount
     */
    amount: number;
    /**
     * Currency for that amount
     */
    currency: string
};