import React from 'react';

export function useLeaderboard(apiBaseUrl) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [friends, setFriends] = React.useState([]);
  const [global, setGlobal] = React.useState([]);

  const refresh = React.useCallback(async (weeks = 4) => {
    setLoading(true);
    setError(null);
    try {
      const [friendsRes, globalRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/leaderboard/friends?weeks=${weeks}`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`${apiBaseUrl}/api/leaderboard/global?weeks=${weeks}`, { credentials: 'include' }).then((r) => r.json()),
      ]);
      setFriends(friendsRes.leaderboard || []);
      setGlobal(globalRes.leaderboard || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, error, friends, global, refresh };
}


