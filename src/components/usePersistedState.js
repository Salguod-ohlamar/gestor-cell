import { useState, useEffect } from 'react';

/**
 * A custom hook to persist state in localStorage.
 * @param {string} key The key to use in localStorage.
 * @param {*} initialState The initial state value.
 * @returns A stateful value, and a function to update it.
 */
export const usePersistedState = (key, initialState) => {
  const [state, setState] = useState(() => {
    try {
      const storedValue = localStorage.getItem(key);
      // If a value is stored, parse it. Otherwise, use the initial state.
      return storedValue ? JSON.parse(storedValue) : initialState;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialState;
    }
  });

  useEffect(() => {
    try {
      // Save state to localStorage whenever it changes.
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
};