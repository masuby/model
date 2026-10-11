/** Normalise a place name for joins ("Dar-es-salaam" ≡ "Dar es Salaam"). Kept in its own module so the
 * measured-value engine can use it without importing the model. */
export const placeKey = (name: string | null | undefined): string => String(name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
