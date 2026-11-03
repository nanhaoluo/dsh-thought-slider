// Test-only catalog services. Slider and stylesheet are unmodified upstream 2.3.3.
const emptyList=[],emptyMap={};
export const EMPTY_CONFIGURED_INPUTS=new Map();
export const inferModalitiesFromName=()=>[];
export const matchKnowledgeBase=()=>undefined;
export const capacityShort=()=>'';
export {selectRefusalMessage} from '../upstream/effort-memory.ts';
export const disabledProviders=()=>emptyList;
export const providerOrder=()=>emptyList;
export const modelOrders=()=>emptyMap;
export const baseProviderOrder=a=>a;
export const mergeProviderOrder=(a)=>a;
export const orderModelEntries=a=>a;
export const subscribeDisabledProviders=()=>()=>{};
export const subscribeProviderOrder=()=>()=>{};
export const subscribeModelOrders=()=>()=>{};
