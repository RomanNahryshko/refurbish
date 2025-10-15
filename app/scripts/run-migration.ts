/**
 * Script to run the migration that removes duplicate status history trigger
 * 
 * Usage:
 *   pnpm tsx app/scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🔄 Running migration: Remove duplicate status history trigger...\n')

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/remove_duplicate_status_history_trigger.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration SQL:')
    console.log('─'.repeat(80))
    console.log(migrationSQL)
    console.log('─'.repeat(80))
    console.log('')

    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // Try alternative method - direct SQL execution
      const lines = migrationSQL.split('\n').filter(line => 
        line.trim() && !line.trim().startsWith('--')
      )

      for (const line of lines) {
        if (line.trim()) {
          const { error: execError } = await supabase.from('_').select('*').limit(0)
          // Note: This is a workaround. You might need to execute SQL directly via psql
          console.log('⚠️  Cannot execute SQL directly via Supabase client.')
          console.log('📋 Please run the migration manually using one of these methods:')
          console.log('')
          console.log('1. Supabase Dashboard → SQL Editor')
          console.log('2. supabase db execute < migrations/remove_duplicate_status_history_trigger.sql')
          console.log('3. psql <connection-string> -f migrations/remove_duplicate_status_history_trigger.sql')
          break
        }
      }
    } else {
      console.log('✅ Migration completed successfully!')
      console.log('')
      console.log('🔍 Verification:')
      console.log('   Create a test device and update its status.')
      console.log('   You should see only ONE entry in device_status_history.')
    }

  } catch (error) {
    console.error('❌ Error running migration:', error)
    process.exit(1)
  }
}

runMigration()

