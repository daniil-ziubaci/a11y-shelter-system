set check_function_bodies = false;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "postgres", "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "postgres", "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "postgres", "anon", "authenticated", "service_role";

CREATE OR REPLACE FUNCTION "public"."pets_set_status_changed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.status_changed_at := now();
  return new;
end;
$$;

ALTER FUNCTION "public"."pets_set_status_changed_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."projects_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;

ALTER FUNCTION "public"."projects_set_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."receive_purchase"("p_item_id" "uuid", "p_amount" numeric) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_shelter_id uuid;
  v_remaining numeric;
begin
  if p_amount is null or p_amount <= 0 or p_amount > 100000 then
    raise exception 'invalid amount' using errcode = '22023';
  end if;

  update public.purchase_items as i
  set remaining = i.remaining - p_amount
  where i.id = p_item_id
    and (select auth.jwt()->>'aal') = 'aal2'
    and exists (
      select 1
      from public.shelter_members as m
      where m.user_id = (select auth.uid())
        and m.shelter_id = i.shelter_id
    )
  returning i.shelter_id, i.remaining into v_shelter_id, v_remaining;

  if not found then
    raise exception 'item not found' using errcode = 'P0002';
  end if;

  insert into public.purchase_log (shelter_id, item_id, amount)
  values (v_shelter_id, p_item_id, p_amount);

  return v_remaining;
end;
$$;

ALTER FUNCTION "public"."receive_purchase"("p_item_id" "uuid", "p_amount" numeric) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."record_consumption"("p_item_id" "uuid", "p_amount" numeric) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_remaining numeric;
begin
  if p_amount is null or p_amount <= 0 or p_amount > 100000 then
    raise exception 'invalid amount' using errcode = '22023';
  end if;

  update public.purchase_items as i
  set remaining = i.remaining + p_amount,
      is_urgent = i.is_urgent and i.remaining > 0,
      is_archived = false
  where i.id = p_item_id
    and (select auth.jwt()->>'aal') = 'aal2'
    and exists (
      select 1
      from public.shelter_members as m
      where m.user_id = (select auth.uid())
        and m.shelter_id = i.shelter_id
    )
  returning i.remaining into v_remaining;

  if not found then
    raise exception 'item not found' using errcode = 'P0002';
  end if;

  return v_remaining;
end;
$$;

ALTER FUNCTION "public"."record_consumption"("p_item_id" "uuid", "p_amount" numeric) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_needs_treatment_since"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.status in ('пристроен', 'снят с учёта') then
    new.needs_treatment_since := null;
    return new;
  end if;

  if new.needs_treatment_since is null then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.needs_treatment_since is not null then
      new.needs_treatment_since := old.needs_treatment_since;
      return new;
    end if;
  end if;

  new.needs_treatment_since := now();
  return new;
end;
$$;

ALTER FUNCTION "public"."set_needs_treatment_since"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_project_completed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.status <> 'завершён' then
    new.completed_at := null;
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'завершён' and old.completed_at is not null then
    new.completed_at := old.completed_at;
    return new;
  end if;

  new.completed_at := now();
  return new;
end;
$$;

ALTER FUNCTION "public"."set_project_completed_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."translit_ru"("input" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    SET "search_path" TO ''
    AS $$
  select coalesce(string_agg(coalesce(m.latin, c.letter), '' order by c.idx), '')
  from regexp_split_to_table(
    lower(translate(
      input,
      'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
      'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
    )),
    ''
  ) with ordinality as c(letter, idx)
  left join (
    values
      ('а', 'a'), ('б', 'b'), ('в', 'v'), ('г', 'g'), ('д', 'd'), ('е', 'e'),
      ('ё', 'yo'), ('ж', 'zh'), ('з', 'z'), ('и', 'i'), ('й', 'y'), ('к', 'k'),
      ('л', 'l'), ('м', 'm'), ('н', 'n'), ('о', 'o'), ('п', 'p'), ('р', 'r'),
      ('с', 's'), ('т', 't'), ('у', 'u'), ('ф', 'f'), ('х', 'kh'), ('ц', 'ts'),
      ('ч', 'ch'), ('ш', 'sh'), ('щ', 'shch'), ('ъ', ''), ('ы', 'y'), ('ь', ''),
      ('э', 'e'), ('ю', 'yu'), ('я', 'ya')
  ) as m(cyrillic, latin) on m.cyrillic = c.letter
