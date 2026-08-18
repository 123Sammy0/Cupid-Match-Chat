DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING ( public.is_active_user() AND id = auth.uid() )
    WITH CHECK ( public.is_active_user() AND id = auth.uid() );
