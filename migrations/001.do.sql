CREATE TABLE posts (
  -- In SQLite, always use INTEGER PRIMARY KEY AUTOINCREMENT
  -- https://github.com/WiseLibs/better-sqlite3/blob/master/docs/tips.md
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Posts are stored as microformats2 json
  -- https://indieweb.org/post
  -- https://indieweb.org/microformats2
  -- Example of a post: a note, an article, a comment, an event
  -- https://indieweb.org/note
  -- https://indieweb.org/article
  -- https://indieweb.org/event
  mf2 JSON NOT NULL
  
  -- deleted BOOLEAN NOT NULL DEFAULT 0
  -- created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
