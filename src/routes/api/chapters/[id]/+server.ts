import { json } from '@sveltejs/kit';
import { chapters } from '$lib/server/mock/mock-db';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	const patch = (await request.json()) as Partial<(typeof chapters)[number]>;
	const chapter = chapters.find((item) => item.id === id);
	if (!chapter) return json({ ok: false, error: 'Chapter not found' }, { status: 404 });
	Object.assign(chapter, patch);
	return json({ ok: true, data: { chapter } });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	const index = chapters.findIndex((item) => item.id === id);
	if (index === -1) return json({ ok: false, error: 'Chapter not found' }, { status: 404 });
	chapters.splice(index, 1);
	return json({ ok: true, data: { deleted: true } });
};
