<script lang="ts">
	import { onMount } from 'svelte';
	import { activeRegionId } from '$lib/stores/editor';
	import type { TextOverlay, TextRegion } from './types';

	interface Props {
		imageUrl: string;
		regions: TextRegion[];
		textOverlays: TextOverlay[];
		resetSignal?: number;
		onRegionMoved?: (
			regionId: string,
			next: Pick<TextRegion, 'bboxX' | 'bboxY' | 'bboxW' | 'bboxH'>
		) => void;
		onTextOverlayUpdate?: (textId: string, patch: Partial<TextOverlay>) => void;
		onActiveTextChange?: (textId: string | null) => void;
	}

	let {
		imageUrl,
		regions,
		textOverlays,
		resetSignal = 0,
		onRegionMoved,
		onTextOverlayUpdate,
		onActiveTextChange
	}: Props = $props();

	let rootEl = $state<HTMLDivElement | null>(null);
	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let fc = $state<any>(null);
	let fabricApi = $state<any>(null);
	let currentZoom = $state(1);
	let isPanning = $state(false);
	let isSpaceHeld = $state(false);
	let lastPanPoint = $state({ x: 0, y: 0 });
	let resizeObserver = $state<ResizeObserver | null>(null);
	let regionObjects = new Map<string, any>();
	let textObjects = new Map<string, any>();
	let suppressCanvasSync = $state(false);

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

	const setCanvasSize = (): void => {
		if (!rootEl || !canvasEl || !fc) return;
		const dpr = window.devicePixelRatio || 1;
		const width = Math.max(rootEl.clientWidth, 1);
		const height = Math.max(rootEl.clientHeight, 1);
		canvasEl.width = width * dpr;
		canvasEl.height = height * dpr;
		canvasEl.style.width = `${width}px`;
		canvasEl.style.height = `${height}px`;
		fc.setDimensions({ width, height });
	};

	const fitToScreen = (): void => {
		if (!fc?.backgroundImage) return;
		const bg = fc.backgroundImage;
		const imageWidth = (bg.width ?? 1) * (bg.scaleX ?? 1);
		const imageHeight = (bg.height ?? 1) * (bg.scaleY ?? 1);
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
				ry: 8
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
			if (selected?.data?.type === 'text') {
				onActiveTextChange?.(selected.data.textId);
			}
		});
		fc.on('selection:cleared', () => {
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
			if (opt.e.button === 1 || isSpaceHeld) {
				isPanning = true;
				fc.selection = false;
				lastPanPoint = { x: opt.e.clientX, y: opt.e.clientY };
				fc.defaultCursor = 'grabbing';
			}
		});
		fc.on('mouse:move', (opt: any) => {
			if (!isPanning) return;
			const dx = opt.e.clientX - lastPanPoint.x;
			const dy = opt.e.clientY - lastPanPoint.y;
			fc.relativePan({ x: dx, y: dy });
			lastPanPoint = { x: opt.e.clientX, y: opt.e.clientY };
		});
		fc.on('mouse:up', () => {
			isPanning = false;
			fc.selection = true;
			fc.defaultCursor = 'default';
		});
	};

	onMount(() => {
		const keyDown = (event: KeyboardEvent): void => {
			if (event.code === 'Space') {
				event.preventDefault();
				isSpaceHeld = true;
			}
		};
		const keyUp = (event: KeyboardEvent): void => {
			if (event.code === 'Space') isSpaceHeld = false;
		};
		window.addEventListener('keydown', keyDown);
		window.addEventListener('keyup', keyUp);
		void import('fabric').then(async (module) => {
			fabricApi = module.fabric;
			fc = new fabricApi.Canvas(canvasEl as HTMLCanvasElement, {
				selection: true,
				preserveObjectStacking: true,
				renderOnAddRemove: false
			});
			setCanvasSize();
			attachEvents();
			await loadImage();
			resizeObserver = new ResizeObserver(() => {
				setCanvasSize();
				fitToScreen();
			});
			if (rootEl) resizeObserver.observe(rootEl);
		});

		return () => {
			window.removeEventListener('keydown', keyDown);
			window.removeEventListener('keyup', keyUp);
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
</script>

<div class="canvas-root" bind:this={rootEl}>
	<canvas bind:this={canvasEl}></canvas>
</div>

<style>
	.canvas-root {
		height: 100%;
		width: 100%;
		overflow: hidden;
		background: #f3edf7;
		border-radius: 16px;
	}

	canvas {
		display: block;
	}
</style>