$$;

ALTER FUNCTION "public"."translit_ru"("input" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."undo_purchase"("p_log_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_log public.purchase_log;
  v_latest uuid;
  v_remaining numeric;
begin
  select l.* into v_log
  from public.purchase_log as l
  where l.id = p_log_id
    and (select auth.jwt()->>'aal') = 'aal2'
    and exists (
      select 1
      from public.shelter_members as m
      where m.user_id = (select auth.uid())
        and m.shelter_id = l.shelter_id
    )
  for update;

  if not found then
    raise exception 'log entry not found' using errcode = 'P0002';
  end if;

  select l.id into v_latest
  from public.purchase_log as l
  where l.shelter_id = v_log.shelter_id
  order by l.created_at desc, l.id desc
  limit 1;

  if v_latest <> p_log_id or v_log.created_at < now() - interval '10 minutes' then
    raise exception 'log entry is not the latest or too old' using errcode = 'P0001';
  end if;

  update public.purchase_items as i
  set remaining = i.remaining + v_log.amount
  where i.id = v_log.item_id
  returning i.remaining into v_remaining;

  delete from public.purchase_log where id = p_log_id;

  return v_remaining;
end;
$$;

ALTER FUNCTION "public"."undo_purchase"("p_log_id" "uuid") OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."pet_internal" (
    "pet_id" "uuid" NOT NULL,
    "enclosure" "text" NOT NULL,
    CONSTRAINT "pet_internal_enclosure_check" CHECK ((("char_length"("enclosure") >= 1) AND ("char_length"("enclosure") <= 40) AND ("enclosure" = "btrim"("enclosure"))))
);

ALTER TABLE "public"."pet_internal" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."pets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shelter_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "species" "text" NOT NULL,
    "sex" "text" NOT NULL,
    "birth_date" "date" NOT NULL,
    "is_age_approximate" boolean NOT NULL,
    "health" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'ищет дом'::"text" NOT NULL,
    "photo_url" "text" NOT NULL,
    "photo_alt" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "needs_treatment_since" timestamp with time zone,
    "size" "text",
    "status_changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status_rank" smallint GENERATED ALWAYS AS (
CASE "status"
    WHEN 'ищет дом'::"text" THEN 0
    WHEN 'в процессе'::"text" THEN 1
    WHEN 'на лечении'::"text" THEN 2
    ELSE 3
END) STORED,
    "translations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "name_search" "text" GENERATED ALWAYS AS ((("name" || '|'::"text") || "public"."translit_ru"("name"))) STORED,
    CONSTRAINT "pets_sex_check" CHECK (("sex" = ANY (ARRAY['мальчик'::"text", 'девочка'::"text"]))),
    CONSTRAINT "pets_size_only_dogs" CHECK ((("size" IS NULL) OR ("species" = 'собака'::"text"))),
    CONSTRAINT "pets_dog_size_required" CHECK ((("species" <> 'собака'::"text") OR ("size" IS NOT NULL))),
    CONSTRAINT "pets_size_values" CHECK (("size" = ANY (ARRAY['мелкая'::"text", 'средняя'::"text", 'крупная'::"text"]))),
    CONSTRAINT "pets_species_check" CHECK (("species" = ANY (ARRAY['собака'::"text", 'кошка'::"text"]))),
    CONSTRAINT "pets_status_check" CHECK (("status" = ANY (ARRAY['ищет дом'::"text", 'в процессе'::"text", 'на лечении'::"text", 'пристроен'::"text", 'снят с учёта'::"text"]))),
    CONSTRAINT "pets_translations_check" CHECK ((("jsonb_typeof"("translations") = 'object'::"text") AND ("octet_length"(("translations")::"text") <= 20000)))
);

ALTER TABLE "public"."pets" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shelter_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'идёт'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_pinned" boolean DEFAULT false NOT NULL,
    "help_kinds" "text"[] DEFAULT ARRAY['money'::"text"] NOT NULL,
    "photo_path" "text",
    "photo_alt" "text",
    "progress_total" integer,
    "progress_done" integer,
    "progress_unit" "text",
    "translations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    CONSTRAINT "projects_description_check" CHECK ((("length"("btrim"("description")) > 0) AND ("length"("description") <= 1000))),
    CONSTRAINT "projects_help_kinds_valid" CHECK ((("cardinality"("help_kinds") >= 1) AND ("help_kinds" <@ ARRAY['things'::"text", 'money'::"text"]))),
    CONSTRAINT "projects_photo_valid" CHECK (((("photo_path" IS NULL) AND ("photo_alt" IS NULL)) OR (("photo_path" IS NOT NULL) AND ("photo_alt" IS NOT NULL) AND (("char_length"("btrim"("photo_path")) >= 1) AND ("char_length"("btrim"("photo_path")) <= 300)) AND (("char_length"("btrim"("photo_alt")) >= 1) AND ("char_length"("btrim"("photo_alt")) <= 200))))),
    CONSTRAINT "projects_progress_valid" CHECK (((("progress_total" IS NULL) AND ("progress_done" IS NULL) AND ("progress_unit" IS NULL)) OR (("progress_total" IS NOT NULL) AND ("progress_done" IS NOT NULL) AND ("progress_unit" IS NOT NULL) AND (("progress_total" >= 1) AND ("progress_total" <= 1000)) AND (("progress_done" >= 0) AND ("progress_done" <= "progress_total")) AND (("char_length"("btrim"("progress_unit")) >= 1) AND ("char_length"("btrim"("progress_unit")) <= 30))))),
    CONSTRAINT "projects_status_check" CHECK (("status" = ANY (ARRAY['идёт'::"text", 'завершён'::"text"]))),
    CONSTRAINT "projects_title_check" CHECK ((("length"("btrim"("title")) > 0) AND ("length"("title") <= 120))),
    CONSTRAINT "projects_translations_check" CHECK ((("jsonb_typeof"("translations") = 'object'::"text") AND ("octet_length"(("translations")::"text") <= 20000)))
);

