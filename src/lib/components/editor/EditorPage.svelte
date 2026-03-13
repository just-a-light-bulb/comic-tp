<script lang="ts">
	import CanvasEditor from '$lib/components/editor/CanvasEditor.svelte';
	import Toolbar from '$lib/components/editor/Toolbar.svelte';
	import TranslationTable from '$lib/components/editor/TranslationTable.svelte';
	import type { TextOverlay, TextRegion } from '$lib/components/editor/types';
	import { ResizableHandle, ResizablePane, ResizablePaneGroup } from '$lib/components/ui/resizable';

	interface Command {
		execute: () => void;
		undo: () => void;
	}

	const demoImageUrl =
		'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=1300&q=80';

	const starterRegions: TextRegion[] = [
		{
			id: 'region-1',
			bubbleIndex: 1,
			bboxX: 180,
			bboxY: 220,
			bboxW: 280,
			bboxH: 220,
			originalText: '今日はやるしかない。',
			translatedText: 'วันนี้ต้องลุยให้ได้',
			confidence: 92,
			isApproved: true
		},
		{
			id: 'region-2',
			bubbleIndex: 2,
			bboxX: 640,
			bboxY: 240,
			bboxW: 240,
			bboxH: 170,
			originalText: '待って！まだ準備が…',
			translatedText: 'เดี๋ยวก่อน! ยังไม่พร้อม...',
			confidence: 74,
			isApproved: false
		},
		{
			id: 'region-3',
			bubbleIndex: 3,
			bboxX: 360,
			bboxY: 760,
			bboxW: 320,
			bboxH: 210,
			originalText: '信じて、私についてきて。',
			translatedText: 'เชื่อฉัน แล้วตามมา',
			confidence: 56,
			isApproved: false
		}
	];

	const starterTexts: TextOverlay[] = [
		{
			id: 'text-1',
			text: 'Hello there! be born a while.',
			x: 196,
			y: 238,
			width: 220,
			fontSize: 26,
			color: '#321f4f',
			fontWeight: 'bold',
			textAlign: 'center'
		}
	];

	let regions = $state<TextRegion[]>(starterRegions);
	let textOverlays = $state<TextOverlay[]>(starterTexts);
	let activeTextId = $state<string | null>(starterTexts[0]?.id ?? null);
	let commands = $state<Command[]>([]);
	let redoCommands = $state<Command[]>([]);
	let resetSignal = $state(0);
	let activeTab = $state<'script' | 'layers' | 'settings'>('script');

	const setRegion = (regionId: string, patch: Partial<TextRegion>): void => {
		regions = regions.map((region) => (region.id === regionId ? { ...region, ...patch } : region));
	};

	const setTextOverlay = (textId: string, patch: Partial<TextOverlay>): void => {
		textOverlays = textOverlays.map((item) => (item.id === textId ? { ...item, ...patch } : item));
	};

	const runCommand = (command: Command): void => {
		command.execute();
		commands = [...commands, command];
		redoCommands = [];
	};

	const updateRegion = (regionId: string, patch: Partial<TextRegion>): void => {
		const current = regions.find((region) => region.id === regionId);
		if (!current) return;
		const previous = Object.fromEntries(
			Object.keys(patch).map((key) => [key, current[key as keyof TextRegion]])
		) as Partial<TextRegion>;
		runCommand({
			execute: () => setRegion(regionId, patch),
			undo: () => setRegion(regionId, previous)
		});
	};

	const updateTextOverlay = (textId: string, patch: Partial<TextOverlay>): void => {
		const current = textOverlays.find((item) => item.id === textId);
		if (!current) return;
		const previous = Object.fromEntries(
			Object.keys(patch).map((key) => [key, current[key as keyof TextOverlay]])
		) as Partial<TextOverlay>;
		runCommand({
			execute: () => setTextOverlay(textId, patch),
			undo: () => setTextOverlay(textId, previous)
		});
	};

	const addTextbox = (): void => {
		const id = `text-${crypto.randomUUID()}`;
		const newText: TextOverlay = {
			id,
			text: 'Type subtitle...',
			x: 220,
			y: 220,
			width: 260,
			fontSize: 28,
			color: '#1d192b',
			fontWeight: 'normal',
			textAlign: 'left'
		};
		runCommand({
			execute: () => {
				textOverlays = [...textOverlays, newText];
				activeTextId = id;
			},
			undo: () => {
				textOverlays = textOverlays.filter((item) => item.id !== id);
				if (activeTextId === id) activeTextId = null;
			}
		});
	};

	const activeTextStyle = $derived(() => {
		const active = textOverlays.find((item) => item.id === activeTextId);
		return {
			fontSize: active?.fontSize ?? 26,
			color: active?.color ?? '#1d192b',
			fontWeight: active?.fontWeight ?? 'normal',
			textAlign: active?.textAlign ?? 'left'
		};
	});

	const updateActiveTextStyle = (patch: Partial<typeof activeTextStyle>): void => {
		if (!activeTextId) return;
		updateTextOverlay(activeTextId, patch);
	};

	const undo = (): void => {
		const command = commands.at(-1);
		if (!command) return;
		command.undo();
		commands = commands.slice(0, -1);
		redoCommands = [...redoCommands, command];
	};

	const redo = (): void => {
		const command = redoCommands.at(-1);
		if (!command) return;
		command.execute();
		redoCommands = redoCommands.slice(0, -1);
		commands = [...commands, command];
	};

	const resetView = (): void => {
		resetSignal += 1;
	};

	const handleKeyboard = (event: KeyboardEvent): void => {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
			event.preventDefault();
			if (event.shiftKey) return redo();
			undo();
		}
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
			event.preventDefault();
			redo();
		}
	};
