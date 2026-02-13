-- PostgreSQL function to cancel booking (called via RPC - avoids Edge Function CORS)
-- This function deletes the booking and returns success/error
-- WhatsApp notification is handled separately via Edge Function (admin can trigger)

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
  v_booking_id INTEGER;
  v_booking_name TEXT;
  v_booking_phone TEXT;
  v_result JSON;
BEGIN
  -- Normalize phone (remove non-digits, add 91 if needed)
  p_phone := REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
  IF LENGTH(p_phone) = 10 THEN
    p_phone := '91' || p_phone;
  END IF;

  -- Find matching booking
  SELECT id, name, phone INTO v_booking_id, v_booking_name, v_booking_phone
  FROM bookings
  WHERE preferred_date = p_preferred_date
    AND preferred_time = p_preferred_time
    AND (
      REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = p_phone
      OR phone = p_phone
    )
  LIMIT 1;

  -- Check if booking found
  IF v_booking_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No appointment found with this phone number, date and time. Please check details or contact us on WhatsApp.'
    );
  END IF;

  -- Delete the booking
  DELETE FROM bookings WHERE id = v_booking_id;

  -- Return success with booking details (for WhatsApp notification)
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

-- Note: After calling this function, you can optionally call the send-whatsapp Edge Function
-- from admin panel or via a trigger, but for simplicity, we'll handle WhatsApp separately