ALTER TABLE "public"."projects" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."purchase_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shelter_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "unit" "text" NOT NULL,
    "remaining" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_urgent" boolean DEFAULT false NOT NULL,
    "translations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    CONSTRAINT "purchase_items_archived_only_when_closed" CHECK (((NOT "is_archived") OR ("remaining" = (0)::numeric))),
    CONSTRAINT "purchase_items_category_check" CHECK (("category" = ANY (ARRAY['корм'::"text", 'лекарства'::"text", 'гигиена'::"text", 'дезинфекция'::"text", 'расходники'::"text"]))),
    CONSTRAINT "purchase_items_name_check" CHECK (("length"("btrim"("name")) > 0)),
    CONSTRAINT "purchase_items_translations_check" CHECK ((("jsonb_typeof"("translations") = 'object'::"text") AND ("octet_length"(("translations")::"text") <= 20000))),
    CONSTRAINT "purchase_items_unit_check" CHECK (("length"("btrim"("unit")) > 0))
);

ALTER TABLE "public"."purchase_items" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."purchase_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shelter_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    CONSTRAINT "purchase_log_amount_check" CHECK (("amount" > (0)::numeric))
);

ALTER TABLE "public"."purchase_log" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."shelter_members" (
    "shelter_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);

ALTER TABLE "public"."shelter_members" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."shelters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "contact_phone" "text",
    "contact_messenger" "text",
    "city" "text",
    "address" "text",
    "contact_hours" "text",
    "about" "text",
    "founded_year" integer,
    "legal_info" "text",
    "adoption_info" "text",
    "photo_path" "text",
    "photo_alt" "text",
    "instagram_url" "text",
    "viber_url" "text",
    "telegram_url" "text",
    "content_language" "text" DEFAULT 'ru'::"text" NOT NULL,
    "translations" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "shelters_about_length" CHECK (("char_length"("about") <= 1000)),
    CONSTRAINT "shelters_adoption_info_length" CHECK (("char_length"("adoption_info") <= 1000)),
    CONSTRAINT "shelters_contact_messenger_https" CHECK (("contact_messenger" ~ '^https://'::"text")),
    CONSTRAINT "shelters_contact_phone_format" CHECK (("contact_phone" ~ '^\+?[0-9 ()-]{5,20}$'::"text")),
    CONSTRAINT "shelters_content_language_check" CHECK (("content_language" = ANY (ARRAY['ru'::"text", 'ro'::"text", 'en'::"text"]))),
    CONSTRAINT "shelters_founded_year_range" CHECK ((("founded_year" >= 1800) AND ("founded_year" <= 2100))),
    CONSTRAINT "shelters_instagram_url_check" CHECK ((("instagram_url" ~ '^https://'::"text") AND ("char_length"("instagram_url") <= 300))),
    CONSTRAINT "shelters_photo_alt_length" CHECK ((("char_length"("photo_alt") >= 1) AND ("char_length"("photo_alt") <= 300))),
    CONSTRAINT "shelters_photo_alt_required" CHECK ((("photo_path" IS NULL) OR ("photo_alt" IS NOT NULL))),
    CONSTRAINT "shelters_photo_path_length" CHECK ((("char_length"("photo_path") >= 1) AND ("char_length"("photo_path") <= 300))),
    CONSTRAINT "shelters_profile_text_length" CHECK ((("char_length"("city") <= 100) AND ("char_length"("address") <= 200) AND ("char_length"("contact_hours") <= 200) AND ("char_length"("legal_info") <= 500) AND ("char_length"("contact_messenger") <= 300))),
    CONSTRAINT "shelters_telegram_url_check" CHECK ((("telegram_url" ~ '^https://'::"text") AND ("char_length"("telegram_url") <= 300))),
    CONSTRAINT "shelters_translations_check" CHECK ((("jsonb_typeof"("translations") = 'object'::"text") AND ("octet_length"(("translations")::"text") <= 20000))),
    CONSTRAINT "shelters_viber_url_check" CHECK ((("viber_url" ~ '^https://'::"text") AND ("char_length"("viber_url") <= 300)))
);

