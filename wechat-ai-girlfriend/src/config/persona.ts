import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { personaConfigSchema } from './schema.js';
import type { PersonaConfig } from '../types/index.js';

export function loadPersonaConfig(configPath: string): PersonaConfig {
  const absolutePath = resolve(configPath);
  const raw = readFileSync(absolutePath, 'utf-8');
  const parsed = parseYaml(raw);
  return personaConfigSchema.parse(parsed);
}
