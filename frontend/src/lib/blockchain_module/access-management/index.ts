// Access management module main export

export { grantAccess, revokeAccess, changeAccessLevel, getAccessLevelName } from './grant';
export type { GrantAccessParams } from './grant';

export { checkUserAccess, getUserAccessCaps, checkAccessForNFT } from './check';

export { createAccessCap, transferAccessCap, burnAccessCap } from './access-cap';
export type { CreateAccessCapParams } from './access-cap';

// Re-export access types
export type { AccessLevel, AccessCapData } from '../types';
export { ACCESS_LEVELS } from '../utils/constants';