ALTER TABLE "public"."shelters" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."volunteer_pets" WITH ("security_invoker"='true') AS
 SELECT "pets"."id",
    "pets"."shelter_id",
    "pets"."name",
    "pets"."status",
    "pets"."status_changed_at",
    "pets"."needs_treatment_since",
    "pets"."photo_url",
    "pets"."birth_date",
    "pets"."is_age_approximate",
    "pets"."sex",
    "pets"."species",
    "pets"."size",
    "pets"."created_at",
    "pet_internal"."enclosure",
    "concat_ws"(' '::"text", "pets"."name_search", "pet_internal"."enclosure") AS "search_text",
    LEAST(
        CASE
            WHEN ("pets"."status" = ANY (ARRAY['в процессе'::"text", 'на лечении'::"text"])) THEN "pets"."status_changed_at"
            ELSE NULL::timestamp with time zone
        END, "pets"."needs_treatment_since") AS "review_since",
        CASE
            WHEN (("pets"."status" = 'на лечении'::"text") OR ("pets"."needs_treatment_since" IS NOT NULL)) THEN 0
            ELSE 1
        END AS "review_rank"
   FROM ("public"."pets"
     LEFT JOIN "public"."pet_internal" ON (("pet_internal"."pet_id" = "pets"."id")));

ALTER VIEW "public"."volunteer_pets" OWNER TO "postgres";

ALTER TABLE ONLY "public"."pet_internal"
    ADD CONSTRAINT "pet_internal_pkey" PRIMARY KEY ("pet_id");

