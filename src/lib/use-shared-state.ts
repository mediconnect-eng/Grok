'use client';

import { useEffect, useState } from 'react';
import { emptySharedState, getSharedState, SharedState, subscribeToSharedState } from './shared-state';

export const useSharedState = () => {
  const [state, setState] = useState<SharedState>(() => {
    if (typeof window === 'undefined') {
      return emptySharedState;
    }
    return getSharedState();
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const unsubscribe = subscribeToSharedState((next) => {
      if (typeof structuredClone === 'function') {
        setState(structuredClone(next));
      } else {
        setState(JSON.parse(JSON.stringify(next)));
      }
    });
    return unsubscribe;
  }, []);

  return state;
};
