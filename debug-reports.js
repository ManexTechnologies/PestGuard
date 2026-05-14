import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugReports() {
  console.log('Starting debug...\n')
  
  // Check auth
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) {
    console.log('Auth error:', userError)
    return
  }
  
  console.log('Current user:', user?.email)
  console.log('User ID:', user?.id)
  console.log('---')
  
  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
  
  console.log('Total reports in DB:', totalCount)
  if (countError) console.log('Count error:', countError)
  console.log('---')
  
  // Get user reports
  const { data: userReports, count: userCount, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', user?.id)
  
  console.log('Your reports count:', userCount)
  console.log('Your reports:', userReports)
  if (reportsError) console.log('Reports error:', reportsError)
  console.log('---')
  
  // Check all reports
  const { data: allReports, error: allError } = await supabase
    .from('reports')
    .select('id, pest_name, user_id, created_at')
    .limit(10)
  
  console.log('Sample of 10 reports from DB:')
  console.table(allReports)
  if (allError) console.log('Error fetching all reports:', allError)
}

debugReports().catch(console.error)
