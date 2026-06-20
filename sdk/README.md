# @astrix/sdk

TypeScript SDK for the Astrix API.

```ts
import { AstrixClient } from '@astrix/sdk';

const client = new AstrixClient({ baseUrl: 'http://localhost:3000' });
const response = await client.ping();
```
