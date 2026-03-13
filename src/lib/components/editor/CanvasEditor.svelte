<script lang="ts">
	import { onMount } from 'svelte';
	import { activeRegionId } from '$lib/stores/editor';
	import type { TextOverlay, TextRegion } from './types';

	interface Props {
		imageUrl: string;
		regions: TextRegion[];
		textOverlays: TextOverlay[];
		resetSignal?: number;
		drawingMode?: boolean;
		previewMode?: boolean;
		renderedImageUrl?: string;
		onRegionMoved?: (
			regionId: string,
			next: Pick<TextRegion, 'bboxX' | 'bboxY' | 'bboxW' | 'bboxH'>
		) => void;
		onRegionCreated?: (
			region: Omit<
				TextRegion,
				'id' | 'bubbleIndex' | 'originalText' | 'translatedText' | 'confidence' | 'isApproved'
			>
		) => void;
		onTextOverlayUpdate?: (textId: string, patch: Partial<TextOverlay>) => void;
		onActiveTextChange?: (textId: string | null) => void;
		onEnterPreview?: () => void;
		onExportReady?: (exportFns: {
			exportAsPNG: typeof exportAsPNG;
			exportAsPDF: typeof exportAsPDF;
		}) => void;
		onLayerUpdate?: (textId: string, patch: Partial<TextOverlay>) => void;
		onCanvasReady?: (api: {
			setLayerVisibility: (textId: string, visible: boolean) => void;
			bringForward: (textId: string) => void;
			sendBackward: (textId: string) => void;
			bringToFront: (textId: string) => void;
			sendToBack: (textId: string) => void;
		}) => void;
	}

	let {
		imageUrl,
		regions,
		textOverlays,
		resetSignal = 0,
		drawingMode = false,
		previewMode = false,
		renderedImageUrl,
		onRegionMoved,
		onRegionCreated,
		onTextOverlayUpdate,
		onActiveTextChange,
		onEnterPreview,
		onExportReady,
		onLayerUpdate,
		onCanvasReady
	}: Props = $props();

	let rootEl = $state<HTMLDivElement | null>(null);
	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let fc = $state<any>(null);
	let fabricApi = $state<any>(null);

	export { fc as canvasRef };
	export { setLayerVisibility, bringForward, sendBackward, bringToFront, sendToBack };
	let currentZoom = $state(1);
	let isPanning = $state(false);
	let isSpaceHeld = $state(false);
	let lastPanPoint = $state({ x: 0, y: 0 });
	let resizeObserver = $state<ResizeObserver | null>(null);
	let regionObjects = new Map<string, any>();
	let textObjects = new Map<string, any>();
	let suppressCanvasSync = $state(false);
	let previewRect = $state<any>(null);
	let drawingStart = $state<{ x: number; y: number } | null>(null);
	let copiedObject = $state<any>(null);

	const exportAsPNG = (filename = 'comic-page.png'): void => {
		if (!fc) return;
		const dataUrl = fc.toDataURL({
			format: 'png',
			quality: 1,
			multiplier: 2
		});
		const link = document.createElement('a');
		link.href = dataUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const exportAsPDF = async (filename = 'comic-page.pdf'): Promise<void> => {
		if (!fc) return;
		const dataUrl = fc.toDataURL({
			format: 'png',
			quality: 1,
			multiplier: 2
		});
		const { PDFDocument } = await import('pdf-lib');
		const pdfDoc = await PDFDocument.create();
		const page = pdfDoc.addPage([fc.width, fc.height]);
		const pngImage = await pdfDoc.embedPng(dataUrl);
		page.drawImage(pngImage, {
			x: 0,
			y: 0,
			width: fc.width,
			height: fc.height
		});
		const pdfBytes = await pdfDoc.save();
		const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const zoomMin = 0.1;
	const zoomMax = 5;
	const tones = {
		approved: '#2e7d32',
		pending: '#6750a4',
		low: '#b3261e'
	};

	const getTone = (region: TextRegion): string => {
		if (region.isApproved) return tones.approved;
		if (region.confidence < 60) return tones.low;
		return tones.pending;
	};

	const setCanvasSize = (imageWidth?: number, imageHeight?: number): void => {
		if (!rootEl || !canvasEl || !fc) return;
		const dpr = window.devicePixelRatio || 1;
		const width = imageWidth ?? Math.max(rootEl.clientWidth, 1);
		const height = imageHeight ?? Math.max(rootEl.clientHeight, 1);
		canvasEl.width = width * dpr;
		canvasEl.height = height * dpr;
		canvasEl.style.width = `${width}px`;
		canvasEl.style.height = `${height}px`;
		fc.setDimensions({ width, height });
	};

	const fitToScreen = (): void => {
		if (!fc?.backgroundImage) return;
		const bg = fc.backgroundImage;
		const imageWidth = bg.width ?? 1;
		const imageHeight = bg.height ?? 1;
		const canvasWidth = fc.getWidth();
		const canvasHeight = fc.getHeight();
		const baseZoom = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
		currentZoom = baseZoom;
		const offsetX = (canvasWidth - imageWidth * baseZoom) / 2;
		const offsetY = (canvasHeight - imageHeight * baseZoom) / 2;
		fc.setViewportTransform([baseZoom, 0, 0, baseZoom, offsetX, offsetY]);
		updateOverlayScale();
	};

	const updateOverlayScale = (): void => {
		for (const group of regionObjects.values()) {
			const rect = group.item(0);
			const label = group.item(1);
			rect?.set({ strokeWidth: 2 / currentZoom });
			label?.set({ fontSize: 13 / currentZoom });
		}
		for (const text of textObjects.values()) {
			text.set({ borderScaleFactor: 1 / currentZoom, cornerSize: 10 / currentZoom });
		}
		fc?.requestRenderAll();
	};

	const renderRegionOverlays = (): void => {
		if (!fc || !fabricApi) return;
		for (const object of regionObjects.values()) {
			fc.remove(object);
		}
		regionObjects.clear();
		for (const region of regions) {
			const tone = getTone(region);
			const rect = new fabricApi.Rect({
				left: 0,
				top: 0,
				width: region.bboxW,
				height: region.bboxH,
				fill: `${tone}20`,
				stroke: tone,
				strokeWidth: 2 / currentZoom,
				rx: 10,
				ry: 10,
				evented: false
			});
			const label = new fabricApi.Text(`${region.bubbleIndex}`, {
				left: 8,
				top: 8,
				fontSize: 13 / currentZoom,
				fontWeight: '700',
				fill: tone,
				fontFamily: 'Roboto, sans-serif',
				evented: false
			});
			const group = new fabricApi.Group([rect, label], {
				left: region.bboxX,
				top: region.bboxY,
				selectable: true,
				hasRotatingPoint: false
			});
			group.data = { type: 'region', regionId: region.id };
			regionObjects.set(region.id, group);
			fc.add(group);
		}
	};

	const renderTextOverlays = (): void => {
		if (!fc || !fabricApi) return;
		for (const object of textObjects.values()) {
			fc.remove(object);
		}
		textObjects.clear();
		for (const item of textOverlays) {
			const textbox = new fabricApi.Textbox(item.text, {
				left: item.x,
				top: item.y,
				width: item.width,
				fontSize: item.fontSize,
				fill: item.color,
				fontWeight: item.fontWeight,
				textAlign: item.textAlign,
				fontFamily: 'Noto Serif Thai, Roboto, sans-serif',
				backgroundColor: 'rgba(255,255,255,0.75)',
				padding: 6,
				rx: 8,
				ry: 8,
				visible: item.visible !== false
			});
			textbox.data = { type: 'text', textId: item.id };
			textObjects.set(item.id, textbox);
			fc.add(textbox);
		}
	};

	const renderAllOverlays = (): void => {
		renderRegionOverlays();
		renderTextOverlays();
		updateOverlayScale();
	};

	const syncTextUpdate = (target: any): void => {
		const textId = target?.data?.textId as string | undefined;
		if (!textId || !onTextOverlayUpdate) return;
		onTextOverlayUpdate(textId, {
			x: Math.round(target.left ?? 0),
			y: Math.round(target.top ?? 0),
			width: Math.round((target.width ?? 180) * (target.scaleX ?? 1)),
			text: target.text ?? ''
		});
		target.set({ scaleX: 1, scaleY: 1 });
		target.setCoords();
	};

	const setLayerVisibility = (textId: string, visible: boolean): void => {
		const textObj = textObjects.get(textId);
		if (!textObj) return;
		textObj.set({ visible });
		fc?.requestRenderAll();
		onLayerUpdate?.(textId, { visible });
	};

	const bringForward = (textId: string): void => {
		const textObj = textObjects.get(textId);
		if (!textObj) return;
		textObj.bringForward();
		fc?.requestRenderAll();
	};

	const sendBackward = (textId: string): void => {
		const textObj = textObjects.get(textId);
		if (!textObj) return;
		textObj.sendBackwards();
		fc?.requestRenderAll();
	};

	const bringToFront = (textId: string): void => {
		const textObj = textObjects.get(textId);
		if (!textObj) return;
		textObj.bringToFront();
		fc?.requestRenderAll();
	};

	const sendToBack = (textId: string): void => {
		const textObj = textObjects.get(textId);
		if (!textObj) return;
		textObj.sendToBack();
		fc?.requestRenderAll();
	};

	const handleKeyboard = (event: KeyboardEvent): void => {
		if (!fc) return;

		const activeObject = fc.getActiveObject();
		const isInput =
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement ||
			(event.target as HTMLElement).isContentEditable;

		if (isInput) return;

		if (event.code === 'Delete' || event.code === 'Backspace') {
			if (activeObject) {
				const textId = activeObject.data?.textId as string | undefined;
				const regionId = activeObject.data?.regionId as string | undefined;

				if (textId) {
					textObjects.delete(textId);
					onTextOverlayUpdate?.(textId, { visible: false });
				} else if (regionId) {
					regionObjects.delete(regionId);
				}

				fc.remove(activeObject);
				fc.discardActiveObject();
				fc.requestRenderAll();
			}
			event.preventDefault();
			return;
		}

		if (event.ctrlKey || event.metaKey) {
			if (event.code === 'KeyC') {
				if (activeObject) {
					copiedObject = {
						type: activeObject.data?.type,
						text: activeObject.text,
						left: activeObject.left,
						top: activeObject.top,
						width: activeObject.width,
						fontSize: activeObject.fontSize,
						fill: activeObject.fill,
						fontWeight: activeObject.fontWeight,
						textAlign: activeObject.textAlign,
						fontFamily: activeObject.fontFamily,
						backgroundColor: activeObject.backgroundColor,
						padding: activeObject.padding
					};
				}
				event.preventDefault();
				return;
			}

			if (event.code === 'KeyV') {
				if (copiedObject && copiedObject.type === 'text') {
					const textbox = new fabricApi.Textbox(copiedObject.text, {
						left: (copiedObject.left ?? 0) + 20,
						top: (copiedObject.top ?? 0) + 20,
						width: copiedObject.width ?? 180,
						fontSize: copiedObject.fontSize ?? 16,
						fill: copiedObject.fill ?? '#000000',
						fontWeight: copiedObject.fontWeight ?? 'normal',
						textAlign: copiedObject.textAlign ?? 'left',
						fontFamily: copiedObject.fontFamily ?? 'Noto Serif Thai, Roboto, sans-serif',
						backgroundColor: copiedObject.backgroundColor ?? 'rgba(255,255,255,0.75)',
						padding: copiedObject.padding ?? 6
					});
					const newId = crypto.randomUUID();
					textbox.data = { type: 'text', textId: newId };
					textObjects.set(newId, textbox);
					fc.add(textbox);
					fc.setActiveObject(textbox);
					fc.requestRenderAll();
					onTextOverlayUpdate?.(newId, {
						id: newId,
						text: copiedObject.text ?? '',
						x: Math.round(textbox.left ?? 0),
						y: Math.round(textbox.top ?? 0),
						width: Math.round(textbox.width ?? 180),
						fontSize: textbox.fontSize ?? 16,
						color: copiedObject.fill ?? '#000000',
						fontWeight: copiedObject.fontWeight ?? 'normal',
						textAlign: copiedObject.textAlign ?? 'left'
					});
				}
				event.preventDefault();
				return;
			}

			if (event.code === 'KeyD') {
				if (activeObject && activeObject.data?.type === 'text') {
					const textbox = new fabricApi.Textbox(activeObject.text, {
						left: (activeObject.left ?? 0) + 20,
						top: (activeObject.top ?? 0) + 20,
						width: activeObject.width ?? 180,
						fontSize: activeObject.fontSize ?? 16,
						fill: activeObject.fill ?? '#000000',
						fontWeight: activeObject.fontWeight ?? 'normal',
						textAlign: activeObject.textAlign ?? 'left',
						fontFamily: activeObject.fontFamily ?? 'Noto Serif Thai, Roboto, sans-serif',
						backgroundColor: activeObject.backgroundColor ?? 'rgba(255,255,255,0.75)',
						padding: activeObject.padding ?? 6
					});
					const newId = crypto.randomUUID();
					textbox.data = { type: 'text', textId: newId };
					textObjects.set(newId, textbox);
					fc.add(textbox);
					fc.setActiveObject(textbox);
					fc.requestRenderAll();
					onTextOverlayUpdate?.(newId, {
						id: newId,
						text: activeObject.text ?? '',
						x: Math.round(textbox.left ?? 0),
						y: Math.round(textbox.top ?? 0),
						width: Math.round(textbox.width ?? 180),
						fontSize: textbox.fontSize ?? 16,
						color: activeObject.fill ?? '#000000',
						fontWeight: activeObject.fontWeight ?? 'normal',
						textAlign: activeObject.textAlign ?? 'left'
					});
				}
				event.preventDefault();
				return;
			}

			if (event.code === 'KeyA') {
				const allObjects: any[] = [];
				textObjects.forEach((text) => allObjects.push(text));
				regionObjects.forEach((region) => allObjects.push(region));

				if (allObjects.length > 0) {
					fc.discardActiveObject();
					const activeSelection = new fabricApi.ActiveSelection(allObjects, {
						canvas: fc
					});
					fc.setActiveObject(activeSelection);
					fc.requestRenderAll();
				}
				event.preventDefault();
				return;
			}
		}

		if (event.code === 'Escape') {
			fc.discardActiveObject();
			fc.requestRenderAll();
			event.preventDefault();
			return;
		}

		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
			if (activeObject) {
				const delta = event.shiftKey ? 10 : 1;
				if (event.code === 'ArrowUp') {
					activeObject.set({ top: (activeObject.top ?? 0) - delta });
				} else if (event.code === 'ArrowDown') {
					activeObject.set({ top: (activeObject.top ?? 0) + delta });
				} else if (event.code === 'ArrowLeft') {
					activeObject.set({ left: (activeObject.left ?? 0) - delta });
				} else if (event.code === 'ArrowRight') {
					activeObject.set({ left: (activeObject.left ?? 0) + delta });
				}
				activeObject.setCoords();

				const textId = activeObject.data?.textId as string | undefined;
				if (textId) {
					onTextOverlayUpdate?.(textId, {
						x: Math.round(activeObject.left ?? 0),
						y: Math.round(activeObject.top ?? 0)
					});
				}

				const regionId = activeObject.data?.regionId as string | undefined;
				if (regionId && onRegionMoved) {
					const rect = activeObject.item(0);
					onRegionMoved(regionId, {
						bboxX: Math.round(activeObject.left ?? 0),
						bboxY: Math.round(activeObject.top ?? 0),
						bboxW: Math.round((rect.width ?? 0) * (rect.scaleX ?? 1)),
						bboxH: Math.round((rect.height ?? 0) * (rect.scaleY ?? 1))
					});
				}

				fc.requestRenderAll();
				event.preventDefault();
			}
		}
	};

	const centerRegion = (regionId: string): void => {
		const target = regionObjects.get(regionId);
		if (!target || !fc) return;
		fc.setActiveObject(target);
		const center = target.getCenterPoint();
		const viewport = fc.viewportTransform ?? [currentZoom, 0, 0, currentZoom, 0, 0];
		viewport[4] = fc.getWidth() / 2 - center.x * currentZoom;
		viewport[5] = fc.getHeight() / 2 - center.y * currentZoom;
		fc.setViewportTransform(viewport);
		fc.requestRenderAll();
	};

	const loadImage = async (): Promise<void> => {
		if (!fabricApi || !fc) return;
		const image = await new Promise<any>((resolve, reject) => {
			fabricApi.Image.fromURL(
				imageUrl,
				(img: any) => {
					if (!img) reject(new Error('Image load failed'));
					resolve(img);
				},
				{ crossOrigin: 'anonymous' }
			);
		});
		image.set({ left: 0, top: 0, selectable: false, evented: false });
		fc.setBackgroundImage(image, () => {
			setCanvasSize(image.width, image.height);
			fitToScreen();
			renderAllOverlays();
		});
	};

	const attachEvents = (): void => {
		if (!fc) return;
		fc.on('selection:created', (event: any) => {
			const selected = event.selected?.[0];
			if (selected?.data?.type === 'region') {
				activeRegionId.set(selected.data.regionId);
				onActiveTextChange?.(null);
				return;
			}
			if (selected?.data?.type === 'text') {
				activeRegionId.set(null);
				onActiveTextChange?.(selected.data.textId);
			}
		});
		fc.on('selection:updated', (event: any) => {
			const selected = event.selected?.[0];
			if (selected?.data?.type === 'region') {
				activeRegionId.set(selected.data.regionId);
				onActiveTextChange?.(null);
			} else if (selected?.data?.type === 'text') {
				activeRegionId.set(null);
				onActiveTextChange?.(selected.data.textId);
			}
		});
		fc.on('selection:cleared', () => {
			activeRegionId.set(null);
			onActiveTextChange?.(null);
		});
		fc.on('object:modified', (event: any) => {
			const target = event.target;
			if (target?.data?.type === 'region') {
				const regionId = target?.data?.regionId as string | undefined;
				if (!regionId || !onRegionMoved) return;
				const rect = target.item(0);
				onRegionMoved(regionId, {
					bboxX: Math.round(target.left ?? 0),
					bboxY: Math.round(target.top ?? 0),
					bboxW: Math.round((rect.width ?? 0) * (rect.scaleX ?? 1)),
					bboxH: Math.round((rect.height ?? 0) * (rect.scaleY ?? 1))
				});
				rect.set({ scaleX: 1, scaleY: 1 });
				target.addWithUpdate();
				fc.requestRenderAll();
				return;
			}
			if (target?.data?.type === 'text') {
				syncTextUpdate(target);
				fc.requestRenderAll();
			}
		});
		fc.on('text:changed', (event: any) => {
			syncTextUpdate(event.target);
		});
		fc.on('mouse:wheel', (opt: any) => {
			let nextZoom = fc.getZoom() * Math.pow(0.999, opt.e.deltaY);
			nextZoom = Math.min(Math.max(nextZoom, zoomMin), zoomMax);
			fc.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, nextZoom);
			currentZoom = nextZoom;
			opt.e.preventDefault();
			opt.e.stopPropagation();
			updateOverlayScale();
		});
		fc.on('mouse:down', (opt: any) => {
			if (drawingMode) {
				const pointer = fc.getPointer(opt.e);
				drawingStart = { x: pointer.x, y: pointer.y };
				fc.selection = false;
				return;
			}
			if (opt.e.button === 1 || isSpaceHeld) {
				isPanning = true;
				fc.selection = false;
				const pointer = fc.getPointer(opt.e);
				lastPanPoint = { x: pointer.x, y: pointer.y };
				fc.defaultCursor = 'grabbing';
			}
		});
		fc.on('mouse:move', (opt: any) => {
			if (drawingMode && drawingStart) {
				const pointer = fc.getPointer(opt.e);
				const left = Math.min(drawingStart.x, pointer.x);
				const top = Math.min(drawingStart.y, pointer.y);
				const width = Math.abs(pointer.x - drawingStart.x);
				const height = Math.abs(pointer.y - drawingStart.y);
				if (!previewRect) {
					previewRect = new fabricApi.Rect({
						left,
						top,
						width,
						height,
						fill: 'rgba(103, 80, 164, 0.2)',
						stroke: '#6750a4',
						strokeWidth: 2 / currentZoom,
						strokeDashArray: [5, 5],
						evented: false
					});
					fc.add(previewRect);
				} else {
					previewRect.set({ left, top, width, height });
				}
				fc.requestRenderAll();
				return;
			}
			if (!isPanning) return;
			const pointer = fc.getPointer(opt.e);
			const dx = pointer.x - lastPanPoint.x;
			const dy = pointer.y - lastPanPoint.y;
			fc.relativePan({ x: dx, y: dy });
			lastPanPoint = { x: pointer.x, y: pointer.y };
		});
		fc.on('mouse:up', (opt: any) => {
			if (drawingMode && drawingStart) {
				const pointer = fc.getPointer(opt.e);
				const left = Math.min(drawingStart.x, pointer.x);
				const top = Math.min(drawingStart.y, pointer.y);
				const width = Math.abs(pointer.x - drawingStart.x);
				const height = Math.abs(pointer.y - drawingStart.y);
				if (previewRect) {
					fc.remove(previewRect);
					previewRect = null;
				}
				if (width >= 10 && height >= 10) {
					onRegionCreated?.({
						bboxX: Math.round(left),
						bboxY: Math.round(top),
						bboxW: Math.round(width),
						bboxH: Math.round(height)
					});
				}
				drawingStart = null;
				fc.selection = true;
				return;
			}
			isPanning = false;
			fc.selection = true;
			fc.defaultCursor = 'default';
		});
	};

	onMount(() => {
		const keyDown = (event: KeyboardEvent): void => {
			if (event.code === 'Space') {
				const isInput =
					event.target instanceof HTMLInputElement ||
					event.target instanceof HTMLTextAreaElement ||
					(event.target as HTMLElement).isContentEditable;
				if (!isInput) {
					isSpaceHeld = true;
				}
			}
		};
		const keyUp = (event: KeyboardEvent): void => {
			if (event.code === 'Space') isSpaceHeld = false;
		};
		window.addEventListener('keydown', keyDown);
		window.addEventListener('keyup', keyUp);
		window.addEventListener('keydown', handleKeyboard);
		void import('fabric').then(async (module) => {
			fabricApi = module.fabric;
			fc = new fabricApi.Canvas(canvasEl as HTMLCanvasElement, {
				selection: true,
				preserveObjectStacking: true,
				renderOnAddRemove: false,
				defaultCursor: 'grab'
			});
			setCanvasSize();
			attachEvents();
			await loadImage();
			resizeObserver = new ResizeObserver(() => {
				setCanvasSize();
				fitToScreen();
			});
			if (rootEl) resizeObserver.observe(rootEl);
			onExportReady?.({ exportAsPNG, exportAsPDF });
			onCanvasReady?.({
				setLayerVisibility,
				bringForward,
				sendBackward,
				bringToFront,
				sendToBack
			});
		});

		return () => {
			window.removeEventListener('keydown', keyDown);
			window.removeEventListener('keyup', keyUp);
			window.removeEventListener('keydown', handleKeyboard);
			resizeObserver?.disconnect();
			fc?.dispose();
		};
	});

	$effect(() => {
		if (!fc) return;
		renderAllOverlays();
	});

	$effect(() => {
		if (!fc || !imageUrl) return;
		void loadImage();
	});

	$effect(() => {
		if (!fc) return;
		resetSignal;
		fitToScreen();
	});

	$effect(() => {
		const unsubscribe = activeRegionId.subscribe((id) => {
			if (!id || suppressCanvasSync) return;
			suppressCanvasSync = true;
			centerRegion(id);
			suppressCanvasSync = false;
		});
		return () => unsubscribe();
	});

	$effect(() => {
		if (!fc || !rootEl) return;
		if (drawingMode) {
			rootEl.style.cursor = 'crosshair';
			fc.selection = false;
		} else {
			rootEl.style.cursor = 'default';
			fc.selection = true;
		}
	});

	$effect(() => {
		if (!fc) return;
		for (const group of regionObjects.values()) {
			group.set({ visible: !previewMode });
		}
		for (const text of textObjects.values()) {
			text.set({ visible: !previewMode });
		}
		fc.requestRenderAll();
	});

	$effect(() => {
		if (!fc) return;
		renderAllOverlays();
	});

	$effect(() => {
		if (!fc || !imageUrl) return;
		void loadImage();
	});

	$effect(() => {
		if (!fc) return;
		resetSignal;
		fitToScreen();
	});

	$effect(() => {
		const unsubscribe = activeRegionId.subscribe((id) => {
			if (!id || suppressCanvasSync) return;
			suppressCanvasSync = true;
			centerRegion(id);
			suppressCanvasSync = false;
		});
		return () => unsubscribe();
	});

	$effect(() => {
		if (!fc || !rootEl) return;
		if (drawingMode) {
			rootEl.style.cursor = 'crosshair';
			fc.selection = false;
		} else {
			rootEl.style.cursor = 'default';
			fc.selection = true;
		}
	});

	$effect(() => {
		if (!fc) return;
		for (const group of regionObjects.values()) {
			group.set({ visible: !previewMode });
		}
		for (const text of textObjects.values()) {
			text.set({ visible: !previewMode });
		}
		fc.requestRenderAll();
	});
</script>

<div class="canvas-root" bind:this={rootEl}>
	<canvas bind:this={canvasEl}></canvas>
	{#if renderedImageUrl}
		<img class="preview-overlay" src={renderedImageUrl} alt="Preview" />
	{/if}
	{#if onEnterPreview && !renderedImageUrl}
		<button class="preview-enter-btn" type="button" onclick={onEnterPreview}>
			Generate Preview
		</button>
	{/if}
</div>

<style>
	.canvas-root {
		height: 100%;
		width: 100%;
		overflow: hidden;
		background: #f3edf7;
		border-radius: 16px;
		position: relative;
	}

	canvas {
		display: block;
	}

	.preview-overlay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
		border-radius: 16px;
	}

	.preview-enter-btn {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		padding: 0.5rem 1rem;
		background: #6750a4;
		color: #fff;
		border: none;
		border-radius: 999px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}
</style>
