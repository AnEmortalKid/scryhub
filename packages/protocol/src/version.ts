// Enable resolveJsonModule in this package's tsconfig, and rollup plugin-json.
import pkg from '../package.json';
import { SemVer } from './common';

export const PROTOCOL_VERSION = pkg.version as SemVer;