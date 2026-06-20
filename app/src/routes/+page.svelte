<script lang="ts">
	import { AstrixClient } from '@astrix/sdk';

	const client = new AstrixClient({
		baseUrl: window.location.origin
	});

	let test = client.test();
</script>

{test} hello
