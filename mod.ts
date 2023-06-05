import 'https://deno.land/std@0.190.0/dotenv/load.ts';

import './src/routes/mod.ts';
import './src/localization/mod.ts';
import { registerGlobalCommands } from './src/commands/mod.ts';
registerGlobalCommands().catch(console.error);