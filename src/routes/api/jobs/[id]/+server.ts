import { json } from '@sveltejs/kit';
import { jobs } from '$lib/server/mock/mock-db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	const job = jobs.find((item) => item.id === id);
	if (!job) return json({ ok: false, error: 'Job not found' }, { status: 404 });
	return json({ ok: true, data: { job } });
};
