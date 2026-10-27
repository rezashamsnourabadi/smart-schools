import {build} from 'esbuild';
import {cp,mkdir} from 'node:fs/promises';
await build({entryPoints:{index:'server/index.ts',worker:'server/worker.ts',cli:'server/cli.ts',migrate:'server/migrate.ts',backup:'infra/backup.ts'},outdir:'build/server',bundle:true,platform:'node',format:'esm',target:'node22',packages:'external',sourcemap:true});
await mkdir('build/server/migrations',{recursive:true});await cp('server/migrations','build/server/migrations',{recursive:true});
