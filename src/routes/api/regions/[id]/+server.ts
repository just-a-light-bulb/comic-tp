import { json } from '@sveltejs/kit';
import { regions } from '$lib/server/mock/mock-db';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	const patch = (await request.json()) as Partial<(typeof regions)[number]>;
	const region = regions.find((item) => item.id === id);
	if (!region) return json({ ok: false, error: 'Region not found' }, { status: 404 });
	Object.assign(region, patch);
	return json({ ok: true, data: { region } });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	const index = regions.findIndex((item) => item.id === id);
	if (index === -1) return json({ ok: false, error: 'Region not found' }, { status: 404 });
	regions.splice(index, 1);
	return json({ ok: true, data: { deleted: true } });
};
