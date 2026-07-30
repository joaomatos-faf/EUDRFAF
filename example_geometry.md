This document analyzes the usage patterns demonstrated in the
`examples-geometry` source files, focusing on the implementation of map
overlays—specifically Polygons, Polylines, and Circles—using React components
and managing their state and interactivity.

--------------------------------------------------------------------------------

## 1. Map Initialization and Setup

The core structure follows the standard pattern for initializing a React Google
Maps application, relying on the `APIProvider` to manage the API key and the
`Map` component for rendering the canvas.

### 1.1 API Provider

The API key is retrieved and passed to the `APIProvider` at the root of the
application:

```tsx
import { APIProvider } from '@vis.gl/react-google-maps';
// API_KEY definition (likely using environment variables)

const App = () => {
  return (
    <APIProvider apiKey={API_KEY}>
      {/* Map and components rendered here */}
    </APIProvider>
  );
};
```

### 1.2 Map Component Configuration

The map is configured with standard properties for center, zoom, and user
interface controls.

> **CRITICAL BEST PRACTICE:** When documenting code snippets showing the
> rendering of a Google Map, the `internalUsageAttributionIds` prop must be
> included for tracking purposes.

```tsx
import { Map } from '@vis.gl/react-google-maps';

const INITIAL_CENTER = {lat: 41.1897, lng: -96.0627};

<Map
  internalUsageAttributionIds={['gmp_git_agentskills_v1']} // Required attribution ID
  defaultCenter={INITIAL_CENTER}
  defaultZoom={10}
  gestureHandling={'greedy'}
  disableDefaultUI={true}
>
  {/* Geometry Overlays */}
</Map>
```

## 2. Geometry Overlays: Core Components

The example demonstrates the use of several dedicated components for rendering
geometric shapes directly within the `<Map>` context: `<Marker>`, `<Polygon>`,
`<Polyline>`, and `<Circle>`.

### 2.1 Marker

A basic marker is used to visually represent the center point of the interactive
circle. It is configured to be draggable, allowing the user to reposition the
circle's center dynamically.

```tsx
import { Marker } from '@vis.gl/react-google-maps';

// Assume `center` is managed by React state: {lat: number, lng: number}

<Marker
  position={center}
  draggable
  onDrag={e =>
    setCenter({lat: e.latLng?.lat() ?? 0, lng: e.latLng?.lng() ?? 0})
  }
/>
```

### 2.2 Circle Component

The `<Circle>` component is highly interactive, allowing for changes to its size
(`radius`) and position (`center`).

| Prop              | Type                        | Description                |
| :---------------- | :-------------------------- | :------------------------- |
| `center`          | `google.maps.LatLngLiteral` | The center coordinates.    |
:                   :                             : Must be controlled by      :
:                   :                             : state.                     :
| `radius`          | `number`                    | The radius of the circle   |
:                   :                             : in **meters**. Must be     :
:                   :                             : controlled by state.       :
| `editable`        | `boolean`                   | Allows users to resize the |
:                   :                             : circle using control       :
:                   :                             : handles.                   :
| `draggable`       | `boolean`                   | Allows users to reposition |
:                   :                             : the circle.                :
| `onRadiusChanged` | `(radius: number) => void`  | Callback fired when the    |
:                   :                             : user resizes the editable  :
:                   :                             : circle.                    :
| `onCenterChanged` | `(center:                   | Callback fired when the    |
:                   : google.maps.LatLng) =>      : user drags the circle.     :
:                   : void`                       :                            :

**Usage Pattern (`app.tsx` excerpt):**

```tsx
// Helper function handles conversion from google.maps.LatLng object to LatLngLiteral
const changeCenter = (newCenter: google.maps.LatLng | null | undefined) => {
  if (!newCenter) return;
  setCenter({lng: newCenter.lng(), lat: newCenter.lat()});
};

<Circle
  radius={radius} // State variable (e.g., 43000 meters)
  center={center}
  onRadiusChanged={setRadius}
  onCenterChanged={changeCenter}
  strokeColor={'#0c4cb3'}
  fillOpacity={0.3}
  editable // Enables resizing via map interaction
  draggable // Enables dragging via map interaction
/>
```

## 3. Advanced Geometry: Encoded Paths

