CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  category_sort integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL CHECK (price_cents >= 0 AND price_cents <= 100000),
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active menu" ON public.menu_items FOR SELECT TO anon, authenticated USING (NOT is_archived OR private.is_staff(auth.uid()));
CREATE POLICY "Staff manage menu" ON public.menu_items FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER menu_items_updated BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ordering_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pickup_enabled boolean NOT NULL DEFAULT true,
  delivery_enabled boolean NOT NULL DEFAULT false,
  delivery_area text,
  delivery_fee_cents integer CHECK (delivery_fee_cents IS NULL OR (delivery_fee_cents >= 0 AND delivery_fee_cents <= 10000)),
  ordering_paused boolean NOT NULL DEFAULT false,
  customer_message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ordering_settings TO anon, authenticated;
GRANT UPDATE ON public.ordering_settings TO authenticated;
GRANT ALL ON public.ordering_settings TO service_role;
ALTER TABLE public.ordering_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads ordering settings" ON public.ordering_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff update ordering settings" ON public.ordering_settings FOR UPDATE TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER ordering_settings_updated BEFORE UPDATE ON public.ordering_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.ordering_settings (id) VALUES (1);

CREATE SEQUENCE public.food_order_number_seq START 1001;
CREATE TABLE public.food_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number integer NOT NULL UNIQUE DEFAULT nextval('public.food_order_number_seq'),
  public_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  idempotency_key uuid NOT NULL UNIQUE,
  customer_name text NOT NULL,
  phone text NOT NULL,
  fulfillment text NOT NULL CHECK (fulfillment IN ('pickup','delivery')),
  street_address text,
  city text,
  postal_code text,
  delivery_instructions text,
  special_instructions text,
  subtotal_cents integer NOT NULL,
  delivery_fee_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready_for_pickup','out_for_delivery','completed','declined')),
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  preparing_at timestamptz,
  ready_at timestamptz,
  out_for_delivery_at timestamptz,
  completed_at timestamptz,
  declined_at timestamptz
);
ALTER SEQUENCE public.food_order_number_seq OWNED BY public.food_orders.order_number;
GRANT SELECT, UPDATE ON public.food_orders TO authenticated;
GRANT ALL ON public.food_orders TO service_role;
ALTER TABLE public.food_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read orders" ON public.food_orders FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "Staff update orders" ON public.food_orders FOR UPDATE TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE TABLE public.food_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.food_orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit_price_cents integer NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 50),
  line_total_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX food_order_items_order_idx ON public.food_order_items(order_id);
GRANT SELECT ON public.food_order_items TO authenticated;
GRANT ALL ON public.food_order_items TO service_role;
ALTER TABLE public.food_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read order items" ON public.food_order_items FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

-- Status transitions + timestamps; staff may only change status
CREATE OR REPLACE FUNCTION public.food_order_status_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'pending' AND NEW.status IN ('confirmed','declined')) OR
      (OLD.status = 'confirmed' AND NEW.status IN ('preparing','declined')) OR
      (OLD.status = 'preparing' AND OLD.fulfillment = 'pickup' AND NEW.status = 'ready_for_pickup') OR
      (OLD.status = 'preparing' AND OLD.fulfillment = 'delivery' AND NEW.status = 'out_for_delivery') OR
      (OLD.status IN ('ready_for_pickup','out_for_delivery') AND NEW.status = 'completed')
    ) THEN
      RAISE EXCEPTION 'Invalid order status change from % to %', OLD.status, NEW.status;
    END IF;
    CASE NEW.status
      WHEN 'confirmed' THEN NEW.confirmed_at := now();
      WHEN 'preparing' THEN NEW.preparing_at := now();
      WHEN 'ready_for_pickup' THEN NEW.ready_at := now();
      WHEN 'out_for_delivery' THEN NEW.out_for_delivery_at := now();
      WHEN 'completed' THEN NEW.completed_at := now();
      WHEN 'declined' THEN NEW.declined_at := now();
      ELSE NULL;
    END CASE;
  END IF;
  -- order contents and prices are immutable
  IF NEW.subtotal_cents <> OLD.subtotal_cents OR NEW.total_cents <> OLD.total_cents OR NEW.delivery_fee_cents <> OLD.delivery_fee_cents
     OR NEW.order_number <> OLD.order_number OR NEW.public_token <> OLD.public_token OR NEW.fulfillment <> OLD.fulfillment THEN
    RAISE EXCEPTION 'Order totals and identifiers cannot be changed';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER food_orders_status_guard BEFORE UPDATE ON public.food_orders FOR EACH ROW EXECUTE FUNCTION public.food_order_status_guard();

