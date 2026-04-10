// frontend/src/app/auth/endpoints.ts

const V1 = '/api/v1';

export const API = {

  // ── Auth ──────────────────────────────────────────────
  auth: {
    login          : `${V1}/accounts/auth/login/`,
    logout         : `${V1}/accounts/auth/logout/`,
    refresh        : `${V1}/accounts/auth/token/refresh/`,
    me             : `${V1}/accounts/auth/me/`,
    changePassword : `${V1}/accounts/auth/change-password/`,
    registerAgency : `${V1}/accounts/auth/register/agency/`,
    registerTourist: `${V1}/accounts/auth/register/tourist/`,
  },

  // ── Agencies ──────────────────────────────────────────
  agencies: {
    list      : `${V1}/accounts/agencies/`,
    all       : `${V1}/accounts/agencies/all/`,
    me        : `${V1}/accounts/agencies/me/`,
    detail    : (id: number) => `${V1}/accounts/agencies/${id}/`,
    approve   : (id: number) => `${V1}/accounts/agencies/${id}/approve/`,
    reject    : (id: number) => `${V1}/accounts/agencies/${id}/reject/`,
  },

  // ── Users ─────────────────────────────────────────────
  users: {
    list  : `${V1}/accounts/users/`,
    create: `${V1}/accounts/users/create/`,
    detail: (id: number) => `${V1}/accounts/users/${id}/`,
  },

  // ── Locations ─────────────────────────────────────────
  locations: {
    countries: `${V1}/locations/countries/`,
    cities   : `${V1}/locations/cities/`,
    city     : (id: number) => `${V1}/locations/cities/${id}/`,
  },

  // ── Hotels ────────────────────────────────────────────
  hotels: {
    list  : `${V1}/hotels/`,
    detail: (id: number) => `${V1}/hotels/${id}/`,
  },

  // ── Rooms ─────────────────────────────────────────────
  rooms: {
    list  : `${V1}/rooms/`,
    detail: (id: number) => `${V1}/rooms/${id}/`,
  },

  // ── Pricing ───────────────────────────────────────────
  pricing: {
    roomPrices: `${V1}/pricing/room-prices/`,
    seasons   : `${V1}/pricing/seasons/`,
  },

  // ── Services ──────────────────────────────────────────
  services: {
    list      : `${V1}/services/`,
    detail    : (id: number) => `${V1}/services/${id}/`,
    categories: `${V1}/services/categories/`,
  },

  // ── Packages ──────────────────────────────────────────
  packages: {
    list   : `${V1}/packages/`,
    detail : (id: number) => `${V1}/packages/${id}/`,
    addCity: (id: number) => `${V1}/packages/${id}/add-city/`,
  },

  // ── Bookings ──────────────────────────────────────────
  bookings: {
    list          : `${V1}/bookings/`,
    detail        : (id: number) => `${V1}/bookings/${id}/`,
    updateStatus  : (id: number) => `${V1}/bookings/${id}/update-status/`,
    dashboardStats: `${V1}/bookings/dashboard-stats/`,
  },

} as const;