/**
 * useEventListener Hook
 * 
 * A custom React hook that safely adds and removes event listeners with automatic cleanup.
 * Prevents memory leaks by properly removing listeners on unmount and when dependencies change.
 * 
 * @param eventName - The name of the event to listen for
 * @param handler - The event handler function
 * @param element - The target element (default: window)
 * @param options - AddEventListener options (capture, passive, once)
 */

import { useEffect, useRef, useCallback } from 'react';

type EventHandler<T = Event> = (event: T) => void;

interface UseEventListenerOptions {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
}

export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: EventHandler<WindowEventMap[K]>,
  element?: undefined,
  options?: UseEventListenerOptions
): void;

export function useEventListener<K extends keyof HTMLElementEventMap, T extends HTMLElement = HTMLElement>(
  eventName: K,
  handler: EventHandler<HTMLElementEventMap[K]>,
  element: T | null,
  options?: UseEventListenerOptions
): void;

export function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: EventHandler<DocumentEventMap[K]>,
  element: Document,
  options?: UseEventListenerOptions
): void;

export function useEventListener(
  eventName: string,
  handler: EventHandler,
  element?: HTMLElement | Window | Document | null,
  options?: UseEventListenerOptions
): void {
  // Create a ref that stores handler
  const savedHandler = useRef<EventHandler>(handler);

  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Define the target element (default to window)
    const targetElement = element ?? window;
    
    // Make sure element supports addEventListener
    if (!targetElement || !targetElement.addEventListener) {
      return;
    }

    // Create event listener that calls handler function stored in ref
    const eventListener: EventHandler = (event) => {
      savedHandler.current(event);
    };

    // Add event listener
    targetElement.addEventListener(eventName, eventListener, options);

    // Remove event listener on cleanup
    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options?.capture, options?.passive, options?.once]);
}

/**
 * Hook for window resize events with debouncing
 */
export function useWindowResize(handler: () => void, delay = 250) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedHandler = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(handler, delay);
  };

  useEventListener('resize', debouncedHandler);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}

/**
 * Hook for document visibility change events
 */
export function useDocumentVisibility(handler: (isVisible: boolean) => void) {
  const handleVisibilityChange = () => {
    handler(!document.hidden);
  };

  useEventListener('visibilitychange', handleVisibilityChange, document);
}

/**
 * Hook for keyboard events with key filtering
 * Note: Currently only supports window-level keyboard events due to TypeScript overload limitations
 */
export function useKeyPress(targetKey: string, handler: (event: KeyboardEvent) => void) {
  const handleKeyPress = useCallback((event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === targetKey) {
      handler(keyboardEvent);
    }
  }, [targetKey, handler]);

  // Use window-level event listener to avoid TypeScript overload issues
  useEventListener('keydown', handleKeyPress as EventHandler<KeyboardEvent>);
}