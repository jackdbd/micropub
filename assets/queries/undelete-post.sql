UPDATE posts 
SET mf2 = json_set(mf2, '$.deleted', FALSE) 
WHERE id = $id;
