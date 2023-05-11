SELECT 
  * 
FROM posts 
WHERE mf2->>'$.city' = $city;
