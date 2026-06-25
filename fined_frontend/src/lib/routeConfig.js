// lib/routeConfig.ts
import { useMessagesStore } from '../store/bankStore';

// 1. Get the State type from the store


// 2. Define what a single route config looks like


// 3. Apply this type to your object using 'Record' or 'satisfies' (if TS 4.9+)
// The 'as const' at the end is crucial!
// Keys must match exactly what is in your Zustand store
export const PRODUCT_ROUTES = {
  'fd': { dataKey: 'fd', fetchKey: 'getSBIfd' },
  'savings': { dataKey: 'savings', fetchKey: 'getSBISavings' },
  'taxsaverfd': { dataKey: 'taxsaverfd', fetchKey: 'getSBITaxSaverfd' },
  'rd': { dataKey: 'rd', fetchKey: 'getSBIrd' },
  'ppf': { dataKey: 'ppf', fetchKey: 'getSBIppf' },
  'nps': { dataKey: 'nps', fetchKey: 'getSBInps' },
  'unnaticard': { dataKey: 'unnaticard', fetchKey: 'getSBIUnnatiCard' },
  'simplysave': { dataKey: 'simplysave', fetchKey: 'getSBISimplySave' },
  'kotaksavings': { dataKey: 'kotaksavings', fetchKey: 'getKotakSavings' },
  'hdfcsavings': { dataKey: 'hdfcsavings', fetchKey: 'getHDFCSavings' },
  'hdfcdigisavings': { dataKey: 'digihdfcsavings', fetchKey: 'getHDFCDigiSavings' },
  'hdfcmaxsavings': { dataKey: 'maxhdfcsavings', fetchKey: 'getHDFCMaxSavings' },
  'hdfcfd': { dataKey: 'hdfcfd', fetchKey: 'getHDFCFD' },
  'icicisavings': { dataKey: 'icicisavings', fetchKey: 'getICICISavings' },
  'icicibasicsavings': { dataKey: 'icicibasicsavings', fetchKey: 'getICICIBasicSavings' },
  'iciciyoungsavings': { dataKey: 'iciciyoungsavings', fetchKey: 'getICICIYoungSavings' },
  'icicifd': { dataKey: 'icicifd', fetchKey: 'getICICIFD' },
  'icicird': { dataKey: 'icicird', fetchKey: 'getICICIrd' },
  'kotakace': { dataKey: 'kotakace', fetchKey: 'getkotakace' },
  'moneyback': { dataKey: 'hdfcmoney', fetchKey: 'getHDFCmoney' },
};