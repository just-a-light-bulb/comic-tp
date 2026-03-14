<script lang="ts">
	interface TextStyleState {
		fontSize: number;
		color: string;
		fontWeight: 'normal' | 'bold';
		textAlign: 'left' | 'center' | 'right';
	}

	interface Props {
		onUndo: () => void;
		onRedo: () => void;
		onResetView: () => void;
		onAddText: () => void;
		onToggleDrawingMode: () => void;
		onTogglePreviewMode: () => void;
		onExportPNG: () => void;
		onExportPDF: () => void;
		onUpdateTextStyle: (patch: Partial<TextStyleState>) => void;
		canUndo: boolean;
		canRedo: boolean;
		hasActiveText: boolean;
		isDrawingMode: boolean;
		isPreviewMode: boolean;
		textStyle: () => TextStyleState;
	}

	let {
		onUndo,
		onRedo,
		onResetView,
		onAddText,
		onToggleDrawingMode,
		onTogglePreviewMode,
		onExportPNG,
		onExportPDF,
		onUpdateTextStyle,
		canUndo,
		canRedo,
		hasActiveText,
		isDrawingMode,
		isPreviewMode,
		textStyle
	}: Props = $props();
</script>

<header class="toolbar">
	<div class="brand">
		<p>Comic Trans Studio</p>
		<h1>Pro Canvas Editor</h1>
	</div>

	<div class="actions">
		<button type="button" class="secondary" onclick={onAddText}>+ Textbox</button>
		<button type="button" class="secondary" onclick={onResetView}>Fit</button>
		<button
			type="button"
			class:active={isDrawingMode}
			onclick={onToggleDrawingMode}
			title="Draw region (R)"
		>
			◻
		</button>
		<button
			type="button"
			class:active={isPreviewMode}
			onclick={onTogglePreviewMode}
			title="Toggle preview mode"
		>
			{#if isPreviewMode}👁️{:else}👁{/if}
		</button>
		<button type="button" onclick={onUndo} disabled={!canUndo}>Undo</button>
		<button type="button" onclick={onRedo} disabled={!canRedo}>Redo</button>
		<button type="button" class="secondary" onclick={onExportPNG}>PNG</button>
		<button type="button" class="secondary" onclick={onExportPDF}>PDF</button>
	</div>

	<div class="text-controls" aria-disabled={!hasActiveText}>
		<label>
			Size
			<input
				type="range"
				min="14"
				max="72"
				value={textStyle().fontSize}
				disabled={!hasActiveText}
				oninput={(event) =>
					onUpdateTextStyle({ fontSize: Number((event.currentTarget as HTMLInputElement).value) })}
			/>
		</label>
		<label>
			Color
			<input
				type="color"
				value={textStyle().color}
				disabled={!hasActiveText}
				oninput={(event) =>
					onUpdateTextStyle({ color: (event.currentTarget as HTMLInputElement).value })}
			/>
		</label>
		<button
			type="button"
			class:active={textStyle().fontWeight === 'bold'}
			disabled={!hasActiveText}
			onclick={() =>
				onUpdateTextStyle({
					fontWeight: textStyle().fontWeight === 'bold' ? 'normal' : 'bold'
				})}
		>
			Bold
		</button>
		<div class="align">
			<button
				type="button"
				class:active={textStyle().textAlign === 'left'}
				disabled={!hasActiveText}
				onclick={() => onUpdateTextStyle({ textAlign: 'left' })}
			>
				L
			</button>
			<button
				type="button"
				class:active={textStyle().textAlign === 'center'}
				disabled={!hasActiveText}
				onclick={() => onUpdateTextStyle({ textAlign: 'center' })}
			>
				C
			</button>
			<button
				type="button"
				class:active={textStyle().textAlign === 'right'}
				disabled={!hasActiveText}
				onclick={() => onUpdateTextStyle({ textAlign: 'right' })}
			>
				R
			</button>
		</div>
	</div>
</header>

<style>
	.toolbar {
		display: grid;
		grid-template-columns: auto auto 1fr;
		gap: 0.8rem;
		align-items: center;
		padding: 0.9rem 1rem;
		border-radius: 0;
		background: var(--manga-navy);
		border: 2px solid var(--border-line);
	}

	.brand p {
		margin: 0;
		font-size: 0.72rem;
		color: var(--tone-gray);
		text-transform: uppercase;
		font-family: 'DM Mono', monospace;
		letter-spacing: 0.1em;
	}

	.brand h1 {
		margin: 0.2rem 0 0;
		font-size: 1.05rem;
		color: var(--cream-paper);
		font-family: 'Shippori Mincho B1', serif;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.text-controls {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.45rem;
		padding: 0.45rem 0.6rem;
		border-radius: 0;
		background: var(--panel-light);
		border: 2px solid var(--border-line);
	}

	.text-controls[aria-disabled='true'] {
		opacity: 0.55;
	}

	label {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--ink-black);
		font-family: 'DM Mono', monospace;
	}

	input[type='range'] {
		width: 90px;
	}

	input[type='color'] {
		height: 28px;
		width: 28px;
		border: 2px solid var(--border-line);
		padding: 0;
		background: transparent;
		border-radius: 0;
	}

	button {
		border: none;
		border-radius: 0;
		padding: 0.4rem 0.75rem;
		font-size: 0.78rem;
		font-weight: 600;
		background: var(--panel-red);
		color: #fff;
		font-family: 'DM Mono', monospace;
		cursor: pointer;
		box-shadow: 3px 3px 0 var(--ink-black);
		transition:
			box-shadow 80ms ease,
			transform 80ms ease;
	}

	button:hover {
		box-shadow: 1px 1px 0 var(--ink-black);
		transform: translate(2px, 2px);
	}

	button:active {
		box-shadow: 0 0 0 var(--ink-black);
		transform: translate(3px, 3px);
	}

	button.secondary {
		background: var(--panel-light);
		color: var(--ink-black);
		border: 2px solid var(--border-line);
		box-shadow: 3px 3px 0 var(--panel-red);
	}

	button.secondary:hover {
		box-shadow: 1px 1px 0 var(--panel-red);
		transform: translate(2px, 2px);
	}

	button.secondary:active {
		box-shadow: 0 0 0 var(--panel-red);
		transform: translate(3px, 3px);
	}

	.align {
		display: flex;
		gap: 0.25rem;
	}

	.align button,
	.text-controls > button {
		background: var(--cream-paper);
		color: var(--ink-black);
		box-shadow: 2px 2px 0 var(--tone-gray);
	}

	button.active {
		background: var(--gold-tone);
		color: var(--ink-black);
		box-shadow: 2px 2px 0 var(--panel-red);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		box-shadow: none;
	}

	button:disabled:hover {
		transform: none;
		box-shadow: none;
	}
</style>
