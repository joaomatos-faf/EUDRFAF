export const APP_CONFIG = {
  appName: "Preparador EUDR · FAF Coffees",
  version: "0.2.1",
  apis: {
    ibgeMunicipalities: "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado&orderBy=nome",
    gfwBase: "https://data-api.globalforestwatch.org",
  },
  limits: {
    maxGeometryPoints: 100000,
    douglasPeuckerInitialTolerance: 0.0001,
    douglasPeuckerMinTolerance: 1e-9,
    maxSuggestions: 60,
  },
  years: Array.from({ length: Math.max(1, new Date().getFullYear() - 2020 + 1) }, (_, i) => 2020 + i),
};
