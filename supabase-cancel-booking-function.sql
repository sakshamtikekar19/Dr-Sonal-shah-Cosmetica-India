-- PostgreSQL function to cancel booking (called via RPC - avoids Edge Function CORS)
-- Run this in Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION cancel_booking(
  p_phone TEXT,
  p_preferred_date DATE,
  p_preferred_time TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_booking_name TEXT;
  v_booking_phone TEXT;
  v_count INTEGER;
  v_input_normalized TEXT;
  v_input_with_91 TEXT;
  v_input_without_91 TEXT;
BEGIN
  -- Normalize input phone: remove all non-digits
  v_input_normalized := REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
  
  -- Create versions with and without country code 91
  IF LENGTH(v_input_normalized) = 10 THEN
    v_input_with_91 := '91' || v_input_normalized;
    v_input_without_91 := v_input_normalized;
  ELSIF LENGTH(v_input_normalized) >= 11 AND SUBSTRING(v_input_normalized FROM 1 FOR 2) = '91' THEN
    v_input_with_91 := v_input_normalized;
    v_input_without_91 := SUBSTRING(v_input_normalized FROM 3);
  ELSE
    v_input_with_91 := v_input_normalized;
    v_input_without_91 := v_input_normalized;
  END IF;

  -- Find matching booking by comparing normalized phone numbers
  SELECT id, name, phone INTO v_booking_id, v_booking_name, v_booking_phone
  FROM bookings
  WHERE preferred_date = p_preferred_date
    AND preferred_time = p_preferred_time
    AND (
      REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = v_input_with_91
      OR REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = v_input_without_91
      OR phone = p_phone
    )
  LIMIT 1;

  -- If no booking found, provide helpful error message
  IF v_booking_id IS NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM bookings
    WHERE preferred_date = p_preferred_date
      AND preferred_time = p_preferred_time;
    
    IF v_count > 0 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'No appointment found with this phone number for the selected date and time. Found ' || v_count || ' booking(s) for this slot, but phone numbers do not match. Please check your phone number (try with/without spaces, with/without +91). Or cancel via WhatsApp/call +91 98704 39934.'
      );
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'No appointment found for the selected date and time. Please check the date and time slot, or cancel via WhatsApp/call +91 98704 39934.'
      );
    END IF;
  END IF;

  -- Delete the booking
  DELETE FROM bookings WHERE id = v_booking_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Your appointment has been cancelled. You will receive a WhatsApp confirmation shortly.',
    'booking', json_build_object(
      'id', v_booking_id,
      'name', v_booking_name,
      'phone', v_booking_phone,
      'preferred_date', p_preferred_date,
      'preferred_time', p_preferred_time
    )
  );
END;
$$;

-- Grant execute permission to anon role (so browser can call it)
GRANT EXECUTE ON FUNCTION cancel_booking(TEXT, DATE, TEXT) TO anon;