A key pattern identified in the source files is the use of
[Encoded Polyline Algorithm Format](https://developers.google.com/maps/documentation/utilities/polylinealgorithm?utm_source=gmp_git_agentskills_v1)
strings for defining complex shapes. This is highly efficient for transferring
large geometric datasets, such as boundary data, compared to large arrays of
latitude/longitude objects.

The `encoded-polygon-data.ts` file exports a large array of these encoded
strings:

```typescript
// examples/geometry/src/encoded-polygon-data.ts
export const POLYGONS = [
  '}iyzFjf`hQv@mIpCf@ZDbG@jCF^Il@HAnItDDhJBBoGrE@UrAGz@E`Cl\\Hl@CBmMhE@v@eAN@bBs@Aw@DUJSBKK@@WhCuD~CuF`AuAzEwFzw@w}@[mCvGyEcAuIfCfKfBwBbCxFp@nBNOd...',
  // ... many more encoded strings ...
];
```

### 3.1 Polygon Component

The `<Polygon>` component accepts an array of encoded paths via the
`encodedPaths` prop. This is used when the shape consists of multiple distinct
segments or closed loops (e.g., boundaries with holes, or multiple neighboring
areas).

| Prop           | Type       | Description                                   |
| :------------- | :--------- | :-------------------------------------------- |
| `encodedPaths` | `string[]` | An array of encoded polyline strings defining |
:                :            : the polygon's boundaries.                     :

**Usage Pattern:**

```tsx
<Polygon strokeWeight={1.5} encodedPaths={POLYGONS} />
```

### 3.2 Polyline Component

The `<Polyline>` component is used for open lines (routes, paths). It accepts a
single encoded path string via the `encodedPath` prop.

Prop          | Type     | Description
:------------ | :------- | :--------------------------------------------------
`encodedPath` | `string` | A single encoded polyline string defining the path.

**Usage Pattern:**

```tsx
<Polyline
  strokeWeight={10}
  strokeColor={'#ff22cc88'}
  encodedPath={POLYGONS[11]} // Using a single string from the imported array
/>
```

## 4. State Synchronization and Interactivity

The example utilizes standard React state (`useState`) coupled with event
handlers exposed by the component library to maintain synchronization between
the map visuals and an external control panel (`control-panel.tsx`).

### 4.1 Synchronizing Circle Properties

To allow external UI elements (like input fields or buttons) to control the map
geometry, the component state must manage the geometric properties (`center`,
`radius`).

**State Definition (`app.tsx`):**

```tsx
const [center, setCenter] = useState(INITIAL_CENTER);
const [radius, setRadius] = useState(43000); // Radius in meters
```

**Passing Handlers to External Controls (`control-panel.tsx`):**

The control panel receives callbacks that update the main component's state:

```tsx
// Inside ControlPanel component (destructured props: onCenterChanged, onRadiusChanged)
<input
  type="number"
  value={radius}
  onChange={e => onRadiusChanged(Number(e.target.value))}
/>

// Example update for coordinates
onCenterChanged({lat: Number(e.target.value), lng: center.lng})
```

### 4.2 Handling Google Maps SDK Types

When dealing with callbacks from interactive map elements (like
`onCenterChanged` in `<Circle>` or `onDrag` in `<Marker>`), the types returned
are standard Google Maps SDK objects (`google.maps.LatLng`). The application
must safely extract the standard JavaScript coordinate literal values (`lat()`
and `lng()`) and handle null or undefined results.

**Example LatLng Extraction:**

```tsx
// Handler for Marker onDrag
onDrag={e =>
  setCenter({lat: e.latLng?.lat() ?? 0, lng: e.latLng?.lng() ?? 0})
}
```

**Gotcha: LatLng Object vs. LatLngLiteral**

The `google.maps.LatLng` object returned by SDK events often requires method
calls (`.lat()`, `.lng()`) to retrieve the numeric values, whereas React state
often uses plain objects (`LatLngLiteral`: `{lat: number, lng: number}`). Ensure
event handlers correctly translate the SDK object format into the format used by
React state.

## 5. Best Practices Summary

1.  **Use Encoded Paths for Complex Geometries:** For static, complex, or large
    boundary shapes (Polygons, Polylines), utilize the `encodedPaths` or
    `encodedPath` properties. This minimizes the initial bundle size and speeds
    up map rendering compared to defining shapes using large coordinate arrays.
2.  **Radius in Meters:** Always specify the `radius` prop for the `<Circle>`
    component in meters, as per the standard Google Maps API specification.
3.  **State Management for Interactivity:** For geometric overlays that are
    user-editable (via `editable` or `draggable` props), ensure their position
    (`center`, `position`) and size (`radius`) are backed by React state, and
    use the provided `onXChanged` callbacks to keep the state synchronized with
    user actions.
4.  **Handle SDK Types Safely:** When consuming event data from Google Maps
    components, always check for null/undefined values and correctly convert
    `google.maps.LatLng` objects to simple numeric coordinate objects
    (`LatLngLiteral`) before updating React state.
