function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      typeof item === "string" ? item.trim() : String(item ?? "").trim()
    )
    .filter(Boolean);
}

function escapePgTextArrayItem(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function toPgTextArrayLiteral(value) {
  const items = normalizeStringArray(value);
  if (items.length === 0) {
    return "{}";
  }

  return `{${items.map((item) => `"${escapePgTextArrayItem(item)}"`).join(",")}}`;
}

export function toPgJsonbLiteral(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}
