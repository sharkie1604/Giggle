import { useState, useCallback } from 'react';
import api from '../services/api';

export function useEscrow(escrowId) {
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEscrow = useCallback(async () => {
    if (!escrowId) return;
    setLoading(true);
    try {
      const res = await api.get(`/escrow/${escrowId}`);
      setEscrow(res.data.escrow);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch escrow vault');
    } finally {
      setLoading(false);
    }
  }, [escrowId]);

  return { escrow, loading, error, fetchEscrow };
}
