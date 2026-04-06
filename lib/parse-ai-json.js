function stripMarkdownCodeFences(text) {
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match;

  while ((match = fenceRegex.exec(text))) {
    const candidate = match[1].trim();
    if (candidate.startsWith("{") && candidate.endsWith("}")) {
      return candidate;
    }
  }

  return null;
}

function findFirstBalancedJsonObject(text) {
  const firstOpen = text.indexOf("{");
  if (firstOpen === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = firstOpen; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === "\\") {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(firstOpen, i + 1);
      }
    }
  }

  return null;
}

export function parseAiJson(text) {
  if (typeof text !== "string") return null;

  const trimmed = text.trim();
  if (!trimmed) return null;

  const candidates = [trimmed];
  const fenced = stripMarkdownCodeFences(trimmed);
  if (fenced) candidates.push(fenced);

  const balanced = findFirstBalancedJsonObject(trimmed);
  if (balanced) candidates.push(balanced);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Continue trying other candidate formats.
    }
  }

  return null;
}

export function isValidAiJsonResponse(data, requiredKeys) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  return requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(data, key));
}
