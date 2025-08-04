const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Anon Key:', supabaseAnonKey ? 'Found' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testData() {
  try {
    console.log('\n1. Testing psychoattributes with anon key...')
    const { data: directData, error: directError } = await supabase
      .from('psychoattributes')
      .select('questiontext, field_name, value, question_type')
      .eq('country_id', 'a2b5820b-9ea7-4024-aa37-29aeae64dcfc')
      .limit(10)
    
    if (directError) {
      console.error('Direct query error:', directError)
    } else {
      console.log('Direct query success! Found', directData?.length || 0, 'rows')
      if (directData?.length > 0) {
        console.log('Sample data:', directData.slice(0, 2))
        
        // Group questions
        const questions = directData.reduce((acc, item) => {
          if (!acc[item.questiontext]) {
            acc[item.questiontext] = {
              question: item.questiontext,
              options: [],
              type: item.question_type
            }
          }
          acc[item.questiontext].options.push(item.value)
          return acc
        }, {})
        
        console.log('\nGrouped questions:')
        Object.values(questions).forEach((q, i) => {
          console.log(`${i + 1}. ${q.question} (${q.options.length} options)`)
        })
      }
    }

  } catch (error) {
    console.error('Test failed:', error)
  }
}

testData()
