import { json } from '@sveltejs/kit';
import { pages, queueJob } from '$lib/server/mock/mock-db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	if (typeof body !== 'object' || body === null || !('chapterId' in body)) {
		return json({ ok: false, error: 'chapterId is required' }, { status: 400 });
	}

	const chapterId = (body as { chapterId?: unknown }).chapterId;
	if (typeof chapterId !== 'number') {
		return json({ ok: false, error: 'chapterId must be a number' }, { status: 400 });
	}

	const targetPages = pages.filter((item) => item.chapterId === chapterId);
	for (const page of targetPages) {
		queueJob({ pageId: page.id });
	}
	return json({ ok: true, data: { queued: targetPages.length } });
};
