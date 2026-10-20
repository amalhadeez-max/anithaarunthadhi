-- ============================================================================
-- 0002: Supabase-specific wiring — auth FK + profile trigger, RLS policies,
--       storage bucket & policies. Prisma (postgres role) bypasses RLS; these
--       policies protect direct PostgREST / Storage access with the anon key.
-- ============================================================================

-- ─── Local dev (plain Postgres, no Supabase): stub auth.uid()/auth.role() so RLS policies compile ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    CREATE SCHEMA auth;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'auth' AND p.proname = 'uid') THEN
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
      AS $f$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'auth' AND p.proname = 'role') THEN
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE
      AS $f$ SELECT nullif(current_setting('request.jwt.claim.role', true), '') $f$;
  END IF;
END $$;

-- ─── profiles.id → auth.users.id ─────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    ALTER TABLE "public"."profiles"
      ADD CONSTRAINT "profiles_id_auth_users_fkey"
      FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─── Helper: is the current JWT user an admin? ───────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ─── Auto-create a profile row on sign-up (Google or email) ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'customer',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ─── Keep products.rating_avg / rating_count in sync with approved reviews ───
CREATE OR REPLACE FUNCTION public.refresh_product_rating()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  pid uuid := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE public.products p
     SET rating_avg   = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews r WHERE r.product_id = pid AND r.status = 'approved'), 0),
         rating_count = (SELECT COUNT(*) FROM public.reviews r WHERE r.product_id = pid AND r.status = 'approved')
   WHERE p.id = pid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS reviews_refresh_rating ON public.reviews;
CREATE TRIGGER reviews_refresh_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

-- ─── Default site settings row ───────────────────────────────────────────────
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_segments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_models         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_variants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_videos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_compat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_images          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings          ENABLE ROW LEVEL SECURITY;

-- profiles: own row read/update; admins read all
CREATE POLICY "profiles_select_own"   ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())); -- cannot self-promote
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE USING (public.is_admin());

-- addresses: owner only (admins read)
CREATE POLICY "addresses_owner" ON public.addresses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "addresses_admin_read" ON public.addresses FOR SELECT USING (public.is_admin());

-- catalogue: public read of active rows; admin-only writes
CREATE POLICY "brands_public_read"   ON public.brands FOR SELECT USING (is_active AND deleted_at IS NULL OR public.is_admin());
CREATE POLICY "brands_admin_write"   ON public.brands FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "brand_segments_public_read" ON public.brand_segments FOR SELECT USING (true);
CREATE POLICY "brand_segments_admin_write" ON public.brand_segments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "vehicle_models_public_read" ON public.vehicle_models FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "vehicle_models_admin_write" ON public.vehicle_models FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "vehicle_variants_public_read" ON public.vehicle_variants FOR SELECT USING (true);
CREATE POLICY "vehicle_variants_admin_write" ON public.vehicle_variants FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (is_active OR public.is_admin());
CREATE POLICY "products_admin_write" ON public.products FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "product_images_public_read" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "product_images_admin_write" ON public.product_images FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "product_videos_public_read" ON public.product_videos FOR SELECT USING (true);
CREATE POLICY "product_videos_admin_write" ON public.product_videos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "compat_public_read" ON public.product_variant_compat FOR SELECT USING (true);
CREATE POLICY "compat_admin_write" ON public.product_variant_compat FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- reviews: approved are public; owners see/edit their own; admins moderate
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY "reviews_owner_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_owner_update" ON public.reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_admin_all"    ON public.reviews FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "review_images_read"  ON public.review_images FOR SELECT USING (true);
CREATE POLICY "review_images_owner" ON public.review_images FOR ALL
  USING (EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_id AND (r.user_id = auth.uid() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_id AND (r.user_id = auth.uid() OR public.is_admin())));

-- wishlists / carts: owner only
CREATE POLICY "wishlists_owner" ON public.wishlists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "carts_owner"     ON public.carts     FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cart_items_owner" ON public.cart_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()));

-- orders: customers read own; writes only via server (Prisma) or admins
CREATE POLICY "orders_owner_read"  ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "orders_admin_write" ON public.orders FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "order_items_owner_read" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())));
CREATE POLICY "order_items_admin_write" ON public.order_items FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "order_history_owner_read" ON public.order_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())));
CREATE POLICY "order_history_admin_write" ON public.order_status_history FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "payments_owner_read" ON public.payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())));
CREATE POLICY "payments_admin_write" ON public.payments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- contact messages: anyone may insert (rate-limited at app layer); admins read/update
CREATE POLICY "contact_insert_any" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_admin"      ON public.contact_messages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- site settings: public read; admin write
CREATE POLICY "settings_public_read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_write" ON public.site_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- Storage: single public bucket "media" with folders brands/, products/, videos/,
-- reviews/, settings/. Admins write anywhere; authenticated users write reviews/.
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('media', 'media', true, 52428800,
            ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','video/webm'])
    ON CONFLICT (id) DO NOTHING;

    DROP POLICY IF EXISTS "media_public_read"    ON storage.objects;
    DROP POLICY IF EXISTS "media_admin_write"    ON storage.objects;
    DROP POLICY IF EXISTS "media_review_uploads" ON storage.objects;

    CREATE POLICY "media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'media');
    CREATE POLICY "media_admin_write" ON storage.objects FOR ALL
      USING (bucket_id = 'media' AND public.is_admin())
      WITH CHECK (bucket_id = 'media' AND public.is_admin());
    CREATE POLICY "media_review_uploads" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = 'reviews');
  END IF;
END $$;
