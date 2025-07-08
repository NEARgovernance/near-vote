import { useEffect, useState } from "react";
import contractManager from "../lib/ContractManager.js";

export function useContractManager() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = contractManager.addListener(() => {
      setVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  return contractManager;
}
