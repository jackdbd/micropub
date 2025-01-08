DELETE FROM authorization_codes;

DELETE FROM access_tokens;

DELETE FROM clients;

INSERT INTO clients
  ("client_id", "me", "redirect_uri")
VALUES 
  ('http://localhost:3001/id', 'https://giacomodebidda.com/', 'http://localhost:3001/auth/callback');


DELETE FROM refresh_tokens;

DELETE FROM profiles;

INSERT INTO profiles 
  ("me", "name", "photo", "url", "email")
VALUES 
  ('https://giacomodebidda.com/', 'Giacomo Debidda', 'https://avatars.githubusercontent.com/u/5048090', 'https://www.giacomodebidda.com/', 'giacomo@giacomodebidda.com'),
  ('https://alice.example.com/', 'Alice Example', 'https://example.com/photo/alice.jpg', 'https://alice.example.com/', 'alice@example.com'),
  ('https://bob.example.com/', 'Bob Example', 'https://example.com/photo/bob.jpg', 'https://bob.example.com/', 'bob@example.com');
