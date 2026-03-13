import { json } from '@sveltejs/kit';
import { regions } from '$lib/server/mock/mock-db';
import type { Region } from '$lib/server/mock/api-schema';
import type { RequestHandler } from './$types';

const ALLOWED_FIELDS: (keyof Region)[] = ['translatedText', 'isApproved', 'confidence'];

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	const body = (await request.json()) as Partial<Region>;
	const region = regions.find((item) => item.id === id);
	if (!region) return json({ ok: false, error: 'Region not found' }, { status: 404 });

	const patch: Partial<Region> = {};
	for (const field of ALLOWED_FIELDS) {
		if (field in body) {
			(patch as any)[field] = body[field];
		}
	}

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
