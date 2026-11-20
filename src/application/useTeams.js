// Use case: team registry — loads teams when the Equipos view mounts;
// reload after alta.
import { useCallback, useEffect, useState } from 'react';
import { getTeams } from '../infrastructure/api/catalogApi.js';

export const useTeams = (enabled) => {
  const [teams, setTeams] = useState(null);
  const reload = useCallback(
    () => getTeams().then(setTeams).catch(() => setTeams([])),
    [],
  );
  useEffect(() => { if (enabled) reload(); }, [enabled, reload]);
  return { teams, reload };
};
