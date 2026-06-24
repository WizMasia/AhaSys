/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

export interface LawArticle {
  id: string;
  tier: number;
  domain: string;
  clause: string;
  text: string;
  keywords: string[];
}

function loadLibraryFromJson(): LawArticle[] {
  try {
    const jsonPath = path.join(process.cwd(), 'server', 'db', 'regulatory_library.json');
    const content = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to load regulatory library from JSON file:", err);
    return [];
  }
}

export const REGULATORY_LIBRARY: LawArticle[] = loadLibraryFromJson();
