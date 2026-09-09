export const paths = {
  visit: (id: string) => `/requests?visit=${id}`,
  patient: (id: string) => `/patients?id=${id}`,
  nurse: (id: string) => `/staff?nurse=${id}`,
  order: (id: string) => `/pharmacy?order=${id}`,
  verification: (id: string) => `/verification?profile=${id}`,
  insurance: (id: string) => `/insurance?policy=${id}`,
};
