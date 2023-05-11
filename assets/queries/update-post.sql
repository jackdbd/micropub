UPDATE posts 
SET mf2 = json_set(mf2, '$.city', $city) 
WHERE id = $id;
