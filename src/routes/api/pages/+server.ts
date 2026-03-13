import { json } from '@sveltejs/kit';
import { createPage, pages } from '$lib/server/mock/mock-db';
import type { CreatePageInput } from '$lib/server/mock/api-schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({ ok: true, data: { pages } });
};

export const POST: RequestHandler = async ({ request }) => {
	const input = (await request.json()) as Partial<CreatePageInput>;
	if (!input.chapterId || !input.pageNumber || !input.imageUrl) {
		return json(
			{ ok: false, error: 'chapterId, pageNumber, imageUrl are required' },
			{ status: 400 }
		);
	}
	const page = createPage(input as CreatePageInput);
	return json({ ok: true, data: { page } }, { status: 201 });
};
