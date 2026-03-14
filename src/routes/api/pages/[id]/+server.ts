import { json } from '@sveltejs/kit';
import { jobs, pages, regions } from '$lib/server/mock/mock-db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	const page = pages.find((item) => item.id === id);
	if (!page) return json({ ok: false, error: 'Page not found' }, { status: 404 });
	const pageRegions = regions.filter((item) => item.pageId === id);
	const job = jobs.find((item) => item.pageId === id) ?? null;
	return json({ ok: true, data: { page, regions: pageRegions, job } });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	const index = pages.findIndex((item) => item.id === id);
	if (index === -1) return json({ ok: false, error: 'Page not found' }, { status: 404 });

	// Delete dependent regions first (cascade)
	for (let i = regions.length - 1; i >= 0; i--) {
		if (regions[i].pageId === id) {
			regions.splice(i, 1);
		}
	}

	// Delete dependent jobs (cascade)
	for (let i = jobs.length - 1; i >= 0; i--) {
		if (jobs[i].pageId === id) {
			jobs.splice(i, 1);
		}
	}

	// Delete the page itself
	pages.splice(index, 1);
	return json({ ok: true, data: { deleted: true } });
};
