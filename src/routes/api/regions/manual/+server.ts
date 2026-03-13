import { json } from '@sveltejs/kit';
import { createManualRegion } from '$lib/server/mock/mock-db';
import type { ManualRegionInput } from '$lib/server/mock/api-schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const input = (await request.json()) as Partial<ManualRegionInput>;
	if (!input.pageId || !input.originalText || !input.translatedText) {
		return json(
			{ ok: false, error: 'pageId, originalText, translatedText are required' },
			{ status: 400 }
		);
	}
	const region = createManualRegion({
		pageId: input.pageId,
		bubbleIndex: input.bubbleIndex ?? 999,
		originalText: input.originalText,
		translatedText: input.translatedText
	});
	return json({ ok: true, data: { region } }, { status: 201 });
};
