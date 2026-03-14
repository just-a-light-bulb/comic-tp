<script lang="ts">
	let { params } = $props();
</script>

<svelte:head>
	<title>Edit project</title>
</svelte:head>

<main class="manga-page">
	<section class="manga-content">
		<div class="panel-frame">
			<h1 class="manga-title">Edit project #{params.pid}</h1>
			<form class="manga-form">
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
				<button class="btn-primary" type="button">Save project</button>
			</form>
		</div>
	</section>
</main>
