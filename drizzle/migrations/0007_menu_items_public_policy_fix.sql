DROP POLICY "Public reads active menu" ON public.menu_items;
CREATE POLICY "Public reads active menu" ON public.menu_items FOR SELECT TO anon, authenticated USING (NOT is_archived);