-- 002_notify_request — FR-038.
--
-- When a song has no grounded material, the page offers two paths: contribute a
-- source, or be told when it becomes explained. This stores the second.
--
-- ⚠️ SENDING IS NOT IMPLEMENTED. This records the request only. Nothing reads
-- this table yet and no notification is delivered — the UI must not promise
-- otherwise. Even unsent, the rows are useful on their own: they say which songs
-- people actually want explained, which is the best signal for what to research
-- next.
--
-- Privacy: these are email addresses belonging to people who are often not
-- signed in. They are stored for this single purpose. Account deletion removes
-- them (docs/subscription_plans.md, lifecycle), and they are never used for
-- anything but the notification the person asked for.

CREATE TABLE notify_request (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id     uuid NOT NULL REFERENCES song(id) ON DELETE CASCADE,
  email       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz
);

-- One request per person per song. Asking twice is not two requests, and
-- without this a frustrated reader clicking repeatedly would create duplicates
-- that all become duplicate emails later.
CREATE UNIQUE INDEX notify_request_song_email_idx
  ON notify_request (song_id, lower(email));

-- The query the sender will run when it exists: everyone still waiting on a song.
CREATE INDEX notify_request_pending_idx
  ON notify_request (song_id)
  WHERE notified_at IS NULL;
