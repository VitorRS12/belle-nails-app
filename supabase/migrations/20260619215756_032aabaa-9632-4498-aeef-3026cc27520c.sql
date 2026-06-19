-- customer_profiles: restrict insert/delete to the owner
CREATE POLICY "Users insert their own customer profile"
ON public.customer_profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own customer profile"
ON public.customer_profiles FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- notification_log: deny all writes from authenticated; only service_role (which bypasses RLS) can write
CREATE POLICY "Block direct inserts on notification_log"
ON public.notification_log FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "Block direct updates on notification_log"
ON public.notification_log FOR UPDATE TO authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "Block direct deletes on notification_log"
ON public.notification_log FOR DELETE TO authenticated
USING (false);