ALTER TABLE ONLY "public"."pets"
    ADD CONSTRAINT "pets_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."purchase_log"
    ADD CONSTRAINT "purchase_log_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."shelter_members"
    ADD CONSTRAINT "shelter_members_pkey" PRIMARY KEY ("user_id", "shelter_id");

ALTER TABLE ONLY "public"."shelters"
    ADD CONSTRAINT "shelters_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."shelters"
    ADD CONSTRAINT "shelters_slug_key" UNIQUE ("slug");

CREATE INDEX "pets_catalog_order_idx" ON "public"."pets" USING "btree" ("shelter_id", "status_rank", "created_at" DESC, "name");

CREATE INDEX "projects_shelter_id_idx" ON "public"."projects" USING "btree" ("shelter_id");

CREATE INDEX "purchase_items_shelter_id_idx" ON "public"."purchase_items" USING "btree" ("shelter_id");

CREATE INDEX "purchase_log_shelter_id_created_at_idx" ON "public"."purchase_log" USING "btree" ("shelter_id", "created_at" DESC);

CREATE OR REPLACE TRIGGER "pets_set_needs_treatment_since" BEFORE INSERT OR UPDATE ON "public"."pets" FOR EACH ROW EXECUTE FUNCTION "public"."set_needs_treatment_since"();

CREATE OR REPLACE TRIGGER "pets_set_status_changed_at" BEFORE UPDATE OF "status" ON "public"."pets" FOR EACH ROW EXECUTE FUNCTION "public"."pets_set_status_changed_at"();

CREATE OR REPLACE TRIGGER "projects_set_completed_at" BEFORE INSERT OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_project_completed_at"();

CREATE OR REPLACE TRIGGER "projects_set_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."projects_set_updated_at"();


ALTER TABLE ONLY "public"."pet_internal"
    ADD CONSTRAINT "pet_internal_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pets"
    ADD CONSTRAINT "pets_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "public"."shelters"("id");

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "public"."shelters"("id");

ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "public"."shelters"("id");

ALTER TABLE ONLY "public"."purchase_log"
    ADD CONSTRAINT "purchase_log_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."purchase_items"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."purchase_log"
    ADD CONSTRAINT "purchase_log_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "public"."shelters"("id");

ALTER TABLE ONLY "public"."shelter_members"
    ADD CONSTRAINT "shelter_members_shelter_id_fkey" FOREIGN KEY ("shelter_id") REFERENCES "public"."shelters"("id");

ALTER TABLE ONLY "public"."shelter_members"
    ADD CONSTRAINT "shelter_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE POLICY "Anyone can read active projects" ON "public"."projects" FOR SELECT TO "authenticated", "anon" USING ((NOT "is_archived"));

CREATE POLICY "Anyone can read open needs" ON "public"."purchase_items" FOR SELECT TO "authenticated", "anon" USING (("remaining" > (0)::numeric));

CREATE POLICY "Anyone can read pets" ON "public"."pets" FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "Anyone can read shelters" ON "public"."shelters" FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "Item inserts require second factor" ON "public"."purchase_items" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'aal'::"text")) = 'aal2'::"text"));

CREATE POLICY "Item updates require second factor" ON "public"."purchase_items" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'aal'::"text")) = 'aal2'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'aal'::"text")) = 'aal2'::"text"));

CREATE POLICY "Members can add enclosures to their shelter" ON "public"."pet_internal" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."pets"
     JOIN "public"."shelter_members" ON (("shelter_members"."shelter_id" = "pets"."shelter_id")))
  WHERE (("pets"."id" = "pet_internal"."pet_id") AND ("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));

CREATE POLICY "Members can add items to their shelter" ON "public"."purchase_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "purchase_items"."shelter_id")))));

CREATE POLICY "Members can add pets to their shelter" ON "public"."pets" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "pets"."shelter_id")))));

CREATE POLICY "Members can add projects to their shelter" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "projects"."shelter_id")))));

