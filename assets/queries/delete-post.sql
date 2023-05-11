UPDATE posts 
SET mf2 = json_set(mf2, '$.deleted', TRUE) 
WHERE id = $id;
