import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sumibccxhppkpejrurjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface WorkflowError {
  id: number;
  created_at: string;
  workflow_name: string;
  error_node: string;
  error_message: string;
  error_timestamp: string;
  execution_id: string;
}

export async function getWorkflowErrors(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  workflowName?: string;
  errorNode?: string;
  startDate?: string;
  endDate?: string;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('workflow_errors')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Apply filters
  if (params.search) {
    query = query.or(`error_message.ilike.%${params.search}%,workflow_name.ilike.%${params.search}%,error_node.ilike.%${params.search}%`);
  }

  if (params.workflowName) {
    query = query.ilike('workflow_name', `%${params.workflowName}%`);
  }

  if (params.errorNode) {
    query = query.ilike('error_node', `%${params.errorNode}%`);
  }

  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Workflow Errors] Error fetching errors:', error);
    throw new Error(`Failed to fetch workflow errors: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

export async function getWorkflowErrorStats() {
  // Get total error count
  const { count: totalErrors } = await supabase
    .from('workflow_errors')
    .select('*', { count: 'exact', head: true });

  // Get errors from last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { count: last24Hours } = await supabase
    .from('workflow_errors')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo.toISOString());

  // Get most common workflows with errors
  const { data: allErrors } = await supabase
    .from('workflow_errors')
    .select('workflow_name')
    .limit(1000);

  const workflowCounts: Record<string, number> = {};
  allErrors?.forEach(error => {
    workflowCounts[error.workflow_name] = (workflowCounts[error.workflow_name] || 0) + 1;
  });

  const topWorkflows = Object.entries(workflowCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ workflow_name: name, error_count: count }));

  return {
    totalErrors: totalErrors || 0,
    last24Hours: last24Hours || 0,
    topWorkflows,
  };
}
