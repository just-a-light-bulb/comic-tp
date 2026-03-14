import type {
	Chapter,
	CreateChapterInput,
	CreatePageInput,
	CreateProjectInput,
	Job,
	ManualRegionInput,
	Page,
	Project,
	QueueJobInput,
	Region
} from './api-schema';

let projectIdSeed = 3;
let chapterIdSeed = 4;
let pageIdSeed = 10;
let regionIdSeed = 30;
let jobIdSeed = 20;

export const projects: Project[] = [
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

export const chapters: Chapter[] = [
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

export const pages: Page[] = [
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

export const regions: Region[] = [
	{
		id: 1,
		pageId: 1,
		bubbleIndex: 1,
		originalText: 'こんにちは',
		translatedText: 'สวัสดี',
		confidence: 91,
		isApproved: true
	},
	{
		id: 2,
		pageId: 1,
		bubbleIndex: 2,
		originalText: '待って',
		translatedText: 'เดี๋ยวก่อน',
		confidence: 73,
		isApproved: false
	}
];

export const jobs: Job[] = [
	{ id: 1, pageId: 3, status: 'QUEUED', step: 0, aiModel: 'anthropic/claude-3.5-sonnet' }
];

export const createProject = (input: CreateProjectInput): Project => {
	const project: Project = {
		id: projectIdSeed++,
		title: input.title,
		sourceLang: input.sourceLang,
		targetLang: input.targetLang,
		chapterCount: 0,
		updatedAt: new Date().toISOString()
	};
	projects.unshift(project);
	return project;
};

export const createChapter = (input: CreateChapterInput): Chapter => {
	const chapter: Chapter = {
		id: chapterIdSeed++,
		projectId: input.projectId,
		title: input.title,
		chapterNumber: input.chapterNumber,
		pageCount: 0,
		translatedCount: 0
	};
	chapters.unshift(chapter);
	const project = projects.find((item) => item.id === input.projectId);
	if (project) project.chapterCount += 1;
	return chapter;
};

export const createPage = (input: CreatePageInput): Page => {
	const page: Page = {
		id: pageIdSeed++,
		chapterId: input.chapterId,
		pageNumber: input.pageNumber,
		imageUrl: input.imageUrl,
		status: 'PENDING'
	};
	pages.unshift(page);
	return page;
};

export const queueJob = (input: QueueJobInput): Job => {
	const job: Job = {
		id: jobIdSeed++,
		pageId: input.pageId,
		status: 'QUEUED',
		step: 0,
		aiModel: input.modelOverride ?? 'anthropic/claude-3.5-sonnet'
	};
	jobs.unshift(job);
	return job;
};

export const createManualRegion = (input: ManualRegionInput): Region => {
	const region: Region = {
		id: regionIdSeed++,
		pageId: input.pageId,
		bubbleIndex: input.bubbleIndex,
		originalText: input.originalText,
		translatedText: input.translatedText,
		confidence: 100,
		isApproved: true
	};
	regions.unshift(region);
	return region;
};
