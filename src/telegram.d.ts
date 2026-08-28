export { };

declare global {
   interface Window {
      Telegram?: {
         WebApp: {
            ready: () => void;
            expand: () => void;
            openTelegramLink: (url: string) => void;
            initDataUnsafe?: {
               start_param?: string;
            };
         };
      };
   }
}