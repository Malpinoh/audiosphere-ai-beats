
/// <reference types="vite/client" />

// Add missing Share interface from Capacitor
declare module "@capacitor/share" {
  export interface ShareOptions {
    title?: string;
    text?: string;
    url?: string;
    dialogTitle?: string;
  }

  export interface SharePlugin {
    share(options: ShareOptions): Promise<void>;
  }

  export const Share: SharePlugin;
}
