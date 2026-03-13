import { json } from '@sveltejs/kit';
import { pages, queueJob } from '$lib/server/mock/mock-db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { chapterId?: number };
	if (!body.chapterId) return json({ ok: false, error: 'chapterId is required' }, { status: 400 });
	const targetPages = pages.filter((item) => item.chapterId === body.chapterId);
	for (const page of targetPages) {
		queueJob({ pageId: page.id });
	}
	return json({ ok: true, data: { queued: targetPages.length } });
};
