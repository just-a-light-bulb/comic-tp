<svelte:head>
	<title>Plan & usage</title>
</svelte:head>

<main class="manga-page">
	<section class="manga-content">
		<div class="panel-frame">
			<h1 class="manga-title">Plan & storage</h1>
			<p class="manga-subtitle">Track usage and upgrade when chapter volume increases.</p>
			<div style="height:14px;background:var(--border-line);overflow:hidden">
				<span style="display:block;height:100%;width:42%;background:var(--screen-blue)"></span>
			</div>
			<p>4.2 GB / 10 GB</p>
		</div>

		<section class="manga-grid">
			<article class="manga-card">
				<strong>Starter</strong>
				<span>10 GB storage · standard queue</span>
			</article>
			<article class="manga-card">
				<strong>Pro</strong>
				<span>100 GB storage · priority queue</span>
				<button class="btn-primary" type="button">Upgrade</button>
			</article>
		</section>
	</section>
</main>
