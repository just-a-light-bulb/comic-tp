import { json } from '@sveltejs/kit';
import { regions } from '$lib/server/mock/mock-db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { regionIds?: number[] };
	if (!body.regionIds?.length) {
		return json({ ok: false, error: 'regionIds are required' }, { status: 400 });
	}
	let updated = 0;
	for (const region of regions) {
		if (body.regionIds.includes(region.id)) {
			region.isApproved = true;
			updated += 1;
		}
	}
	return json({ ok: true, data: { updated } });
};
