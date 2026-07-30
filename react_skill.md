---
name: gmp-framework-react
description: This skill provides the authoritative guide and expert configuration patterns for integrating Google Maps Platform services into applications built with the React framework and TypeScript. The documentation strictly mandates the use of the official Google-developed library, `@vis.gl/react-google-maps`, and focuses exclusively on modern, cost-efficient APIs such as Advanced Markers, Routes API, and Places API (New). Developers should use this resource to ensure rapid feature implementation while rigorously avoiding deprecated components and common integration pitfalls specific to the React environment, such as prop serialization issues and incorrect library loading.
license: Apache-2.0
metadata:
  version: 1.0.58
---

> [!IMPORTANT] **Core Dependency:** This skill requires active context from
> [google-maps-platform/SKILL.md](https://www.gstatic.com/googlemapsplatform-agent-skills/google-maps-platform/SKILL.md).

# Google Maps Platform for React Developers (TypeScript Focus)

This guide serves as the mandatory entry point for implementing Google Maps
Platform features within React applications, leveraging the officially
supported, performance-optimized library: **`@vis.gl/react-google-maps`**.

As an expert developer, you must prioritize modern, promise-based APIs and
strictly adhere to the React component model principles (hooks, functional
components, side-effect isolation). This approach ensures maintainability,
optimal performance, and future compatibility, specifically addressing the
deprecation of legacy services like `google.maps.Marker`, `DirectionsService`,
and the old Places classes.

--------------------------------------------------------------------------------

## 1. Guardrails Against Hallucinations

To maintain accuracy and prevent the use of non-existent or unsupported API
methods, you **MUST** strictly adhere to the following rules derived from the
Core Documentation:

1.  **Verify Library Exports**: Do NOT assume or invent component names,
    classes, methods, or variable names that are not explicitly documented in
    the provided skills or references.
2.  **Framework Convention**: When utilizing framework wrappers (e.g.,
    `@vis.gl/react-google-maps`), ensure component names follow the documented
    framework convention (e.g., `AdvancedMarker`) instead of the core JavaScript
    API names (e.g., `AdvancedMarkerElement`), unless explicitly instructed
    otherwise.
3.  **No Invented Parameters**: Do not use fake parameters or options in API
    calls. Stick strictly to the official API contracts documented in the
    skills.
4.  **References First**: Before using any Google Maps Platform class,
    component, or service, you MUST look up the provided reference files to see
    how it is imported and used. Do not rely on your pre-trained knowledge for
    API contracts, imports, or component usage.

--------------------------------------------------------------------------------

## 2. Best Practices for React/TypeScript Integration

When developing within the React ecosystem using `@vis.gl/react-google-maps` and
TypeScript, adhere to these mandatory guidelines to prevent runtime errors,
desynchronization, and silent component failures (Critical Failures CF5, CF8,
CF9).

Rule                          | Problem Avoided                                      | Mandatory Pattern/Reference
:---------------------------- | :--------------------------------------------------- | :--------------------------
**Initialization & Identity** | Rendering race conditions, missing advanced markers. | Initialize with `@vis.gl/react-google-maps` hooks. Supply `mapId` (or `"DEMO_MAP_ID"`) and `internalUsageAttributionIds={['gmp_git_agentskills_v1']}` to the `<Map>` component.
**Legacy Avoidance**          | Runtime crash (`LegacyApiNotActivatedMapError`).     | **NEVER** use `google.maps.Marker` or `DirectionsService`. **MUST** use `AdvancedMarker` component and `Route.computeRoutes()`.
**Web Components**            | Failed prop passing (CF8).                           | For `<gmp-*>` components (e.g., `<gmp-place-autocomplete>`), mount imperatively with `useRef` + `useEffect` and assign complex properties on the DOM element directly. Use the JSX namespace declaration.
**Casing and Schemas**        | 400 Bad Request errors, undefined JS fields.         | Adhere strictly to API schema structures: JS SDK uses capitalized acronyms (`websiteURI`), while direct REST API payloads use camelCase (`websiteUri`). Nest complex Route parameters exactly as specified in the REST schemas.
**Cleanup**                   | Memory leaks, duplicate elements.                    | Wrap imperative SDK instances (maps, overlays, polylines) in `useRef` and clean up on unmount inside `useEffect` (e.g., `return () => poly.setMap(null);`).
**TypeScript Config**         | Build failures from warnings/typings.                | Configure `tsconfig.json` with `"moduleResolution": "bundler"`, and enable `skipLibCheck: true`. Use `as any` when accessing dynamically imported libraries (e.g., `(routesLib as any).Route`).

--------------------------------------------------------------------------------

## 3. Reference Documentation Index

Use the table below to quickly route to detailed reference documentation for
implementation patterns within the React framework.

Feature Area                | Description                                                                                                | Reference File
:-------------------------- | :--------------------------------------------------------------------------------------------------------- | :-------------
**Foundation & Core**       | Basic setup, provider usage, and initial map configuration.                                                | [example\_basic.md]
**Initialization Template** | Complete boilerplate for a modern `@vis.gl/react-google-maps` application structure.                       | [example\_\_template.md]
**Map Configuration**       | Dynamic styling, camera control, and advanced 3D map component usage.                                      | [example\_change.md], [example\_map.md]
**TypeScript Globals**      | Global API key handling and ambient type declarations for React.                                           | [example\_global.d.ts.txt.md]
**Modern Markers**          | Advanced Marker component usage and interactive component composition.                                     | [example\_advanced.md]
**Marker Clustering**       | High-performance, modern marker clustering patterns (including Web Worker and imperative synchronization). | [example\_marker.md], [example\_worker.md]
**Places API (New)**        | Implementing modern Autocomplete patterns using the Data API and UI Kit.                                   | [example\_autocomplete.md], [example\_places.md]
**Routes API (JS SDK)**     | Client-side route calculation and visualization using the modern `Route` class.                            | [example\_directions.md], [example\_routes.md]
**Geometry & Overlays**     | Drawing polylines, polygons, and handling encoded path data.                                               | [example\_geometry.md]
**Data Visualization**      | Integrating third-party data visualization layers like Deck.gl and Heatmap Layer.                          | [example\_deckgl.md], [example\_heatmap.md]
**UI/Layout Patterns**      | Component styling, UI structure, and usage of the Extended Component Library (ECL).                        | [example\_examples.css.txt.md], [example\_extended.md]
**Drawing Tools**           | Custom map drawing implementation using third-party library patterns (TerraDraw).                          | [example\_drawing.md], [example\_terra.md]
**SSR Frameworks**          | Specific integration patterns for Next.js (App Router) and Remix (SSR-Safe).                               | [example\_nextjs.md], [example\_remix.md]
**Advanced Features**       | Synchronizing multiple maps, handling loading status, and homepage header patterns.                        | [example\_multiple.md], [example\_react.md], [example\_homepage.md]
**Static Maps**             | Patterns for displaying static map images within the React environment.                                    | [example\_static.md]

### Mandatory settings

The `internalUsageAttributionIds` property is mandatory for all uses of the
Google Maps Platform React framework components (e.g., `<Map>`). This prop
ensures correct internal usage tracking and must be included in every
instantiation of the primary map component.

You must set the attribution ID to `gmp_git_agentskills_v1`.

#### React Prop

```jsx
<Map
  // CRITICAL: Required for tracking tool usage:
  internalUsageAttributionIds={['gmp_git_agentskills_v1']}

  // Initial Camera Configuration
  defaultCenter={{lat: 40.7, lng: -74}}
  defaultZoom={12}
/>
```

## 🚀 Master Orchestration Integration Workflow

Follow this multi-phase sequential integration checklist to compose features
robustly. For each phase, read the referenced sub-workflow reference file and
satisfy its *Verification Checkpoint* before advancing.

### 📦 Phase 1: Core Initialization & Base Setup (Primary)

-   [ ] **Step 1.1: Core Setup - core** Read
    [references/example_core.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_core.md). *Trigger
    Condition*: Always active during boilerplate layout or initial framework
    loading pass. *Verification Checkpoint*: Ensure the core core structure is
    initialized properly, and verify functionality compiles without errors.

### 📦 Phase 2: Component Integration & Feature Layers (Supplemental)

-   [ ] **Step 2.1: Feature Layer - Foundation Template for
    @vis.gl/react-google-maps Initialization** Read
    [references/example__template.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example__template.md). *Trigger
    Condition*: Triggered when the user application requires specific foundation
    template for @vis.gl/react-google-maps initialization features integration.
    *Verification Checkpoint*: Ensure the foundation template for
    @vis.gl/react-google-maps initialization elements are rendered correctly,
    and verify event callbacks handle data safely.
-   [ ] **Step 2.2: Feature Layer - Advanced Marker Patterns and Interactive
    Components in React Google Maps** Read
    [references/example_advanced.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_advanced.md). *Trigger
    Condition*: Triggered when the user application requires specific advanced
    marker patterns and interactive components in react google maps features
    integration. *Verification Checkpoint*: Ensure the advanced marker patterns
    and interactive components in react google maps elements are rendered
    correctly, and verify event callbacks handle data safely.
-   [ ] **Step 2.3: Feature Layer - React Google Maps: Places Autocomplete Data
    API Patterns and Implementation Guide** Read
    [references/example_autocomplete.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_autocomplete.md).
    *Trigger Condition*: Triggered when the user application requires specific
    react google maps: places autocomplete data api patterns and implementation
    guide features integration. *Verification Checkpoint*: Ensure the react
    google maps: places autocomplete data api patterns and implementation guide
    elements are rendered correctly, and verify event callbacks handle data
    safely.
-   [ ] **Step 2.4: Feature Layer - Basic Map Initialization and React API
    Provider Usage** Read
    [references/example_basic.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_basic.md). *Trigger
    Condition*: Triggered when the user application requires specific basic map
    initialization and react api provider usage features integration.
    *Verification Checkpoint*: Ensure the basic map initialization and react api
    provider usage elements are rendered correctly, and verify event callbacks
    handle data safely.
-   [ ] **Step 2.5: Feature Layer - Dynamic Map Styling and Configuration
    Switching in React Maps** Read
    [references/example_change.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_change.md). *Trigger
    Condition*: Triggered when the user application requires specific dynamic
    map styling and configuration switching in react maps features integration.
    *Verification Checkpoint*: Ensure the dynamic map styling and configuration
    switching in react maps elements are rendered correctly, and verify event
    callbacks handle data safely.
-   [ ] **Step 2.6: Feature Layer - Advanced Custom Marker Clustering and
    GeoJSON Integration in React Maps** Read
    [references/example_custom.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_custom.md). *Trigger
    Condition*: Triggered when the user application requires specific advanced
    custom marker clustering and geojson integration in react maps features
    integration. *Verification Checkpoint*: Ensure the advanced custom marker
    clustering and geojson integration in react maps elements are rendered
    correctly, and verify event callbacks handle data safely.
-   [ ] **Step 2.7: Feature Layer - Integrating Deck.gl Overlays with React
    Google Maps (@vis.gl/react-google-maps)** Read
    [references/example_deckgl.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_deckgl.md). *Trigger
    Condition*: Triggered when the user application requires specific
    integrating deck.gl overlays with react google maps
    (@vis.gl/react-google-maps) features integration. *Verification Checkpoint*:
    Ensure the integrating deck.gl overlays with react google maps
    (@vis.gl/react-google-maps) elements are rendered correctly, and verify
    event callbacks handle data safely.
-   [ ] **Step 2.8: Feature Layer - Client-Side Route Calculation using
    `@vis.gl/react-google-maps` and Routes API** Read
    [references/example_directions.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_directions.md).
    *Trigger Condition*: Triggered when the user application requires specific
    client-side route calculation using `@vis.gl/react-google-maps` and routes
    api features integration. *Verification Checkpoint*: Ensure the client-side
    route calculation using `@vis.gl/react-google-maps` and routes api elements
    are rendered correctly, and verify event callbacks handle data safely.
-   [ ] **Step 2.9: Feature Layer - React Custom Drawing Tool and State
    Management Patterns** Read
    [references/example_drawing.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_drawing.md). *Trigger
    Condition*: Triggered when the user application requires specific react
    custom drawing tool and state management patterns features integration.
    *Verification Checkpoint*: Ensure the react custom drawing tool and state
    management patterns elements are rendered correctly, and verify event
    callbacks handle data safely.
-   [ ] **Step 2.10: Feature Layer - UI Structure and Styling Patterns for React
    Google Maps Components (CSS Analysis)** Read
    [references/example_examples.css.txt.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_examples.css.txt.md).
    *Trigger Condition*: Triggered when the user application requires specific
    ui structure and styling patterns for react google maps components (css
    analysis) features integration. *Verification Checkpoint*: Ensure the ui
    structure and styling patterns for react google maps components (css
    analysis) elements are rendered correctly, and verify event callbacks handle
    data safely.
-   [ ] **Step 2.11: Feature Layer - React Integration Patterns for Google Maps
    Extended Component Library (ECL)** Read
    [references/example_extended.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_extended.md). *Trigger
    Condition*: Triggered when the user application requires specific react
    integration patterns for google maps extended component library (ecl)
    features integration. *Verification Checkpoint*: Ensure the react
    integration patterns for google maps extended component library (ecl)
    elements are rendered correctly, and verify event callbacks handle data
    safely.
-   [ ] **Step 2.12: Feature Layer - React Google Maps Platform: Geometry
    Overlays and Encoded Paths** Read
    [references/example_geometry.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_geometry.md). *Trigger
    Condition*: Triggered when the user application requires specific react
    google maps platform: geometry overlays and encoded paths features
    integration. *Verification Checkpoint*: Ensure the react google maps
    platform: geometry overlays and encoded paths elements are rendered
    correctly, and verify event callbacks handle data safely.
-   [ ] **Step 2.13: Feature Layer - Global API Key Configuration and React Maps
    Initialization** Read
    [references/example_global.d.ts.txt.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_global.d.ts.txt.md).
    *Trigger Condition*: Triggered when the user application requires specific
    global api key configuration and react maps initialization features
    integration. *Verification Checkpoint*: Ensure the global api key
    configuration and react maps initialization elements are rendered correctly,
    and verify event callbacks handle data safely.
-   [ ] **Step 2.14: Feature Layer - Expert React Heatmap Implementation using
    the Visualization Library** Read
    [references/example_heatmap.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_heatmap.md). *Trigger
    Condition*: Triggered when the user application requires specific expert
    react heatmap implementation using the visualization library features
    integration. *Verification Checkpoint*: Ensure the expert react heatmap
    implementation using the visualization library elements are rendered
    correctly, and verify event callbacks handle data safely.
-   [ ] **Step 2.15: Feature Layer - React Google Maps Platform: Advanced Camera
    Animation and Modern Component Usage (Homepage Header Pattern)** Read
    [references/example_homepage.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_homepage.md). *Trigger
    Condition*: Triggered when the user application requires specific react
    google maps platform: advanced camera animation and modern component usage
    (homepage header pattern) features integration. *Verification Checkpoint*:
    Ensure the react google maps platform: advanced camera animation and modern
    component usage (homepage header pattern) elements are rendered correctly,
    and verify event callbacks handle data safely.
-   [ ] **Step 2.16: Feature Layer - React Google Maps Platform: 3D Mapping and
    Custom UI Control Patterns** Read
    [references/example_map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_map.md). *Trigger Condition*:
    Triggered when the user application requires specific react google maps
    platform: 3d mapping and custom ui control patterns features integration.
    *Verification Checkpoint*: Ensure the react google maps platform: 3d mapping
    and custom ui control patterns elements are rendered correctly, and verify
    event callbacks handle data safely.
-   [ ] **Step 2.17: Feature Layer - React Marker Clustering Pattern using
    Advanced Markers and Imperative Synchronization** Read
    [references/example_marker.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_marker.md). *Trigger
    Condition*: Triggered when the user application requires specific react
    marker clustering pattern using advanced markers and imperative
    synchronization features integration. *Verification Checkpoint*: Ensure the
    react marker clustering pattern using advanced markers and imperative
    synchronization elements are rendered correctly, and verify event callbacks
    handle data safely.
-   [ ] **Step 2.18: Feature Layer - Google Maps Platform React Marker and
    InfoWindow Usage Patterns** Read
    [references/example_markers.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_markers.md). *Trigger
    Condition*: Triggered when the user application requires specific google
    maps platform react marker and infowindow usage patterns features
    integration. *Verification Checkpoint*: Ensure the google maps platform
    react marker and infowindow usage patterns elements are rendered correctly,
    and verify event callbacks handle data safely.
-   [ ] **Step 2.19: Feature Layer - Pattern: Synchronizing Multiple Google Maps
    Instances (Controlled Maps)** Read
    [references/example_multiple.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_multiple.md). *Trigger
    Condition*: Triggered when the user application requires specific pattern:
    synchronizing multiple google maps instances (controlled maps) features
    integration. *Verification Checkpoint*: Ensure the pattern: synchronizing
    multiple google maps instances (controlled maps) elements are rendered
    correctly, and verify event callbacks handle data safely.
-   [ ] **Step 2.20: Feature Layer - React Google Maps Library Usage Patterns in
    Next.js (App Router)** Read
    [references/example_nextjs.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_nextjs.md). *Trigger
    Condition*: Triggered when the user application requires specific react
    google maps library usage patterns in next.js (app router) features
    integration. *Verification Checkpoint*: Ensure the react google maps library
    usage patterns in next.js (app router) elements are rendered correctly, and
    verify event callbacks handle data safely.
-   [ ] **Step 2.21: Feature Layer - Google Maps Platform UI Kit and 3D Map
    Integration Patterns in React** Read
    [references/example_places.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_places.md). *Trigger
    Condition*: Triggered when the user application requires specific google
    maps platform ui kit and 3d map integration patterns in react features
    integration. *Verification Checkpoint*: Ensure the google maps platform ui
    kit and 3d map integration patterns in react elements are rendered
    correctly, and verify event callbacks handle data safely.
-   [ ] **Step 2.22: Feature Layer - React Google Maps SDK Initialization and
    Loading Status Patterns** Read
    [references/example_react.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_react.md). *Trigger
    Condition*: Triggered when the user application requires specific react
    google maps sdk initialization and loading status patterns features
    integration. *Verification Checkpoint*: Ensure the react google maps sdk
    initialization and loading status patterns elements are rendered correctly,
    and verify event callbacks handle data safely.
-   [ ] **Step 2.23: Feature Layer - Google Maps Platform Integration Patterns
    in Remix (SSR-Safe)** Read
    [references/example_remix.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_remix.md). *Trigger
    Condition*: Triggered when the user application requires specific google
    maps platform integration patterns in remix (ssr-safe) features integration.
    *Verification Checkpoint*: Ensure the google maps platform integration
    patterns in remix (ssr-safe) elements are rendered correctly, and verify
    event callbacks handle data safely.
-   [ ] **Step 2.24: Feature Layer - Routes Visualization and Client-Side Data
    Integration Patterns** Read
    [references/example_routes.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_routes.md). *Trigger
    Condition*: Triggered when the user application requires specific routes
    visualization and client-side data integration patterns features
    integration. *Verification Checkpoint*: Ensure the routes visualization and
    client-side data integration patterns elements are rendered correctly, and
    verify event callbacks handle data safely.
-   [ ] **Step 2.25: Feature Layer - Google Maps Platform Static Map
    Implementation using @vis.gl/react-google-maps** Read
    [references/example_static.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_static.md). *Trigger
    Condition*: Triggered when the user application requires specific google
    maps platform static map implementation using @vis.gl/react-google-maps
    features integration. *Verification Checkpoint*: Ensure the google maps
    platform static map implementation using @vis.gl/react-google-maps elements
    are rendered correctly, and verify event callbacks handle data safely.
-   [ ] **Step 2.26: Feature Layer - Integrating Third-Party Libraries with
    React Google Maps: The TerraDraw Pattern** Read
    [references/example_terra.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_terra.md). *Trigger
    Condition*: Triggered when the user application requires specific
    integrating third-party libraries with react google maps: the terradraw
    pattern features integration. *Verification Checkpoint*: Ensure the
    integrating third-party libraries with react google maps: the terradraw
    pattern elements are rendered correctly, and verify event callbacks handle
    data safely.
-   [ ] **Step 2.27: Feature Layer - High-Performance Marker Clustering using
    Web Workers and React Google Maps** Read
    [references/example_worker.md](https://www.gstatic.com/googlemapsplatform-agent-skills/gmp-framework-react/references/example_worker.md). *Trigger
    Condition*: Triggered when the user application requires specific
    high-performance marker clustering using web workers and react google maps
    features integration. *Verification Checkpoint*: Ensure the high-performance
    marker clustering using web workers and react google maps elements are
    rendered correctly, and verify event callbacks handle data safely.
