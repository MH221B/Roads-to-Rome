import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
  // The function to fetch data. Must return a Promise resolving to the array of items.
  fetchData: (page: number) => Promise<T[]>;
  // Dependencies that should trigger a list reset (e.g., filters, search query)
  dependencies?: any[];
  // How many items per page (used to calculate hasMore)
  limit?: number;
}

export function useInfiniteScroll<T>({
  fetchData,
  dependencies = [],
  limit = 10,
}: UseInfiniteScrollOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isMountedRef = useRef(true);
  const observer = useRef<IntersectionObserver | null>(null);

  // Core load function
  const loadPage = useCallback(
    async (targetPage: number, isReset: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const newItems = await fetchData(targetPage);

        if (!isMountedRef.current) return;

        if (isReset) {
          setData(newItems);
        } else {
          // Deduplicate by ID if items have an id property
          setData((prev) => {
            const existingIds = new Set(
              (prev as any[]).map((item: any) => item.id).filter(Boolean)
            );
            const uniqueNewItems = newItems.filter((item: any) => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          });
        }

        // If we got fewer items than the limit, we've hit the end
        setHasMore(newItems.length >= limit);

        // Setup next page
        setPage(targetPage + 1);
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err?.message ?? 'Failed to load data');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchData, limit]
  );

  // Reset and load initial data when dependencies change
  useEffect(() => {
    isMountedRef.current = true;
    setPage(1);
    setHasMore(true);
    // Load page 1, true = replace existing data
    loadPage(1, true);

    return () => {
      isMountedRef.current = false;
    };
  }, [loadPage, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Callback to attach to the sentinel element at the bottom of the list
  const bottomRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPage(page, false);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, page, loadPage]
  );

  // Return everything the UI needs
  return {
    data,
    setData, // Exposed for optimistic updates (like locking a user)
    loading,
    error,
    hasMore,
    bottomRef, // Attach this to your <div /> at the bottom
  };
}
