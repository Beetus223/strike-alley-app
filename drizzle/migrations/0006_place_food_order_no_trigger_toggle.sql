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

  FOR it IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    BEGIN q := (it->>'quantity')::integer; EXCEPTION WHEN others THEN RAISE EXCEPTION 'Invalid quantity'; END;
    IF q IS NULL OR q < 1 OR q > 50 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    BEGIN
      SELECT * INTO mi FROM public.menu_items WHERE id = (it->>'menu_item_id')::uuid;
    EXCEPTION WHEN others THEN RAISE EXCEPTION 'An item in your cart is no longer on the menu'; END;
    IF NOT FOUND OR mi.is_archived THEN RAISE EXCEPTION 'An item in your cart is no longer on the menu'; END IF;
    IF NOT mi.is_available THEN RAISE EXCEPTION '% is currently unavailable', mi.name; END IF;
    v_sub := v_sub + mi.price_cents * q;
  END LOOP;

  INSERT INTO public.food_orders (idempotency_key, customer_name, phone, fulfillment, street_address, city, postal_code, delivery_instructions, special_instructions, subtotal_cents, delivery_fee_cents, total_cents, is_test)
  VALUES (v_key, v_name, v_phone, v_ful, v_street, v_city, v_postal, v_dinst, v_sinst, v_sub, v_fee, v_sub + v_fee, coalesce((payload->>'is_test')::boolean, false))
  RETURNING id, order_number, public_token INTO v_order_id, v_num, v_token;

  FOR it IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    SELECT * INTO mi FROM public.menu_items WHERE id = (it->>'menu_item_id')::uuid;
    q := (it->>'quantity')::integer;
    INSERT INTO public.food_order_items (order_id, menu_item_id, name, unit_price_cents, quantity, line_total_cents)
    VALUES (v_order_id, mi.id, mi.name, mi.price_cents, q, mi.price_cents * q);
  END LOOP;

  RETURN jsonb_build_object('order_number', v_num, 'token', v_token, 'total_cents', v_sub + v_fee);
END $$;