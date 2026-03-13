import { json } from '@sveltejs/kit';
import { chapters, createChapter } from '$lib/server/mock/mock-db';
import type { CreateChapterInput } from '$lib/server/mock/api-schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({ ok: true, data: { chapters } });
};

export const POST: RequestHandler = async ({ request }) => {
	const input = (await request.json()) as Partial<CreateChapterInput>;
	if (!input.projectId || !input.title || !input.chapterNumber) {
		return json(
			{ ok: false, error: 'projectId, title, chapterNumber are required' },
			{ status: 400 }
		);
	}
	const chapter = createChapter(input as CreateChapterInput);
	return json({ ok: true, data: { chapter } }, { status: 201 });
};
