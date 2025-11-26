import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  // State e setters para o valor "atrasado" (debounced)
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // Atualiza o valor debounced apenas após o tempo de delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Cancela o timeout se o valor mudar (ou no desmonte do componente)
      // É assim que evitamos que o valor seja atualizado se o usuário continuar digitando.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Executa o efeito novamente apenas se o valor ou o delay mudarem
  );

  return debouncedValue;
}

