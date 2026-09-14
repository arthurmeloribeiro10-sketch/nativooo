UPDATE public.meals
SET name = CASE name
  WHEN 'Lanche da Caça' THEN 'Lanche da manhã'
  WHEN 'Almoço da Tribo' THEN 'Almoço'
  WHEN 'Café da Manhã Ancestral' THEN 'Café da manhã'
  WHEN 'Lanche da Colheita' THEN 'Lanche da tarde'
  WHEN 'Jantar da Fogueira' THEN 'Jantar'
  ELSE name
END
WHERE name IN ('Lanche da Caça', 'Almoço da Tribo', 'Café da Manhã Ancestral', 'Lanche da Colheita', 'Jantar da Fogueira');

UPDATE public.diet_plan_meals
SET name = CASE name
  WHEN 'Lanche da Caça' THEN 'Lanche da manhã'
  WHEN 'Almoço da Tribo' THEN 'Almoço'
  WHEN 'Café da Manhã Ancestral' THEN 'Café da manhã'
  WHEN 'Lanche da Colheita' THEN 'Lanche da tarde'
  WHEN 'Jantar da Fogueira' THEN 'Jantar'
  ELSE name
END
WHERE name IN ('Lanche da Caça', 'Almoço da Tribo', 'Café da Manhã Ancestral', 'Lanche da Colheita', 'Jantar da Fogueira');