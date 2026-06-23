import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { INTERNAL_DOMAINS, INTERNAL_EMAILS } from '../../../lib/internalAccounts';
import { bucketForDomain, BUCKET_ORDER, type Bucket } from '../../../lib/domainBuckets';
import { emptyTraction, type CompositionRow, type PowerUser } from '../../../lib/tractionTypes';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: Request) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { data: emptyTraction(), errors: ['SUPABASE_SERVICE_ROLE_KEY is not set.'] }, { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  // Validate against the known set so a malformed ?days= can't produce an
  // Invalid Date and throw from toISOString() below.
  const daysParam = searchParams.get('days') || '30';
  const days = ['7', '30', '90', 'all'].includes(daysParam) ? daysParam : '30';
  const excludeInternal = searchParams.get('excludeInternal') !== 'false'; // default true

  let pStart: string | null = null;
  if (days !== 'all') {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(days, 10));
    pStart = d.toISOString().slice(0, 10);
  }

  const domains = excludeInternal ? INTERNAL_DOMAINS : [];
  const emails = excludeInternal ? INTERNAL_EMAILS : [];
  const errors: string[] = [];
  const rpcErr = (label: string, msg: string) => {
    if (/function .* does not exist|could not find the function/i.test(msg))
      errors.push(`${label}: run migration supabase_stuff/migrations/20260605120000_traction_rpcs.sql`);
    else errors.push(`${label}: ${msg}`);
  };

  const [kpisR, compR, orgsR, depthR, histR, powerR] = await Promise.all([
    supabase.rpc('dashboard_traction_kpis', { p_domains: domains, p_emails: emails, p_start: pStart }),
    supabase.rpc('dashboard_user_composition', { p_domains: domains, p_emails: emails }),
    supabase.rpc('dashboard_top_orgs', { p_domains: domains, p_emails: emails }),
    supabase.rpc('dashboard_depth', { p_domains: domains, p_emails: emails, p_start: pStart }),
    supabase.rpc('dashboard_conversations_per_user_hist', { p_domains: domains, p_emails: emails }),
    supabase.rpc('dashboard_power_users', { p_domains: domains, p_emails: emails, p_limit: 5 }),
  ]);

  if (kpisR.error) rpcErr('kpis', kpisR.error.message);
  if (compR.error) rpcErr('composition', compR.error.message);
  if (orgsR.error) rpcErr('orgs', orgsR.error.message);
  if (depthR.error) rpcErr('depth', depthR.error.message);
  if (histR.error) rpcErr('histogram', histR.error.message);
  if (powerR.error) rpcErr('power users', powerR.error.message);

  // Bucket the raw domains.
  const bucketCounts = new Map<Bucket, number>();
  (compR.data ?? []).forEach((r: any) => {
    const b = bucketForDomain(r.domain);
    bucketCounts.set(b, (bucketCounts.get(b) ?? 0) + (r.user_count ?? 0));
  });
  const composition: CompositionRow[] = BUCKET_ORDER
    .map((bucket) => ({ bucket, count: bucketCounts.get(bucket) ?? 0 }))
    .filter((r) => r.count > 0);
  const orgCount = (compR.data ?? [])
    .filter((r: any) => !['Personal', 'Unknown'].includes(bucketForDomain(r.domain)))
    .length;

  const kpiRow = kpisR.data?.[0] ?? {};
  const activeUsers = kpiRow.active_users ?? 0;
  const powerUsers: PowerUser[] = (powerR.data ?? []).map((r: any) => ({
    bucket: bucketForDomain(r.domain), conversations: r.conversations ?? 0, queries: r.queries ?? 0,
  }));
  const depthRow = depthR.data?.[0] ?? {};

  return NextResponse.json({
    data: {
      kpis: {
        realUsers: kpiRow.real_users ?? 0,
        activeUsers,
        orgCount,
        avgQueriesPerActive: activeUsers > 0
          ? Number(((kpiRow.user_queries ?? 0) / activeUsers).toFixed(1)) : 0,
      },
      composition,
      topOrgs: (orgsR.data ?? []).map((r: any) => ({ organization: r.organization, n: r.n })),
      depth: {
        msgsPerConv: Number(Number(depthRow.msgs_per_conv ?? 0).toFixed(1)),
        pctMultiConv: Number(Number(depthRow.pct_multi_conv ?? 0).toFixed(0)),
        savedPerActive: Number(Number(depthRow.saved_per_active ?? 0).toFixed(1)),
        vizCount: depthRow.viz_count ?? 0,
      },
      histogram: (histR.data ?? []).map((r: any) => ({ bucket: r.bucket, n: r.n })),
      powerUsers,
    },
    errors,
  });
}
