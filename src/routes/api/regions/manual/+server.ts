import { json } from '@sveltejs/kit';
import { createManualRegion, pages } from '$lib/server/mock/mock-db';
import type { ManualRegionInput } from '$lib/server/mock/api-schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	let input: Partial<ManualRegionInput>;
	try {
		input = (await request.json()) as Partial<ManualRegionInput>;
	} catch {
		return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
	}
	if (!input.pageId || typeof input.pageId !== 'number') {
		return json({ ok: false, error: 'pageId must be a number' }, { status: 400 });
	}
	const pageExists = pages.some((p) => p.id === input.pageId);
	if (!pageExists) {
		return json({ ok: false, error: 'Page not found' }, { status: 404 });
	}
	if (!input.originalText || !input.translatedText) {
		return json({ ok: false, error: 'originalText, translatedText are required' }, { status: 400 });
	}
	const region = createManualRegion({
		pageId: input.pageId,
		bubbleIndex: input.bubbleIndex ?? 999,
		originalText: input.originalText,
		translatedText: input.translatedText
	});
	return json({ ok: true, data: { region } }, { status: 201 });
};
