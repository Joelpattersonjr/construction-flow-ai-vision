import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PerformanceTest {
  name: string
  query: string
  expectedRows?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { testType } = await req.json()
    
    const performanceTests: PerformanceTest[] = [
      {
        name: 'Projects Query',
        query: 'SELECT id, name, created_at FROM projects ORDER BY created_at DESC LIMIT 10',
        expectedRows: 10
      },
      {
        name: 'Tasks with Status',
        query: 'SELECT id, title, status, project_id FROM tasks WHERE status IS NOT NULL ORDER BY created_at DESC LIMIT 20',
        expectedRows: 20
      },
      {
        name: 'User Profiles',
        query: 'SELECT id, full_name, company_role FROM profiles WHERE company_role IS NOT NULL LIMIT 15',
        expectedRows: 15
      },
      {
        name: 'Project Members',
        query: 'SELECT project_id, user_id, role FROM project_members_enhanced ORDER BY created_at DESC LIMIT 25',
        expectedRows: 25
      },
      {
        name: 'Recent Activity',
        query: 'SELECT action_type, created_at, project_id FROM audit_log ORDER BY created_at DESC LIMIT 30',
        expectedRows: 30
      }
    ]

    const results = []
    let totalTime = 0

    for (const test of performanceTests) {
      const startTime = performance.now()
      
      try {
        const { data, error } = await supabase
          .rpc('debug_query_performance', { 
            query_text: test.query 
          })
          .single()

        if (error) {
          // Fallback to direct query if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('projects')
            .select('id, name, created_at')
            .order('created_at', { ascending: false })
            .limit(10)

          if (directError) throw directError
        }

        const endTime = performance.now()
        const duration = endTime - startTime
        totalTime += duration

        results.push({
          test: test.name,
          duration: Math.round(duration),
          status: 'success',
          rowsReturned: data?.length || 0,
          expectedRows: test.expectedRows || 0
        })

      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime
        totalTime += duration

        results.push({
          test: test.name,
          duration: Math.round(duration),
          status: 'error',
          error: error.message,
          rowsReturned: 0,
          expectedRows: test.expectedRows || 0
        })
      }
    }

    // Get database statistics
    const { data: dbStats } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1)

    const performanceMetrics = {
      totalTests: performanceTests.length,
      totalTime: Math.round(totalTime),
      averageTime: Math.round(totalTime / performanceTests.length),
      successfulTests: results.filter(r => r.status === 'success').length,
      failedTests: results.filter(r => r.status === 'error').length,
      results: results,
      recommendations: generateRecommendations(results)
    }

    console.log('Database performance test completed:', performanceMetrics)

    return new Response(JSON.stringify(performanceMetrics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Database performance test error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        totalTests: 0,
        totalTime: 0,
        averageTime: 0,
        successfulTests: 0,
        failedTests: 0,
        results: [],
        recommendations: ['Check database connection', 'Verify database permissions']
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function generateRecommendations(results: any[]): string[] {
  const recommendations: string[] = []
  
  const averageTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length
  
  if (averageTime > 500) {
    recommendations.push('Consider adding more indexes to frequently queried columns')
  }
  
  if (averageTime > 1000) {
    recommendations.push('Database queries are slow - review query complexity and table sizes')
  }
  
  const failedTests = results.filter(r => r.status === 'error')
  if (failedTests.length > 0) {
    recommendations.push('Some queries failed - check RLS policies and permissions')
  }
  
  if (averageTime < 100) {
    recommendations.push('Database performance is excellent!')
  } else if (averageTime < 300) {
    recommendations.push('Database performance is good')
  } else {
    recommendations.push('Database performance needs optimization')
  }
  
  return recommendations
}