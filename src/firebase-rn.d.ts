// Firebase's default typings hide the React-Native-only export. It exists at runtime
// (Metro resolves @firebase/auth to its React Native build), so we declare it here.
import type { Persistence } from '@firebase/auth';
declare module '@firebase/auth' {
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
