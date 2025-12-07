import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface KeyboardShortcutsOptions {
  onSearch?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // "/" - Focus search input
      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        if (options.onSearch) {
          options.onSearch();
        } else {
          // Find first search input on page and focus it
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="search"], input[type="text"][placeholder*="Search" i], input[type="text"][placeholder*="search" i]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
      }

      // "ESC" - Go back or close modals
      if (event.key === 'Escape') {
        if (options.onEscape) {
          options.onEscape();
        } else {
          // Check if there's an open modal/dialog
          const modal = document.querySelector('[role="dialog"]');
          if (modal) {
            // Try to find and click close button
            const closeButton = modal.querySelector<HTMLButtonElement>(
              'button[aria-label="Close"], button[aria-label="close"]'
            );
            if (closeButton) {
              closeButton.click();
            }
          } else {
            // No modal, go back to overview
            setLocation('/overview');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, setLocation]);
}
