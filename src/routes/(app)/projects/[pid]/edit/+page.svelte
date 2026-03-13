<script lang="ts">
	let { params } = $props();
</script>

<svelte:head>
	<title>Edit project</title>
</svelte:head>

<main class="md3-page">
	<section class="md3-content">
		<div class="md3-surface">
			<h1 class="md3-title">Edit project #{params.pid}</h1>
			<form class="md3-form">
				<label>
					Title
					<input value={`Project ${params.pid}`} />
				</label>
				<label>
					Style preset
					<select><option>Natural</option><option>Formal</option></select>
				</label>
				<label>
					Character glossary
					<input type="file" />
				</label>
				<button class="md3-button" type="button">Save project</button>
			</form>
		</div>
	</section>
</main>
