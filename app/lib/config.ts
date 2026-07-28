export const APP_CONFIG = {
  appName: "Preparador EUDR · FAF Coffees",
  version: "0.2.1",
  apis: {
    ibgeMunicipalities: "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado&orderBy=nome",
    mapbiomasBase: "https://plataforma.alerta.mapbiomas.org",
  },
  limits: {
    maxGeometryPoints: 100000,
    douglasPeuckerInitialTolerance: 0.0001,
    douglasPeuckerMinTolerance: 1e-9,
    maxSuggestions: 60,
  },
  years: [2020, 2021, 2022, 2023, 2024],
};
