<script lang="ts">
	let { params } = $props();
</script>

<svelte:head>
	<title>Edit chapter</title>
</svelte:head>

<main class="md3-page">
	<section class="md3-content">
		<div class="md3-surface">
			<h1 class="md3-title">Edit chapter #{params.cid}</h1>
			<form class="md3-form">
				<label>
					Title
					<input value={`Chapter ${params.cid}`} />
				</label>
				<label>
					Reorder pages
					<input placeholder="1,2,3" />
				</label>
				<div class="md3-actions">
					<button class="md3-button" type="button">Save chapter</button>
					<button class="md3-chip" type="button">Delete chapter</button>
				</div>
			</form>
		</div>
	</section>
</main>
