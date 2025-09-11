import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';

export const useAuthenticatedData = (dataLoader, dependencies = []) => {
  const { currentUser } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        console.log('No user in context yet, waiting...');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await dataLoader(currentUser);
        setData(result);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, ...dependencies]);

  return { data, loading, error };
};
