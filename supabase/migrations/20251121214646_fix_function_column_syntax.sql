-- Fix the church creation function - cannot use table qualifiers in SET and RETURNING clauses

CREATE OR REPLACE FUNCTION create_church_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_zip_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  church_id UUID,
  church_name TEXT,
  church_slug TEXT,
  invite_code TEXT
) AS $$
DECLARE
  v_church_id UUID;
  v_invite_code TEXT;
  v_user_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();

  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has a church (qualify columns in WHERE clause)
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = v_user_id
    AND profiles.church_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'User already belongs to a church';
  END IF;

  -- Generate unique invite code
  v_invite_code := generate_unique_invite_code();

  -- Insert the new church (no table qualifiers in column list or RETURNING)
  INSERT INTO public.churches (
    name, slug, email, phone, address, city, state, zip_code,
    invite_code, invite_code_generated_at
  )
  VALUES (
    p_name, p_slug, p_email, p_phone, p_address, p_city, p_state, p_zip_code,
    v_invite_code, NOW()
  )
  RETURNING id INTO v_church_id;

  -- Update the user's profile (no table qualifiers in SET clause)
  UPDATE public.profiles
  SET
    church_id = v_church_id,
    role = 'owner'
  WHERE profiles.id = v_user_id;

  -- Return the church details
  RETURN QUERY
  SELECT v_church_id, p_name, p_slug, v_invite_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION create_church_with_owner TO authenticated;

COMMENT ON FUNCTION create_church_with_owner IS 'Creates a new church and assigns the calling user as owner. Uses SECURITY DEFINER to bypass RLS restrictions during creation.';
