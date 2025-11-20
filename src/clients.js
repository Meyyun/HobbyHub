import { createClient } from '@supabase/supabase-js'

const URL = 'https://qbvidzuowacpkfnsevht.supabase.co'
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFidmlkenVvd2FjcGtmbnNldmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDEyMTksImV4cCI6MjA3ODgxNzIxOX0.pu_F8bbDFNL2AqEebRYh-C5mBoIQyxv1WiS-h_D_72w'

export const supabase = createClient(URL, API_KEY)