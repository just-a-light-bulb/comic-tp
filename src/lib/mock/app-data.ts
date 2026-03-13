import type { Chapter, Page, Project } from '$lib/server/mock/api-schema';

export const projectCards: Project[] = [
	{
		id: 1,
		title: 'Akiyama Journal',
		sourceLang: 'JA',
		targetLang: 'TH',
		chapterCount: 2,
		updatedAt: new Date().toISOString()
	},
	{
		id: 2,
		title: 'Night Shift Hero',
		sourceLang: 'JA',
		targetLang: 'TH',
		chapterCount: 1,
		updatedAt: new Date().toISOString()
	}
];

export const chapterCards: Chapter[] = [
	{ id: 1, projectId: 1, title: 'Arrival', chapterNumber: 1, pageCount: 4, translatedCount: 2 },
	{ id: 2, projectId: 1, title: 'Storm', chapterNumber: 2, pageCount: 5, translatedCount: 1 },
	{
		id: 3,
		projectId: 2,
		title: 'Midnight Bell',
		chapterNumber: 1,
		pageCount: 6,
		translatedCount: 3
	}
];

export const chapterPages: Page[] = [
	{
		id: 1,
		chapterId: 1,
		pageNumber: 1,
		imageUrl: 'https://picsum.photos/900/1200?1',
		status: 'TRANSLATED'
	},
	{
		id: 2,
		chapterId: 1,
		pageNumber: 2,
		imageUrl: 'https://picsum.photos/900/1200?2',
		status: 'APPROVED'
	},
	{
		id: 3,
		chapterId: 2,
		pageNumber: 1,
		imageUrl: 'https://picsum.photos/900/1200?3',
		status: 'PENDING'
	}
];
