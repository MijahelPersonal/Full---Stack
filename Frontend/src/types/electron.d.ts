interface Window {
  gestionDesktop?: {
    getConfig(): Promise<{ apiUrl: string }>;
  };
}
