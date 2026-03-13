<svelte:head>
	<title>Settings</title>
</svelte:head>

<main class="md3-page">
	<section class="md3-content">
		<div class="md3-surface">
			<h1 class="md3-title">Settings</h1>
			<p class="md3-subtitle">Control profile, AI key, and default translation preferences.</p>
			<form class="md3-form">
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
				<div class="md3-actions">
					<button class="md3-button" type="button">Save settings</button>
					<a class="md3-chip" href="/settings/plan">Plan & usage</a>
				</div>
			</form>
		</div>
	</section>
</main>
