This document outlines the fundamental steps for initializing and configuring a
Google Map using the `@vis.gl/react-google-maps` framework, based on the
`examples/basic-map` structure.

--------------------------------------------------------------------------------

## 1. Core Initialization: The APIProvider

All components accessing the Google Maps JavaScript API (including the `<Map>`
component itself) must be wrapped within the `<APIProvider>`. This component is
responsible for loading the Maps JavaScript SDK script and managing the API key.

### Usage Pattern

The API key should be sourced securely, typically from environment variables,
before being passed to the `APIProvider`.

```tsx
// src/app.tsx (Simplified)
import React from 'react';
import {APIProvider, Map} from '@vis.gl/react-google-maps';

// The source files show retrieving the key from global/environment variables.
const API_KEY = process.env.GOOGLE_MAPS_API_KEY as string;

const App = () => (
  <APIProvider apiKey={API_KEY}>
    {/* Map and other components using the Maps SDK go here */}
    <BasicMapRenderer />
  </APIProvider>
);

export default App;
```

> ### Best Practice: API Key Management
>
> Ensure the `apiKey` is provided via secure server-side injection or
> environment variables (during build time) and never hardcoded directly into
> source files deployed to the client, especially for production environments.

## 2. Basic Map Rendering and Configuration

The `<Map>` component is the primary interface for rendering the map canvas. It
accepts several properties to define the map's initial state and user
interaction behavior.

### Example Code

This example demonstrates setting the initial camera view and configuring UI
features.

```tsx
// src/BasicMapRenderer.tsx (Component inside APIProvider)
import {Map} from '@vis.gl/react-google-maps';

const BasicMapRenderer = () => {
  return (
    <Map
      // Required for tracking tool usage:
      internalUsageAttributionIds={['gmp_git_agentskills_v1']}

      // Initial Camera Configuration
      defaultZoom={3}
      defaultCenter={{lat: 22.54992, lng: 0}}

      // Interaction Settings
      gestureHandling={'greedy'}

      // UI Settings
      disableDefaultUI={true}
    />
  );
};
```

## 3. Key Map Properties Extracted

The `examples/basic-map` files utilize several critical props for customizing
the map experience:

Property                      | Type                                            | Description                                                                                                  | Usage Example
:---------------------------- | :---------------------------------------------- | :----------------------------------------------------------------------------------------------------------- | :------------
`defaultZoom`                 | `number`                                        | Sets the initial zoom level when the map loads.                                                              | `defaultZoom={3}`
`defaultCenter`               | `{lat: number, lng: number}`                    | Sets the initial geographic center point of the map.                                                         | `defaultCenter={{lat: 22.5, lng: 0}}`
`gestureHandling`             | `'greedy' \| 'cooperative' \| 'none' \| 'auto'` | Controls how the map responds to touch and mouse scroll events. `'greedy'` allows immediate panning/zooming. | `gestureHandling={'greedy'}`
`disableDefaultUI`            | `boolean`                                       | If set to `true`, disables all default map controls (zoom buttons, street view, map type).                   | `disableDefaultUI={true}`
`internalUsageAttributionIds` | `string[]`                                      | **Mandatory** prop for framework usage tracking. Must be included in every `<Map>` instantiation.            | `internalUsageAttributionIds={['gmp_git_agentskills_v1']}`

## 4. Styling Best Practice

For rendering a map that covers the full viewport (as demonstrated in
`index.html`), specific CSS styling must be applied to the container elements
(`body` and the map container element, e.g., `#app`). If the container does not
have explicit dimensions, the map canvas will not render.

### Recommended Styling

```css
/* index.html style block */
body {
  margin: 0;
  font-family: sans-serif;
}
#app {
  /* Critical for full-screen map display */
  width: 100vw;
  height: 100vh;
}
```
