export interface TextRegion {
	id: string;
	bubbleIndex: number;
	bboxX: number;
	bboxY: number;
	bboxW: number;
	bboxH: number;
	originalText: string;
	translatedText: string;
	confidence: number;
	isApproved: boolean;
}

export interface TextOverlay {
	id: string;
	text: string;
	x: number;
	y: number;
	width: number;
	fontSize: number;
	color: string;
	fontWeight: 'normal' | 'bold';
	textAlign: 'left' | 'center' | 'right';
	visible?: boolean;
}