-- Public order placement: validates everything and prices from the database
CREATE OR REPLACE FUNCTION public.place_food_order(payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.ordering_settings;
  v_key uuid;
  v_name text := btrim(coalesce(payload->>'customer_name',''));
  v_phone text := btrim(coalesce(payload->>'phone',''));
  v_ful text := payload->>'fulfillment';
  v_street text := nullif(btrim(coalesce(payload->>'street_address','')),'');
  v_city text := nullif(btrim(coalesce(payload->>'city','')),'');
  v_postal text := upper(nullif(btrim(coalesce(payload->>'postal_code','')),''));
  v_dinst text := nullif(btrim(coalesce(payload->>'delivery_instructions','')),'');
  v_sinst text := nullif(btrim(coalesce(payload->>'special_instructions','')),'');
  v_items jsonb := payload->'items';
  v_existing public.food_orders;
  v_order_id uuid;
  v_sub integer := 0;
  v_fee integer := 0;
  it jsonb;
  mi public.menu_items;
  q integer;
  v_num integer;
  v_token uuid;
BEGIN
  BEGIN v_key := (payload->>'idempotency_key')::uuid; EXCEPTION WHEN others THEN RAISE EXCEPTION 'Invalid request'; END;
  IF v_key IS NULL THEN RAISE EXCEPTION 'Invalid request'; END IF;
  SELECT * INTO v_existing FROM public.food_orders WHERE idempotency_key = v_key;
  IF FOUND THEN
    RETURN jsonb_build_object('order_number', v_existing.order_number, 'token', v_existing.public_token, 'total_cents', v_existing.total_cents);
  END IF;

  SELECT * INTO s FROM public.ordering_settings WHERE id = 1;
  IF s.ordering_paused THEN RAISE EXCEPTION 'Online ordering is paused right now'; END IF;
  IF length(v_name) < 2 OR length(v_name) > 100 THEN RAISE EXCEPTION 'Please enter your full name'; END IF;
  IF length(regexp_replace(v_phone,'\D','','g')) NOT BETWEEN 10 AND 11 OR length(v_phone) > 25 THEN RAISE EXCEPTION 'Please enter a valid phone number'; END IF;
  IF v_sinst IS NOT NULL AND length(v_sinst) > 500 THEN RAISE EXCEPTION 'Special instructions are too long'; END IF;

  IF v_ful = 'pickup' THEN
    IF NOT s.pickup_enabled THEN RAISE EXCEPTION 'Pickup ordering is not available right now'; END IF;
    v_street := NULL; v_city := NULL; v_postal := NULL; v_dinst := NULL;
  ELSIF v_ful = 'delivery' THEN
    IF NOT s.delivery_enabled OR s.delivery_fee_cents IS NULL OR s.delivery_area IS NULL THEN RAISE EXCEPTION 'Delivery is not available right now'; END IF;
    IF v_street IS NULL OR length(v_street) > 200 THEN RAISE EXCEPTION 'Please enter a street address'; END IF;
    IF v_city IS NULL OR length(v_city) > 100 THEN RAISE EXCEPTION 'Please enter a city or town'; END IF;
    IF v_postal IS NULL OR v_postal !~ '^[A-Z][0-9][A-Z] ?[0-9][A-Z][0-9]$' THEN RAISE EXCEPTION 'Please enter a valid postal code'; END IF;
    IF v_dinst IS NOT NULL AND length(v_dinst) > 500 THEN RAISE EXCEPTION 'Delivery instructions are too long'; END IF;
    v_fee := s.delivery_fee_cents;
  ELSE
    RAISE EXCEPTION 'Please choose pickup or delivery';
  END IF;

  IF jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN RAISE EXCEPTION 'Your cart is empty'; END IF;
  IF jsonb_array_length(v_items) > 50 THEN RAISE EXCEPTION 'Too many different items'; END IF;

  INSERT INTO public.food_orders (idempotency_key, customer_name, phone, fulfillment, street_address, city, postal_code, delivery_instructions, special_instructions, subtotal_cents, delivery_fee_cents, total_cents, is_test)
  VALUES (v_key, v_name, v_phone, v_ful, v_street, v_city, v_postal, v_dinst, v_sinst, 0, v_fee, 0, coalesce((payload->>'is_test')::boolean, false))
  RETURNING id, order_number, public_token INTO v_order_id, v_num, v_token;

  FOR it IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    BEGIN q := (it->>'quantity')::integer; EXCEPTION WHEN others THEN RAISE EXCEPTION 'Invalid quantity'; END;
    IF q IS NULL OR q < 1 OR q > 50 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    BEGIN
      SELECT * INTO mi FROM public.menu_items WHERE id = (it->>'menu_item_id')::uuid;
    EXCEPTION WHEN others THEN RAISE EXCEPTION 'An item in your cart is no longer on the menu'; END;
    IF NOT FOUND OR mi.is_archived THEN RAISE EXCEPTION 'An item in your cart is no longer on the menu'; END IF;
    IF NOT mi.is_available THEN RAISE EXCEPTION '% is currently unavailable', mi.name; END IF;
    INSERT INTO public.food_order_items (order_id, menu_item_id, name, unit_price_cents, quantity, line_total_cents)
    VALUES (v_order_id, mi.id, mi.name, mi.price_cents, q, mi.price_cents * q);
    v_sub := v_sub + mi.price_cents * q;
  END LOOP;

  ALTER TABLE public.food_orders DISABLE TRIGGER food_orders_status_guard;
  UPDATE public.food_orders SET subtotal_cents = v_sub, total_cents = v_sub + v_fee WHERE id = v_order_id;
  ALTER TABLE public.food_orders ENABLE TRIGGER food_orders_status_guard;

  RETURN jsonb_build_object('order_number', v_num, 'token', v_token, 'total_cents', v_sub + v_fee);
END $$;
REVOKE ALL ON FUNCTION public.place_food_order(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_food_order(jsonb) TO anon, authenticated;

-- Public status lookup by unguessable token; no phone or address returned
CREATE OR REPLACE FUNCTION public.get_food_order_status(p_token uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'order_number', o.order_number, 'status', o.status, 'fulfillment', o.fulfillment,
    'subtotal_cents', o.subtotal_cents, 'delivery_fee_cents', o.delivery_fee_cents, 'total_cents', o.total_cents,
    'created_at', o.created_at,
    'items', coalesce((SELECT jsonb_agg(jsonb_build_object('name', i.name, 'quantity', i.quantity, 'unit_price_cents', i.unit_price_cents, 'line_total_cents', i.line_total_cents) ORDER BY i.created_at, i.name) FROM public.food_order_items i WHERE i.order_id = o.id), '[]'::jsonb)
  ) FROM public.food_orders o WHERE o.public_token = p_token
$$;
REVOKE ALL ON FUNCTION public.get_food_order_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_food_order_status(uuid) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.food_orders;

-- Seed the existing snack bar menu (prices exactly as published; sizes and priced extras split into orderable lines)
INSERT INTO public.menu_items (category, category_sort, name, description, price_cents, sort_order) VALUES
('Appetizers',1,'Cheddar Cheese Ball','Melt-in-your-mouth cheddar goodness. Add gravy to make it even more wonderful!',1200,1),
('Appetizers',1,'Mini Carnival-Style Donuts','10 donuts per order, coated with delicious sugar and cinnamon sweetness.',750,2),
('Appetizers',1,'Fries — Small',NULL,450,3),
('Appetizers',1,'Fries — Large',NULL,650,4),
('Appetizers',1,'Jalapeño Poppers','Cream cheese-filled jalapeño poppers with a crunchy coating. Yum!',900,5),
('Appetizers',1,'Mozza Cheese Sticks with Ranch Dip',NULL,775,6),
('Appetizers',1,'Battered Onion Rings',NULL,675,7),
('Appetizers',1,'Zucchini Sticks','Deep-fried and served with ranch dip.',750,8),
('Appetizers',1,'Deep-Fried Pickles','Served with dip.',750,9),
('Appetizers',1,'Battered Mushrooms','Served with ranch dip.',750,10),
('Appetizers',1,'Single-Size Tray of Deep-Fried Appetizers','A tasty selection of deep-fried appetizers served with ranch dip.',1150,11),
('Appetizers',1,'Chili Cheese Dog','A hot dog topped with homemade mild chili.',750,12),
('Appetizers',1,'Hot Dog','Long and delicious, served with mustard, ketchup, and relish.',500,13),
('Meals',2,'Donair — Small','The best in town! Your choice of fresh crisp lettuce, tomatoes, onions, banana peppers, cheese, olives, pickles, and pineapple, topped with our own homemade sauces — sweet, garlic, or a combination of both.',1100,1),
('Meals',2,'Donair — Regular','The best in town! Your choice of fresh crisp lettuce, tomatoes, onions, banana peppers, cheese, olives, pickles, and pineapple, topped with our own homemade sauces — sweet, garlic, or a combination of both.',1400,2),
('Meals',2,'Donair — Large','The best in town! Your choice of fresh crisp lettuce, tomatoes, onions, banana peppers, cheese, olives, pickles, and pineapple, topped with our own homemade sauces — sweet, garlic, or a combination of both.',2095,3),
('Meals',2,'3 Chicken Strips & Fries','Three tender chicken strips served with fries and your choice of dip.',1000,4),
('Meals',2,'3 Chicken Strips & Poutine','Tender chicken strips with fries, cheese curds, and homemade gravy.',1375,5),
('Meals',2,'Poutine — Small','Crispy fries smothered in cheese curds and homemade gravy. Ketchup available.',675,6),
('Meals',2,'Poutine — Regular','Crispy fries smothered in cheese curds and homemade gravy. Ketchup available.',1050,7),
('Meals',2,'Donair Poutine','Crispy fries, donair meat, cheese curds, fresh tomatoes, onions, homemade gravy, and our sweet and garlic sauces.',1175,8),
('Meals',2,'Ukrainian Poutine','Crispy fries, perogies, bacon, fresh green onions, cheese curds, homemade gravy, and a dollop of sour cream.',1175,9),
('Meals',2,'Hot Hamburger Sandwich','A homemade burger served on toasted Texas toast, smothered in homemade gravy and fried onions. Yum!',975,10),
('Meals',2,'Chicken Poutine','Crispy fries, chicken, cheese curds, and homemade gravy.',1175,11),
('Meals',2,'Pulled Pork Poutine','Crispy fries, slow-cooked pulled pork, cheese curds, homemade gravy, and green onions.',1175,12),
('Meals',2,'Taco in a Bag','Taco beef, fresh lettuce, tomatoes, and seasoned corn chips topped with salsa and sour cream.',875,13),
('Meals',2,'Wings','1 lb+ of real meat! Available in Salt & Pepper, Mild/Spicy, Barbecue, Teriyaki, Honey & Garlic, or Garlic Parmesan (add your flavour in special instructions). Served with ranch dipping sauce and fresh carrot garnish.',1475,14),
('Salads',3,'Caesar Salad with Garlic Toast','Romaine lettuce, bacon bits, Parmesan cheese, croutons, and our house Caesar dressing.',1000,1),
('Salads',3,'Caesar Salad with Garlic Toast — with Chicken','Romaine lettuce, bacon bits, Parmesan cheese, croutons, and our house Caesar dressing, with chicken.',1200,2),
('Salads',3,'Garden Salad','Iceberg lettuce, tomato, cucumber, onion, and carrot. Choice of mayo, Miracle Whip, or Italian dressing.',1000,3),
('Salads',3,'Garden Salad — with Chicken','Iceberg lettuce, tomato, cucumber, onion, and carrot, with chicken. Choice of mayo, Miracle Whip, or Italian dressing.',1200,4),
('Salads',3,'Donair Salad','Iceberg lettuce, tomatoes, onions, olives, pickles, donair meat, and cheese with sweet and garlic dressing. Customize it by adding or removing any item you wish.',1175,5),
('Homemade Burgers',4,'Hamburger','Toasted bun, delicious burger, tomato, lettuce, onion, pickles, mustard, relish, and ketchup. You choose what you like!',900,1),
('Homemade Burgers',4,'Hot Hamburger Sandwich','Homemade burger served on toasted Texas toast, smothered in gravy and fried onions. Yum!',995,2),
('Homemade Burgers',4,'Donair Burger','Homemade burger, donair meat, cheese, onion, lettuce, tomato, pickle, and sweet and garlic sauce.',1375,3),
('Homemade Burgers',4,'Mushroom Burger','Homemade burger with lettuce, tomato, onion, fresh sautéed mushrooms, and homemade mushroom sauce.',1175,4),
('Homemade Burgers',4,'Chicken Burger','Chicken on a toasted bun with lettuce, tomato, onion, and mayo. Add pineapple for a sweet twist.',1075,5),
('Homemade Burgers',4,'The Big Perfect Game Burger','Two homemade patties, onion rings, fried egg, pickles, lettuce, tomato, cheese sticks, and our special gutter sauce — all on a fresh toasted bun.',1575,6),
('Homemade Burgers',4,'Extra Burger Patty','Each',450,7),
('Sandwiches',5,'BLT Sandwich','Four slices of crispy bacon, fresh tomatoes, lettuce, and mayo on toasted Texas bread.',675,1),
('Sandwiches',5,'Grilled Cheese Sandwich','Two types of cheese grilled between two pieces of Texas bread, just like Mom made!',675,2),
('Sandwiches',5,'Breakfast Egger','Good any time of day! Bacon, egg, tomatoes, lettuce, onions, and mayo on a toasted brioche bun.',675,3),
('Add-Ons',6,'Add gravy to fries',NULL,200,1),
('Add-Ons',6,'Extra chicken strip',NULL,350,2),
('Add-Ons',6,'Exchange fries for onion rings',NULL,200,3),
('Add-Ons',6,'Extra donair meat (Donair Poutine)',NULL,200,4),
('Add-Ons',6,'Add cheese to Hamburger',NULL,200,5),
('Add-Ons',6,'Add bacon to Hamburger',NULL,200,6),
('Add-Ons',6,'Add cheese to BLT',NULL,200,7),
('Add-Ons',6,'Add bacon, onions, or pickles to Grilled Cheese',NULL,200,8);