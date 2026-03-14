<svelte:head>
	<title>Settings</title>
</svelte:head>

<main class="manga-page">
	<section class="manga-content">
		<div class="panel-frame">
			<h1 class="manga-title">Settings</h1>
			<p class="manga-subtitle">Control profile, AI key, and default translation preferences.</p>
			<form class="manga-form">
				<label>
					Display name
					<input value="Translator" />
				</label>
				<label>
					OpenRouter API key
					<input type="password" value="sk-***" />
				</label>
				<label>
					Default translation style
					<select><option>Natural</option><option>Formal</option><option>Literal</option></select>
				</label>
				<label><input type="checkbox" checked /> Email notifications</label>
				<div class="manga-actions">
					<button class="btn-primary" type="button">Save settings</button>
					<a class="btn-secondary" href="/settings/plan">Plan & usage</a>
				</div>
			</form>
		</div>
	</section>
</main>
