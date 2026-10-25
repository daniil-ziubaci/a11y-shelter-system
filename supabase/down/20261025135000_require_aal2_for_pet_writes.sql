-- После отката запись в анкеты животных снова требует только членства в приюте, без второго фактора. Данные не затрагиваются.
drop policy "Pet inserts require second factor" on public.pets;
drop policy "Pet updates require second factor" on public.pets;