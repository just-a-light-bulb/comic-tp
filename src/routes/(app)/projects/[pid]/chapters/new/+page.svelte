<script lang="ts">
	let { params } = $props();
</script>

<svelte:head>
	<title>New chapter</title>
</svelte:head>

<main class="md3-page">
	<section class="md3-content">
		<div class="md3-surface">
			<h1 class="md3-title">Create chapter for project #{params.pid}</h1>
			<form class="md3-form">
				<label>
					Chapter number
					<input type="number" value="1" />
				</label>
				<label>
					Chapter title
					<input placeholder="Chapter title" />
				</label>
				<label>
					Bulk upload pages
					<input type="file" multiple />
				</label>
				<button class="md3-button" type="button">Create chapter</button>
			</form>
		</div>
	</section>
</main>
