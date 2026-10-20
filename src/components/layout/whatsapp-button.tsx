import { whatsappLink } from "@/lib/utils";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="currentColor">
      <path d="M16.04 3C9.4 3 4 8.36 4 14.96c0 2.4.7 4.62 1.9 6.5L4 29l7.75-2.02a12.1 12.1 0 0 0 4.29.79C22.68 27.77 28 22.4 28 15.8S22.68 3 16.04 3Zm0 22.67c-1.4 0-2.78-.37-3.98-1.07l-.29-.17-4.6 1.2 1.23-4.48-.19-.3a9.62 9.62 0 0 1-1.5-5.15c0-5.35 4.4-9.7 9.8-9.7 5.4 0 9.8 4.35 9.8 9.7s-4.4 9.97-9.8 9.97h-.47Zm5.37-7.3c-.3-.15-1.74-.86-2.01-.95-.27-.1-.47-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.64.07-.3-.14-1.24-.45-2.37-1.45a8.9 8.9 0 0 1-1.64-2.03c-.17-.3 0-.45.13-.6l.44-.51c.15-.17.2-.3.3-.5.1-.19.05-.36-.03-.5-.07-.15-.66-1.58-.9-2.16-.24-.57-.48-.5-.66-.5h-.56c-.2 0-.51.07-.78.36-.27.3-1.03 1-1.03 2.45s1.05 2.84 1.2 3.04c.15.2 2.07 3.14 5.02 4.4.7.3 1.25.48 1.68.62.7.22 1.35.19 1.85.12.57-.09 1.74-.7 1.99-1.4.24-.68.24-1.26.17-1.39-.08-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

export function WhatsAppButton({ number }: { number: string }) {
  return (
    <a
      href={whatsappLink(number)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-whatsapp/40 md:bottom-6 md:right-6"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
