<script lang="ts">
	let { params } = $props();
</script>

<svelte:head>
	<title>Page preview</title>
</svelte:head>

<main class="md3-page">
	<section class="md3-content">
		<header class="md3-surface md3-header">
			<h1 class="md3-title">Preview page #{params.pageId}</h1>
			<a class="md3-link-button" href={`/editor/${params.pageId}`}>Back to editor</a>
		</header>

		<div class="md3-surface" style="max-width:760px">
			<img
				src={`https://picsum.photos/1000/1400?preview-${params.pageId}`}
				alt="Rendered preview"
				style="width:100%;border-radius:20px"
			/>
		</div>
	</section>
</main>
