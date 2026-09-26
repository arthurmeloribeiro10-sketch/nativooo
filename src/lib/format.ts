export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || "Apollo";
}
