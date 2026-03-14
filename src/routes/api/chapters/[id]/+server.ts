import { json } from '@sveltejs/kit';
import { chapters, pages, regions, jobs, projects } from '$lib/server/mock/mock-db';
import type { Chapter } from '$lib/server/mock/api-schema';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	const patch = (await request.json()) as Partial<Chapter>;
	const chapter = chapters.find((item) => item.id === id);
	if (!chapter) return json({ ok: false, error: 'Chapter not found' }, { status: 404 });

	// Whitelist editable fields only
	const allowedUpdates: Partial<Chapter> = {};
	if ('chapterNumber' in patch && typeof patch.chapterNumber === 'number') {
		allowedUpdates.chapterNumber = patch.chapterNumber;
	}
	if ('title' in patch && typeof patch.title === 'string') {
		allowedUpdates.title = patch.title;
	}

	Object.assign(chapter, allowedUpdates);
	return json({ ok: true, data: { chapter } });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	const index = chapters.findIndex((item) => item.id === id);
	if (index === -1) return json({ ok: false, error: 'Chapter not found' }, { status: 404 });

	const chapter = chapters[index];

	// Find all pages belonging to this chapter
	const chapterPageIds = pages.filter((page) => page.chapterId === id).map((page) => page.id);

	// Delete regions associated with those pages
	for (const pageId of chapterPageIds) {
		for (let i = regions.length - 1; i >= 0; i--) {
			if (regions[i].pageId === pageId) {
				regions.splice(i, 1);
			}
		}
	}

	// Delete jobs associated with those pages
	for (const pageId of chapterPageIds) {
		for (let i = jobs.length - 1; i >= 0; i--) {
			if (jobs[i].pageId === pageId) {
				jobs.splice(i, 1);
			}
		}
	}

	// Delete pages belonging to this chapter
	for (let i = pages.length - 1; i >= 0; i--) {
		if (pages[i].chapterId === id) {
			pages.splice(i, 1);
		}
	}

	// Update project's chapterCount
	const project = projects.find((p) => p.id === chapter.projectId);
	if (project) {
		project.chapterCount = Math.max(0, project.chapterCount - 1);
	}

	// Delete the chapter
	chapters.splice(index, 1);
	return json({ ok: true, data: { deleted: true } });
};