CREATE POLICY "Members can delete enclosures of their shelter" ON "public"."pet_internal" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."pets"
     JOIN "public"."shelter_members" ON (("shelter_members"."shelter_id" = "pets"."shelter_id")))
  WHERE (("pets"."id" = "pet_internal"."pet_id") AND ("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));

CREATE POLICY "Members can read all items of their shelter" ON "public"."purchase_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "purchase_items"."shelter_id")))));

CREATE POLICY "Members can read all projects of their shelter" ON "public"."projects" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "projects"."shelter_id")))));

CREATE POLICY "Members can read enclosures of their shelter" ON "public"."pet_internal" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."pets"
     JOIN "public"."shelter_members" ON (("shelter_members"."shelter_id" = "pets"."shelter_id")))
  WHERE (("pets"."id" = "pet_internal"."pet_id") AND ("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));

CREATE POLICY "Members can read purchase log of their shelter" ON "public"."purchase_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "purchase_log"."shelter_id")))));

CREATE POLICY "Members can read their own memberships" ON "public"."shelter_members" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Members can update enclosures of their shelter" ON "public"."pet_internal" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."pets"
     JOIN "public"."shelter_members" ON (("shelter_members"."shelter_id" = "pets"."shelter_id")))
  WHERE (("pets"."id" = "pet_internal"."pet_id") AND ("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."pets"
     JOIN "public"."shelter_members" ON (("shelter_members"."shelter_id" = "pets"."shelter_id")))
  WHERE (("pets"."id" = "pet_internal"."pet_id") AND ("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));

CREATE POLICY "Members can update items of their shelter" ON "public"."purchase_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "purchase_items"."shelter_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "purchase_items"."shelter_id")))));

CREATE POLICY "Members can update pets of their shelter" ON "public"."pets" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "pets"."shelter_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "pets"."shelter_id")))));

CREATE POLICY "Members can update projects of their shelter" ON "public"."projects" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "projects"."shelter_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."shelter_members"
  WHERE (("shelter_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("shelter_members"."shelter_id" = "projects"."shelter_id")))));

CREATE POLICY "Pet inserts require second factor" ON "public"."pets" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'aal'::"text")) = 'aal2'::"text"));

CREATE POLICY "Pet updates require second factor" ON "public"."pets" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'aal'::"text")) = 'aal2'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'aal'::"text")) = 'aal2'::"text"));

CREATE POLICY "Project inserts require second factor" ON "public"."projects" AS RESTRICTIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'aal'::"text")) = 'aal2'::"text"));

CREATE POLICY "Project updates require second factor" ON "public"."projects" AS RESTRICTIVE FOR UPDATE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'aal'::"text")) = 'aal2'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'aal'::"text")) = 'aal2'::"text"));

ALTER TABLE "public"."pet_internal" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."pets" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."purchase_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."purchase_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."shelter_members" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."shelters" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

REVOKE ALL ON FUNCTION "public"."pets_set_status_changed_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."pets_set_status_changed_at"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."projects_set_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."projects_set_updated_at"() TO "service_role";


