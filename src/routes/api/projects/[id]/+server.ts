import { json } from '@sveltejs/kit';
import { projects } from '$lib/server/mock/mock-db';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	const patch = (await request.json()) as Partial<(typeof projects)[number]>;
	const project = projects.find((item) => item.id === id);
	if (!project) return json({ ok: false, error: 'Project not found' }, { status: 404 });
	Object.assign(project, patch, { updatedAt: new Date().toISOString() });
	return json({ ok: true, data: { project } });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	const index = projects.findIndex((item) => item.id === id);
	if (index === -1) return json({ ok: false, error: 'Project not found' }, { status: 404 });
	projects.splice(index, 1);
	return json({ ok: true, data: { deleted: true } });
};
