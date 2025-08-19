import React from 'react';
import config from '../config/config';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function Friends() {
  const [email, setEmail] = React.useState('');
  const [friends, setFriends] = React.useState([]);
  const [incoming, setIncoming] = React.useState([]);
  const [outgoing, setOutgoing] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [list, pending] = await Promise.all([
        fetch(`${config.API_BASE_URL}/api/friends/list`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`${config.API_BASE_URL}/api/friends/pending`, { credentials: 'include' }).then((r) => r.json()),
      ]);
      setFriends(list.friends || []);
      setIncoming(pending.incoming || []);
      setOutgoing(pending.outgoing || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const sendRequest = async () => {
    setMessage('');
    const res = await fetch(`${config.API_BASE_URL}/api/friends/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setEmail('');
      setMessage('Request sent');
      load();
    } else {
      const j = await res.json().catch(() => ({}));
      setMessage(j.error || 'Failed to send request');
    }
  };

  const accept = async (userId) => {
    setMessage('');
    const res = await fetch(`${config.API_BASE_URL}/api/friends/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setMessage('Friend added');
      load();
    } else {
      const j = await res.json().catch(() => ({}));
      setMessage(j.error || 'Failed to accept');
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Friends</h1>
      {loading && <p className="text-sm text-muted-foreground mb-2">Loading…</p>}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invite by Email</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <input
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 border rounded px-3 py-2 bg-white dark:bg-gray-900"
          />
          <Button onClick={sendRequest} disabled={!email}>Send</Button>
        </CardContent>
      </Card>

      {message && <p className="mb-4 text-sm text-muted-foreground">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Incoming Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {incoming.length === 0 && <p className="text-sm text-muted-foreground">No incoming requests</p>}
            <ul className="space-y-3">
              {incoming.map((r) => (
                <li key={r.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {r.user?.picture ? (
                      <img src={r.user.picture} alt={r.user.name} className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300" />
                    )}
                    <div>
                      <div className="font-medium">{r.user?.name || 'User'}</div>
                      <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                    </div>
                  </div>
                  <Button onClick={() => accept(r.userId)}>Accept</Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outgoing Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {outgoing.length === 0 && <p className="text-sm text-muted-foreground">No outgoing requests</p>}
            <ul className="space-y-3">
              {outgoing.map((r) => (
                <li key={r.userId} className="flex items-center gap-3">
                  {r.user?.picture ? (
                    <img src={r.user.picture} alt={r.user.name} className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300" />
                  )}
                  <div>
                    <div className="font-medium">{r.user?.name || 'User'}</div>
                    <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your Friends</CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 && <p className="text-sm text-muted-foreground">No friends yet</p>}
          <ul className="space-y-3">
            {friends.map((f) => (
              <li key={f._id} className="flex items-center gap-3">
                {f.picture ? (
                  <img src={f.picture} alt={f.name} className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300" />
                )}
                <div>
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.email}</div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


