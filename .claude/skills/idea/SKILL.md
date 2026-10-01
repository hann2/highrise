---
name: idea
description: Record an idea into the right file in notes/ (creating one if none fits), then commit just that change and cherry-pick it to master. Use when Simon types "/idea ...".
argument-hint: <the idea>
---

Simon has an idea to record: $ARGUMENTS

1. **Pick the file.** List `notes/` and skim the headings of the likely candidates. Each file has a scope:
   - `character-ideas.txt`, `level-ideas.txt`, `sounds-we-need.txt` — plain idea lists
   - `roguelike-redesign.md` — the design doc and backlog for the run, progression, stores, items, bosses, lobby
   - `fire.md` — fire and smoke
   - `lighting-ideas.md` — lighting and vision features
   - `electron.md` — the desktop app
   - `upstream.md` — engine changes to take back upstream (only for that)
   If none fits, create a new one named for the topic (`<topic>-ideas.md`, starting with a `# <Topic> ideas` heading and a line saying when it was started), and add it to the `notes/` entry in `CLAUDE.md` only if it's a design doc rather than an idea list.

2. **Write it down.** Add the idea in the file's own style and in the section it belongs to (a list item in a list, a short paragraph or bullet under the right heading in a doc; an "ideas"/"open questions"/backlog section if there is one). Keep Simon's meaning and wording; tidy it into a sentence or two, but don't expand it into a design or invent details. Don't touch anything else in the file. If the same idea is already there, add to that entry instead.

3. **Commit just that change.** Stage only the notes file(s) you changed (`git add <paths>`, never `-A`), so anything else in progress stays out. Message: `Idea: <short summary>`, with the attribution trailer.

4. **Get it onto master.** If the current branch isn't `master`, cherry-pick the commit onto master without disturbing the current checkout:
   - If master is checked out in another worktree (`git worktree list`), cherry-pick there with `git -C <that path> cherry-pick <sha>`, unless that worktree has uncommitted changes to the same file, in which case stop and tell Simon.
   - Otherwise, use a temporary worktree: `git worktree add <scratchpad>/idea-master master`, cherry-pick there, then `git worktree remove` it.
   - If the cherry-pick conflicts, abort it and tell Simon rather than resolving it by guessing.
   Don't push.

5. Reply in one or two lines: which file, and the commit(s).
