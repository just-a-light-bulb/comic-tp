import { json } from '@sveltejs/kit';
import { projects } from '$lib/server/mock/mock-db';
import type { Project } from '$lib/server/mock/api-schema';
import type { RequestHandler } from './$types';

const EDITABLE_FIELDS = ['title', 'sourceLang', 'targetLang'] as const;

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	const patch = (await request.json()) as Partial<Project>;
	const project = projects.find((item) => item.id === id);
	if (!project) return json({ ok: false, error: 'Project not found' }, { status: 404 });

	const safePatch: Partial<Project> = {};
	for (const field of EDITABLE_FIELDS) {
		if (field in patch && typeof patch[field as keyof Project] === 'string') {
			(safePatch as any)[field] = patch[field as keyof Project];
		}
	}

	Object.assign(project, safePatch, { updatedAt: new Date().toISOString() });
	return json({ ok: true, data: { project } });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	const index = projects.findIndex((item) => item.id === id);
	if (index === -1) return json({ ok: false, error: 'Project not found' }, { status: 404 });
	projects.splice(index, 1);
	return json({ ok: true, data: { deleted: true } });
};
