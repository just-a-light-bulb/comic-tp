<script lang="ts">
	let { params } = $props();
</script>

<svelte:head>
	<title>New chapter</title>
</svelte:head>

<main class="manga-page">
	<section class="manga-content">
		<div class="panel-frame">
			<h1 class="manga-title">Create chapter for project #{params.pid}</h1>
			<form class="manga-form">
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
				<button class="btn-primary" type="button">Create chapter</button>
			</form>
		</div>
	</section>
</main>