</script>

<svelte:head>
	<title>Comic Trans Studio | Pro Canvas Mode</title>
</svelte:head>

<svelte:window onkeydown={handleKeyboard} />

<main class="editor-page">
	<Toolbar
		onUndo={undo}
		onRedo={redo}
		onResetView={resetView}
		onAddText={addTextbox}
		onUpdateTextStyle={updateActiveTextStyle}
		canUndo={commands.length > 0}
		canRedo={redoCommands.length > 0}
		hasActiveText={Boolean(activeTextId)}
		textStyle={activeTextStyle}
	/>

	<section class="workspace">
		<aside class="tool-rail" aria-label="Editor tools">
			<button class="active" type="button">✎</button>
			<button type="button">⊕</button>
			<button type="button">T</button>
			<button type="button">◻</button>
			<button type="button">🖱</button>
		</aside>

		<ResizablePaneGroup direction="horizontal" class="pane-group">
			<ResizablePane defaultSize={60} minSize={36}>
				<div class="pane canvas-pane">
					<CanvasEditor
						imageUrl={demoImageUrl}
						{regions}
						{textOverlays}
						{resetSignal}
						onRegionMoved={updateRegion}
						onTextOverlayUpdate={updateTextOverlay}
						onActiveTextChange={(id) => (activeTextId = id)}
					/>
				</div>
			</ResizablePane>
			<ResizableHandle withHandle class="splitter" />
			<ResizablePane defaultSize={40} minSize={28}>
				<div class="pane side-pane">
					<div class="tabs">
						<button
							type="button"
							class:active={activeTab === 'script'}
							onclick={() => (activeTab = 'script')}>Script</button
						>
						<button
							type="button"
							class:active={activeTab === 'layers'}
							onclick={() => (activeTab = 'layers')}>Layers</button
						>
						<button
							type="button"
							class:active={activeTab === 'settings'}
							onclick={() => (activeTab = 'settings')}>Settings</button
						>
					</div>
					{#if activeTab === 'script'}
						<TranslationTable {regions} onUpdateRegion={updateRegion} />
					{:else if activeTab === 'layers'}
						<div class="panel-body">
							<h2>Text layers</h2>
							<div class="layer-list">
								{#each textOverlays as item}
									<button
										type="button"
										class:layer-active={activeTextId === item.id}
										onclick={() => (activeTextId = item.id)}
									>
										<span>{item.text.slice(0, 28)}</span>
										<small>{item.fontSize}px</small>
									</button>
								{/each}
							</div>
						</div>
					{:else}
						<div class="panel-body">
							<h2>Editor guide</h2>
							<p>Use <strong>Script</strong> to edit translations and approvals.</p>
							<p>
								Select any textbox on canvas, then use toolbar controls for font, color, weight, and
								alignment.
							</p>
							<p>Drag regions to adjust bubble areas before final rendering.</p>
						</div>
					{/if}
				</div>
			</ResizablePane>
		</ResizablePaneGroup>
	</section>
</main>

<style>
	.editor-page {
		display: grid;
		grid-template-rows: auto 1fr;
		gap: 0.75rem;
		height: 100dvh;
		padding: 0.85rem;
		background: #fffbfe;
	}

	.workspace {
		display: grid;
		grid-template-columns: 46px 1fr;
		gap: 0.65rem;
		min-height: 0;
	}

	.tool-rail {
		display: grid;
		gap: 0.35rem;
		align-content: start;
		padding: 0.45rem;
		border-radius: 14px;
		background: #f3edf7;
		border: 1px solid rgb(121 116 126 / 24%);
	}

	.tool-rail button {
		aspect-ratio: 1;
		border: none;
		border-radius: 9px;
		background: #e8def8;
	}

	.tool-rail button.active {
		background: #6750a4;
		color: #fff;
	}

	.pane {
		height: 100%;
		padding: 0.45rem;
		border-radius: 16px;
		background: #f3edf7;
		border: 1px solid rgb(121 116 126 / 24%);
	}

	.canvas-pane,
	.side-pane {
		min-height: 0;
	}

	.side-pane {
		display: grid;
		grid-template-rows: auto 1fr;
		gap: 0.45rem;
	}

	.tabs {
		display: flex;
		gap: 0.35rem;
	}

	.tabs button {
		border: none;
		border-radius: 999px;
		padding: 0.35rem 0.75rem;
		background: #e8def8;
		font-size: 0.76rem;
		font-weight: 600;
	}

	.tabs button.active {
		background: #6750a4;
		color: #fff;
	}

	.panel-body {
		height: 100%;
		overflow: auto;
		border-radius: 12px;
		background: #f8f2fb;
		padding: 0.75rem;
	}

	.panel-body h2 {
		margin: 0 0 0.6rem;
		font-size: 0.9rem;
	}

	.panel-body p {
		margin: 0 0 0.55rem;
		font-size: 0.85rem;
		color: #49454f;
	}

	.layer-list {
		display: grid;
		gap: 0.35rem;
	}

	.layer-list button {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border: none;
		border-radius: 10px;
		background: #fff;
	}

	.layer-list button.layer-active {
		background: #ded1f3;
	}

	.layer-list small {
		color: #6f6a74;
	}
</style>
