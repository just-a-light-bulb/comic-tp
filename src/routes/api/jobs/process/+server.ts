import { json } from '@sveltejs/kit';
import { queueJob } from '$lib/server/mock/mock-db';
import type { QueueJobInput } from '$lib/server/mock/api-schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const input = (await request.json()) as Partial<QueueJobInput>;
	if (!input.pageId) return json({ ok: false, error: 'pageId is required' }, { status: 400 });
	const job = queueJob(input as QueueJobInput);
	return json({ ok: true, data: { jobId: job.id } }, { status: 201 });
};
