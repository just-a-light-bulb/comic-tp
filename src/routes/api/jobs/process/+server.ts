import { json } from '@sveltejs/kit';
import { queueJob, pages } from '$lib/server/mock/mock-db';
import type { QueueJobInput } from '$lib/server/mock/api-schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	let input: unknown;
	try {
		input = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	if (typeof input !== 'object' || input === null || !('pageId' in input)) {
		return json({ ok: false, error: 'pageId is required' }, { status: 400 });
	}

	const pageId = (input as { pageId?: unknown }).pageId;
	if (typeof pageId !== 'number') {
		return json({ ok: false, error: 'pageId must be a number' }, { status: 400 });
	}

	const pageExists = pages.some((p) => p.id === pageId);
	if (!pageExists) {
		return json({ ok: false, error: 'Page not found' }, { status: 404 });
	}

	const job = queueJob(input as QueueJobInput);
	return json({ ok: true, data: { jobId: job.id } }, { status: 201 });
};
