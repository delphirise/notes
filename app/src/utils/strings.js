export function compactList(values) {
  return (values ?? []).map((value) => String(value).trim()).filter(Boolean);
}

export function humanizeList(values) {
  const items = compactList(values);

  if (items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

export function replaceTokens(template, values) {
  return String(template ?? '').replace(/{{\s*([\w.-]+)\s*}}/g, (_, token) => {
    const value = values?.[token];
    return value == null ? '' : String(value);
  });
}
