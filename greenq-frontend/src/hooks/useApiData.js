import { useCallback, useEffect, useState } from "react";

export function useApiData(loader, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await loader();
      setData(result);
      return result;
    } catch (err) {
      setError(err?.message || "데이터를 불러오지 못했습니다.");
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        setLoading(true);
        setError("");
        const result = await loader();
        if (alive) setData(result);
      } catch (err) {
        if (alive) {
          setError(err?.message || "데이터를 불러오지 못했습니다.");
          setData(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, deps);

  return { data, loading, error, reload, setData };
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}
