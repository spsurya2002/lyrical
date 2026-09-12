-- 001_initial — the song page read model.
-- specs/001-song-page-trilingual/data-model.md
--
-- Three ideas shape this schema:
--   1. A meaning is stored separately from the three language renderings of it,
--      so the renderings cannot drift apart.
--   2. A meaning belongs to a PLACE IN A SONG, not to a word. `ishq` in one song
--      and `ishq` in another are different records.
--   3. "Is this explained?" is never stored. It is counted from meaning_source on
--      every read — a stored flag would go stale and serve an under-grounded
--      explanation, which constitution Principle I forbids.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────────────────────

-- Two scripts, three modes: English and Hinglish both render Latin (R-01).
CREATE TYPE script AS ENUM ('deva', 'latn');
CREATE TYPE mode AS ENUM ('en', 'hi', 'hi-Latn');
CREATE TYPE meaning_target AS ENUM ('song_summary', 'line', 'word_occurrence');
CREATE TYPE meaning_status AS ENUM ('active', 'stale');
CREATE TYPE source_type AS ENUM ('blog', 'forum', 'lyrics', 'interview', 'academic', 'other');

-- ── Song ─────────────────────────────────────────────────────────────────────

CREATE TABLE song (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        text NOT NULL UNIQUE,
  artist      text NOT NULL,
  year        integer,
  film        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Titles are script-dependent: "Kun Faya Kun" and its Devanagari form.
CREATE TABLE song_title (
  song_id  uuid NOT NULL REFERENCES song(id) ON DELETE CASCADE,
  script   script NOT NULL,
  text     text NOT NULL,
  PRIMARY KEY (song_id, script)
);

-- ── Lyrics ───────────────────────────────────────────────────────────────────

CREATE TABLE lyric_line (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id  uuid NOT NULL REFERENCES song(id) ON DELETE CASCADE,
  line_no  integer NOT NULL CHECK (line_no > 0),
  UNIQUE (song_id, line_no)
);

-- Keyed by SCRIPT, not mode. Storing three mode-keyed copies would mean the
-- English and Hinglish lyric must be kept identical forever; the first drift
-- shows different lyrics in two modes. Two rows make that impossible (R-01).
CREATE TABLE lyric_line_text (
  line_id  uuid NOT NULL REFERENCES lyric_line(id) ON DELETE CASCADE,
  script   script NOT NULL,
  text     text NOT NULL,
  PRIMARY KEY (line_id, script)
);

-- ── Word occurrences ─────────────────────────────────────────────────────────

-- A meaning attaches HERE, never to a spelling. The same word can mean different
-- things in two songs, and twice within one song (FR-018).
CREATE TABLE word_occurrence (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_id       uuid NOT NULL REFERENCES lyric_line(id) ON DELETE CASCADE,
  position      integer NOT NULL CHECK (position >= 0),
  surface_latn  text NOT NULL,
  surface_deva  text NOT NULL,
  UNIQUE (line_id, position)
);

-- ── Meanings ─────────────────────────────────────────────────────────────────

CREATE TABLE meaning (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type  meaning_target NOT NULL,
  target_id    uuid NOT NULL,
  status       meaning_status NOT NULL DEFAULT 'active',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- One ACTIVE meaning per target. A stale meaning stays readable alongside its
-- replacement (FR-007), so staleness must not violate uniqueness.
CREATE UNIQUE INDEX meaning_one_active_per_target
  ON meaning (target_type, target_id)
  WHERE status = 'active';

-- Three renderings of one meaning. CASCADE is what guarantees they die together
-- and can never drift apart.
CREATE TABLE meaning_rendering (
  meaning_id    uuid NOT NULL REFERENCES meaning(id) ON DELETE CASCADE,
  mode          mode NOT NULL,
  text          text NOT NULL,
  validated_at  timestamptz,
  PRIMARY KEY (meaning_id, mode)
);

-- ── Sources ──────────────────────────────────────────────────────────────────

CREATE TABLE source (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  url           text NOT NULL UNIQUE,
  domain        text NOT NULL,
  type          source_type NOT NULL,
  -- Stored at retrieval time so a source that later goes offline can still be
  -- shown and attributed.
  excerpt       text NOT NULL,
  retrieved_at  timestamptz NOT NULL DEFAULT now(),
  -- A rotted link does NOT unground an explanation. It is marked and keeps counting.
  reachable     boolean NOT NULL DEFAULT true
);

-- Constitution Principle I in physical form: no rows here, nothing is served.
CREATE TABLE meaning_source (
  meaning_id  uuid NOT NULL REFERENCES meaning(id) ON DELETE CASCADE,
  source_id   uuid NOT NULL REFERENCES source(id) ON DELETE RESTRICT,
  PRIMARY KEY (meaning_id, source_id)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX lyric_line_song_idx        ON lyric_line (song_id, line_no);
CREATE INDEX word_occurrence_line_idx   ON word_occurrence (line_id, position);
CREATE INDEX meaning_target_idx         ON meaning (target_type, target_id);
-- The grounding count is the hot path: it runs for every meaning on every read.
CREATE INDEX meaning_source_meaning_idx ON meaning_source (meaning_id);
