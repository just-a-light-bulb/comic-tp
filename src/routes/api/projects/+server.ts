import { json } from '@sveltejs/kit';
import { createProject, projects } from '$lib/server/mock/mock-db';
import type { CreateProjectInput } from '$lib/server/mock/api-schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({ ok: true, data: { projects } });
};

export const POST: RequestHandler = async ({ request }) => {
	const input = (await request.json()) as Partial<CreateProjectInput>;
	if (!input.title || !input.sourceLang || !input.targetLang) {
		return json(
			{ ok: false, error: 'title, sourceLang, targetLang are required' },
			{ status: 400 }
		);
	}
	const project = createProject(input as CreateProjectInput);
	return json({ ok: true, data: { project } }, { status: 201 });
};
