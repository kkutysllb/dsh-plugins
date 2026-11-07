import { type TemplateContract } from './contracts.js';
import { type Job } from './jobs.js';
import { type QcResult, type QcRunDeps } from './qc.js';
import { type TemplateRecord } from './templates.js';
export interface JobQcDeps extends QcRunDeps {
    findTemplate?: (id: string) => TemplateRecord | null;
    ensureContract?: (record: TemplateRecord) => Promise<TemplateContract>;
    runQc?: (input: {
        deckPath: string;
        contract: TemplateContract;
        qcDir: string;
        deps?: QcRunDeps;
    }) => Promise<QcResult>;
}
export interface JobQcOutcome {
    job: Job;
    qc?: QcResult;
    code?: 'gate-order' | 'no-artifact' | 'contract-missing' | 'qc-error';
    message?: string;
}
export declare function runJobQc(jobId: string, deps?: JobQcDeps): Promise<JobQcOutcome>;
