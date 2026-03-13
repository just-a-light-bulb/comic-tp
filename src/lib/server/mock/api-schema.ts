export interface ApiEnvelope<T> {
	ok: boolean;
	data?: T;
	error?: string;
}

export type PageStatus =
	| 'PENDING'
	| 'PROCESSING'
	| 'DETECTED'
	| 'TRANSLATED'
	| 'APPROVED'
	| 'RENDERED';
export type JobStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'ERROR';

export interface Project {
	id: number;
	title: string;
	sourceLang: string;
	targetLang: string;
	chapterCount: number;
	updatedAt: string;
}

export interface Chapter {
	id: number;
	projectId: number;
	title: string;
	chapterNumber: number;
	pageCount: number;
	translatedCount: number;
}

export interface Page {
	id: number;
	chapterId: number;
	pageNumber: number;
	imageUrl: string;
	status: PageStatus;
}

export interface Job {
	id: number;
	pageId: number;
	status: JobStatus;
	step: number;
	aiModel: string;
	errorMessage?: string;
}

export interface Region {
	id: number;
	pageId: number;
	bubbleIndex: number;
	originalText: string;
	translatedText: string;
	confidence: number;
	isApproved: boolean;
}

export interface CreateProjectInput {
	title: string;
	sourceLang: string;
	targetLang: string;
}

export interface CreateChapterInput {
	projectId: number;
	title: string;
	chapterNumber: number;
}

export interface CreatePageInput {
	chapterId: number;
	pageNumber: number;
	imageUrl: string;
}

export interface QueueJobInput {
	pageId: number;
	modelOverride?: string;
}

export interface QueueBatchInput {
	chapterId: number;
}

export interface ManualRegionInput {
	pageId: number;
	bubbleIndex: number;
	originalText: string;
	translatedText: string;
}
