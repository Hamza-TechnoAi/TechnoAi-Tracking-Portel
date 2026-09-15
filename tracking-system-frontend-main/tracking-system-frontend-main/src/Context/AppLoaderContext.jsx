import { createContext, useContext } from 'react';
import { APP_LOADER_DURATION_MS } from '../Constants/appLoader';

export const AppLoaderContext = createContext({
  isPageLoading: false,
  loaderDurationMs: APP_LOADER_DURATION_MS,
});

export function useAppLoader() {
  return useContext(AppLoaderContext);
}
