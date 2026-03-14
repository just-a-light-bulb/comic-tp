<script lang="ts">
	let { params } = $props();
</script>

<svelte:head>
	<title>Edit chapter</title>
</svelte:head>

<main class="manga-page">
	<section class="manga-content">
		<div class="panel-frame">
			<h1 class="manga-title">Edit chapter #{params.cid}</h1>
			<form class="manga-form">
				<label>
					Title
					<input value={`Chapter ${params.cid}`} />
				</label>
				<label>
					Reorder pages
					<input placeholder="1,2,3" />
				</label>
				<div class="manga-actions">
					<button class="btn-primary" type="button">Save chapter</button>
					<button class="btn-secondary" type="button">Delete chapter</button>
				</div>
			</form>
		</div>
	</section>
</main>
