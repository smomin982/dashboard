import type { Bucket } from './domainBuckets';

export interface TractionKpis {
  realUsers: number;
  activeUsers: number;
  orgCount: number;          // distinct non-personal, non-unknown domains
  avgQueriesPerActive: number;
}
export interface CompositionRow { bucket: Bucket; count: number; }
export interface OrgRow { organization: string; n: number; }
export interface DepthMetrics {
  msgsPerConv: number; pctMultiConv: number; savedPerActive: number; vizCount: number;
}
export interface HistRow { bucket: string; n: number; }
export interface PowerUser { bucket: Bucket; conversations: number; queries: number; }

export interface TractionData {
  kpis: TractionKpis;
  composition: CompositionRow[];
  topOrgs: OrgRow[];
  depth: DepthMetrics;
  histogram: HistRow[];
  powerUsers: PowerUser[];
}

export function emptyTraction(): TractionData {
  return {
    kpis: { realUsers: 0, activeUsers: 0, orgCount: 0, avgQueriesPerActive: 0 },
    composition: [], topOrgs: [], depth: { msgsPerConv: 0, pctMultiConv: 0, savedPerActive: 0, vizCount: 0 },
    histogram: [], powerUsers: [],
  };
}
