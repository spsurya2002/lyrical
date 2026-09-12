# About This Project

## The problem I have faced

When I listen to a song, I want to know what it actually means:

- what each word means **in the context of that song**
- what each line means
- what the song means as a whole
- the story behind it, and the context it was written in
- who wrote it

Today I have to find this myself, by searching across Google, YouTube, Reddit,
Quora, lyrics sites, Instagram, and blogs. It is slow and scattered. And when I
ask ChatGPT instead, it often invents a meaning that has no grounding in the
song's actual context.

## The solution I want to build

A tool where the search is a single step: paste a song name, a URL, or any
detail you know about the song, and get back its meaning —

- **word by word**, interpreted in the context of that song (a word can carry
  many meanings; only one of them is the right one here)
- **line by line**, explaining what each line is saying
- **a summary at the end**, stating the central meaning of the song

## Features

### A. AI-generated meaning, grounded in real sources

The tool uses AI, but it does not invent meanings. It finds what already exists
on the internet — lyrics sites, Quora, Reddit, blogs, and other sources — and
rewrites those findings in clear, simple language as a contextual explanation.

### B. RAG-based, so the knowledge stays current

The knowledge base is retrieved from and updated continuously, rather than being
frozen at training time.

### C. Reuse of past searches

If a song has already been explained for someone else, the tool serves that
stored explanation instead of re-generating it. Meaning does not change, so
re-computing it is wasted cost and time.

If the song is new — nobody has asked for it before — the tool researches it and
adds the result to the knowledge base for future users.

**One exception:** when new knowledge arrives about a song that already has a
stored explanation (see feature G), that song's stored explanation is marked
stale, and the next person who asks for it gets a freshly generated one. Every
other song keeps serving from storage. This is what lets C and G coexist —
see *How C and G work together* below.

### D. Personalization and an in-context chatbot

A chatbot appears on screen alongside the song. It has:

- the context of the song currently open
- access to the knowledge base

It answers whatever the user is curious about regarding that song, and what it
learns feeds back into the knowledge base.

The user can also click any individual word to see its meaning.

Word meanings are stored in the knowledge base too, and each word entry has its
own identity, because:

- the same word can mean different things in two different songs
- the same word can even mean different things twice within one song

The tool must manage word identity and disambiguation properly for this to work.

### E. Authentication

Google login.

### F. Personal library

Users can save songs and words to their own collection.

### G. Community contributions

Anyone can contribute knowledge to improve the tool.

Example: I read a blog that explains a song well, so I paste the blog's URL — or
an image — as a contribution.

On a schedule, the tool reviews each submission and decides whether it is
genuinely relevant to the tool's purpose, or whether someone pasted something
out of scope. Only genuine contributions are folded into the knowledge base.

The purpose of G is to build up the tool's **own** knowledge base, so that when
a user asks something, the tool has real material of its own to answer from.

### H. Three languages, and only three

The tool speaks **English, Hindi, and Hinglish**. Nothing else.

The user picks one, and the whole page follows it:

- **English** — the word and its meaning both in English.
- **Hindi** — the word in Devanagari, the meaning in Hindi.
- **Hinglish** — the word in English letters, the meaning in Hindi written in
  English letters.

**No Arabic or Urdu script anywhere.** These songs are full of Arabic- and
Persian-origin words, and the sources I'll be pulling from are full of Urdu
script. It can be read and stored, but a user must never see it. A word like
*fana* appears as `Fana` or `फ़ना` — never in its original spelling.

The full rules, including how this gets enforced rather than just hoped for,
are in [`docs/language_policy.md`](docs/language_policy.md).

### I. Basic and Pro plans

Two plans. **Basic is free**, **Pro is paid**.

Reading a song that's already been explained is free and unlimited — that
costs almost nothing to serve (feature C). What costs money is researching a
song nobody has asked about yet, so that's where the line sits.

Basic gets a monthly allowance of new-song research. Pro gets:

- unlimited new-song research
- the in-context chatbot (feature D)
- an unlimited personal library (feature F)
- export — PDF and share cards

Contributing knowledge (feature G) is free on both. It's what makes the tool
better; charging for it would be backwards.

Limits, pricing, and lifecycle rules are in
[`docs/subscription_plans.md`](docs/subscription_plans.md).

## How C and G work together

Both C and G are in version 1. They are not in conflict, because they act on two
different things:

| | What it holds | What it is for |
|---|---|---|
| **C** | the finished explanation of a song | avoid paying to research the same song twice |
| **G** | source material in the knowledge base | give the tool its own knowledge to answer from |

They meet at exactly one point: a contribution arrives about a song that already
has a stored explanation. The rule for version 1:

1. A contribution is accepted into the knowledge base (G).
2. Any stored explanation for the song(s) that contribution touches is marked
   stale.
3. The next request for that song regenerates the explanation, now using the new
   knowledge, and stores it again.
4. Songs nobody contributed to keep serving from storage, unchanged.

So the cost saving of C survives — the common case is that nothing was
contributed — while G still makes the tool's answers better over time.

**Version 2 may change this.** If it turns out that contributions arrive often,
or that regenerating on the next request is too slow for the user waiting, the
architecture may move to regenerating in the background instead. That decision
is deliberately deferred; version 1 keeps both features with the simple rule
above.

## Interface

The tool must have a good UI, with a theme that fits its subject and purpose.
The UX must be good: it should be easy to use.

The direction is **dark and cinematic, music-first** — a near-black canvas, a
warm gold accent, lyrics set large in a serif that can carry both Latin and
Devanagari, and the UI itself kept quiet so the words of the song are the
loudest thing on screen.

The design system is in [`docs/design_system.md`](docs/design_system.md). The
brief to hand to a design tool is [`design_prompt.md`](design_prompt.md).

## Working rules

I am not writing the code. Agents are. So the rules they work under are part
of the project, not a side note:

- [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — the
  principles every spec and plan is checked against. The first two are about
  not inventing things: the product must not invent meanings, and the agent
  must not invent progress.
- [`CLAUDE.md`](CLAUDE.md) — the operating rules for each session.
- [`AGENTS.md`](AGENTS.md) — the same, for any other agent.

Specs are tracked with [Spec Kit](https://github.com/github/spec-kit): specify
→ plan → tasks → implement. Nothing gets built that doesn't have a spec first.
