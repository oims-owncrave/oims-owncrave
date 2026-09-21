import { NAV_DATA, type NavSection, type UserRole } from ".";

const boleh = (roles: UserRole[] | undefined, role: UserRole) =>
  !roles || roles.includes(role);

/**
 * Saring NAV_DATA untuk satu role, sampai level subitem.
 * Section/item yang jadi kosong setelah disaring ikut dibuang — kalau tidak,
 * muncul judul section tanpa isi.
 */
export function navUntukRole(role: UserRole): NavSection[] {
  return NAV_DATA
    .filter((s) => (!s.ownerOnly || role === "owner") && boleh(s.roles, role))
    .map((s) => ({
      ...s,
      items: s.items
        .filter((i) => boleh(i.roles, role))
        .map((i) => ({ ...i, items: i.items.filter((si) => boleh(si.roles, role)) }))
        // item yang PUNYA subitem tapi semuanya tersaring habis = buang.
        // Item tanpa subitem (url langsung) tetap dipertahankan.
        .filter((i) => i.items.length > 0 || !!i.url),
    }))
    .filter((s) => s.items.length > 0);
}
