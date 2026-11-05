[English](README.md) · [Español](README.es.md)

# create-jota-js

Genera una app nueva de Jota en TypeScript (por defecto) o JavaScript.

> **Estado: pre-alpha.** El generador funciona y tiene pruebas. Los paquetes `jota-js`, `vite-plugin-jota` y `jota-guard` que instala todavía no tienen un lanzamiento real (sus versiones en npm son marcadores `0.0.1`), así que `npm install` en un proyecto generado solo funcionará después del primer lanzamiento (`^1.0.0`).

```bash
npm create jota-js@latest mi-app             # TypeScript
npm create jota-js@latest mi-app -- --template js
cd mi-app
npm install
npm run dev
```

El proyecto generado trae un componente contador, Vite con `vite-plugin-jota` y un script `npm run guard` que ejecuta Jota Guard. Se niega a escribir en una carpeta que no esté vacía.

## Licencia

MIT © JJBeta
