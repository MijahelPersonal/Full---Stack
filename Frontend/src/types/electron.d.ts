interface Window {
  gestionDesktop?: {
    getConfig(): Promise<{ apiUrl: string }>;
    updates?: {
      getState(): Promise<DesktopUpdateState>;
      check(): Promise<DesktopUpdateState>;
      download(): Promise<DesktopUpdateState>;
      install(): Promise<DesktopUpdateState>;
      onState(callback: (state: DesktopUpdateState) => void): () => void;
    };
  };
}
interface DesktopUpdateState {
  status: 'idle' | 'disabled' | 'checking' | 'current' | 'available' | 'downloading' | 'ready' | 'error';
  version: string;
  nextVersion?: string;
  percent?: number;
}