REVOKE ALL ON FUNCTION "public"."receive_purchase"("p_item_id" "uuid", "p_amount" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."receive_purchase"("p_item_id" "uuid", "p_amount" numeric) TO "service_role";
GRANT ALL ON FUNCTION "public"."receive_purchase"("p_item_id" "uuid", "p_amount" numeric) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."record_consumption"("p_item_id" "uuid", "p_amount" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_consumption"("p_item_id" "uuid", "p_amount" numeric) TO "service_role";
GRANT ALL ON FUNCTION "public"."record_consumption"("p_item_id" "uuid", "p_amount" numeric) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."set_needs_treatment_since"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_needs_treatment_since"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."set_project_completed_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_project_completed_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."translit_ru"("input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translit_ru"("input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translit_ru"("input" "text") TO "service_role";

REVOKE ALL ON FUNCTION "public"."undo_purchase"("p_log_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."undo_purchase"("p_log_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."undo_purchase"("p_log_id" "uuid") TO "authenticated";

GRANT ALL ON TABLE "public"."pet_internal" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."pet_internal" TO "authenticated";

GRANT ALL ON TABLE "public"."pets" TO "service_role";
GRANT SELECT ON TABLE "public"."pets" TO "anon";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."pets" TO "authenticated";

GRANT ALL ON TABLE "public"."projects" TO "service_role";
GRANT SELECT ON TABLE "public"."projects" TO "anon";
GRANT SELECT ON TABLE "public"."projects" TO "authenticated";

GRANT INSERT("shelter_id") ON TABLE "public"."projects" TO "authenticated";

GRANT INSERT("title"),UPDATE("title") ON TABLE "public"."projects" TO "authenticated";

GRANT INSERT("description"),UPDATE("description") ON TABLE "public"."projects" TO "authenticated";

GRANT INSERT("status"),UPDATE("status") ON TABLE "public"."projects" TO "authenticated";

GRANT SELECT("help_kinds") ON TABLE "public"."projects" TO "anon";
GRANT SELECT("help_kinds"),INSERT("help_kinds"),UPDATE("help_kinds") ON TABLE "public"."projects" TO "authenticated";

GRANT SELECT("photo_path") ON TABLE "public"."projects" TO "anon";
GRANT SELECT("photo_path"),INSERT("photo_path"),UPDATE("photo_path") ON TABLE "public"."projects" TO "authenticated";

GRANT SELECT("photo_alt") ON TABLE "public"."projects" TO "anon";
GRANT SELECT("photo_alt"),INSERT("photo_alt"),UPDATE("photo_alt") ON TABLE "public"."projects" TO "authenticated";

GRANT SELECT("progress_total") ON TABLE "public"."projects" TO "anon";
GRANT SELECT("progress_total"),INSERT("progress_total"),UPDATE("progress_total") ON TABLE "public"."projects" TO "authenticated";

GRANT SELECT("progress_done") ON TABLE "public"."projects" TO "anon";
GRANT SELECT("progress_done"),INSERT("progress_done"),UPDATE("progress_done") ON TABLE "public"."projects" TO "authenticated";

GRANT SELECT("progress_unit") ON TABLE "public"."projects" TO "anon";
GRANT SELECT("progress_unit"),INSERT("progress_unit"),UPDATE("progress_unit") ON TABLE "public"."projects" TO "authenticated";

GRANT UPDATE("translations") ON TABLE "public"."projects" TO "authenticated";

GRANT UPDATE("is_archived") ON TABLE "public"."projects" TO "authenticated";

GRANT ALL ON TABLE "public"."purchase_items" TO "service_role";
GRANT SELECT ON TABLE "public"."purchase_items" TO "anon";
GRANT SELECT,INSERT ON TABLE "public"."purchase_items" TO "authenticated";

GRANT UPDATE("name") ON TABLE "public"."purchase_items" TO "authenticated";

GRANT UPDATE("category") ON TABLE "public"."purchase_items" TO "authenticated";

GRANT UPDATE("is_urgent") ON TABLE "public"."purchase_items" TO "authenticated";

GRANT UPDATE("translations") ON TABLE "public"."purchase_items" TO "authenticated";

GRANT UPDATE("is_archived") ON TABLE "public"."purchase_items" TO "authenticated";

GRANT ALL ON TABLE "public"."purchase_log" TO "service_role";
GRANT SELECT ON TABLE "public"."purchase_log" TO "authenticated";

GRANT ALL ON TABLE "public"."shelter_members" TO "service_role";
GRANT SELECT ON TABLE "public"."shelter_members" TO "authenticated";

GRANT ALL ON TABLE "public"."shelters" TO "service_role";
GRANT SELECT ON TABLE "public"."shelters" TO "anon";
GRANT SELECT ON TABLE "public"."shelters" TO "authenticated";

GRANT ALL ON TABLE "public"."volunteer_pets" TO "service_role";
GRANT SELECT ON TABLE "public"."volunteer_pets" TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

reset check_function_bodies;
