import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountdownReturn {
  count: number;
  isRunning: boolean;
  start: () => void;
  cancel: () => void;
}

export function useCountdown(seconds: number): UseCountdownReturn {
  const [count, setCount] = useState(seconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cancel = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setCount(seconds);
  }, [seconds]);

  const start = useCallback(() => {
    setCount(seconds);
    setIsRunning(true);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  return { count, isRunning, start, cancel };
}
