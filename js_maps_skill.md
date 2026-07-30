---
name: maps-javascript-api-javascript
description: Use this skill when building interactive web applications requiring maps, routing, location search, and geospatial visualization using the Maps JavaScript API. It covers core map customization, modern advanced markers, Places API (New) integration, Routes API replacements (for directions and distance matrix), dynamic elevation calculations, and specialized services like Fleet Engine tracking and Photorealistic 3D map rendering.
license: Apache-2.0
metadata:
  version: 1.0.45
---

> [!IMPORTANT] **Core Dependency:** This skill requires active context from
> [google-maps-platform/SKILL.md](https://www.gstatic.com/googlemapsplatform-agent-skills/google-maps-platform/SKILL.md).

### Overview

This skill provides comprehensive guidance for utilizing the Maps JavaScript API
to create sophisticated, high-performance web applications. It covers all facets
of location-based development, emphasizing modern API standards and best
practices for compliance and cost management.

Core capabilities include initializing and customizing maps, applying dynamic
styling (via Map IDs and cloud configuration), and managing interactive elements
such as markers, polylines, and data layers (GeoJSON, KML).

This skill facilitates migration to the latest JS API classes, including:

*   **Mapping & Data**: Utilizing Advanced Marker Elements and handling complex
    geospatial datasets.
*   **Places**: Implementing modern Place Autocomplete and search functions
    using the Places API (New) classes.
*   **Routing**: Replacing legacy `DirectionsService` and
    `DistanceMatrixService` with the Routes library (`Route.computeRoutes`,
    `RouteMatrix`).
*   **Specialized Services**: Integrating Address Validation, Elevation, Street
    View, Fleet Engine tracking, and Photorealistic 3D Maps.

All solutions adhere to strict guidelines concerning API key security, billing
optimization (session tokens, field masks), and mandatory migration mandates
away from deprecated APIs.

### Mandatory settings

All code generated must comply with Google Maps Platform data attribution
requirements. The agent MUST ensure that the internal usage attribution ID
`gmp_git_agentskills_v1` is configured correctly for both imperative JavaScript
objects and declarative HTML Web Components.

#### JavaScript Configuration Object

When configuring map initialization (`google.maps.MapOptions`), Places UI Kit
element creation (e.g., `PlaceAutocompleteElementOptions`), or explicit service
requests (e.g., Routes, Distance Matrix, Geocoder), include the ID in the
options object:

```javascript
// For Maps, Places components, or API Service requests
{
    // ... other options
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
}
```

#### HTML Web Component Attribute

When using Google Maps Platform Web Components (e.g., `<gmp-map>`,
`<gmp-map-3d>`, or Places UI Kit components like `<gmp-place-details>`), include
the ID as a kebab-case attribute:

```html
<gmp-map internal-usage-attribution-ids="gmp_git_agentskills_v1" center="40.749933,-73.98633" zoom="13">
</gmp-map>
```

```html
<gmp-place-details internal-usage-attribution-ids="gmp_git_agentskills_v1">
    <!-- Place content requests here -->
</gmp-place-details>
```

## 🚀 Master Orchestration Integration Workflow

Follow this multi-phase sequential integration checklist to compose features
robustly. For each phase, read the referenced capability sub-workflow file and
satisfy its *Evidence Checkpoint* before advancing.

### 📦 Phase 1: Core Initialization & Base Setup (Primary)

-   [ ] **Step 1.1: Initializes and displays the standard interactive Google Map
    viewport within a specified container element.** Read
    [add-customizable-interactive-map-web-page-mobile-app.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-customizable-interactive-map-web-page-mobile-app.md).
    *Trigger Condition*: The application requires a visible, controllable map
    interface to load. *Evidence Checkpoint*: The map container element
    successfully renders the Google Maps base tiles and interface controls.

### 📦 Phase 2: Feature Layer & Custom Enrichment (Supplemental)

#### 🗺️ Feature Module: Address validation (Optional - Use-Case Dependent)

-   [ ] **Validates and standardizes a given address string or partial address
    input using the Address Validation API.** Read
    [return-validated-address-for-specified-address-partial-address.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-validated-address-for-specified-address-partial-address.md).
    *Trigger Condition*: User needs to confirm the existence and standardized
    format of an address before further processing. *Evidence Checkpoint*: A
    standardized, validated address component structure is returned by the
    service.
-   [ ] **Retrieves the precise geographic coordinates (latitude/longitude) for
    a validated address.** Read
    [return-the-latitude-longitude-coordinates-for-validated-address.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-the-latitude-longitude-coordinates-for-validated-address.md).
    *Dependencies*:
    `["return-validated-address-for-specified-address-partial-address.md"]`
    *Trigger Condition*: User needs the exact geographic location of a validated
    address for mapping or calculation purposes. *Evidence Checkpoint*: The API
    response includes valid 'lat' and 'lng' values for the address location.
-   [ ] **Returns the unique Google Place ID associated with the validated
    address.** Read
    [return-the-google-place-identifier-for-validated-address.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-the-google-place-identifier-for-validated-address.md).
    *Dependencies*:
    `["return-validated-address-for-specified-address-partial-address.md"]`
    *Trigger Condition*: User requires a persistent, unique identifier for the
    location to use with other Places features. *Evidence Checkpoint*: A valid
    Place ID string is returned alongside the validated address data.
-   [ ] **Performs USPS Coding Accuracy Support System (CASS) certification
    checks during address validation for US addresses.** Read
    [use-united-states-postal-service-usps-coding-accuracy-support-system.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/use-united-states-postal-service-usps-coding-accuracy-support-system.md).
    *Dependencies*:
    `["return-validated-address-for-specified-address-partial-address.md"]`
    *Trigger Condition*: User needs US addresses validated according to strict
    USPS CASS requirements for postal delivery compliance. *Evidence
    Checkpoint*: The validation response confirms CASS certification results or
    metadata fields.
-   [ ] **Identifies the classification of the validated address as a Business,
    Residence, or PO Box.** Read
    [return-information-about-whether-validated-address-business-residence-box.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-information-about-whether-validated-address-business-residence-box.md).
    *Dependencies*:
    `["return-validated-address-for-specified-address-partial-address.md"]`
    *Trigger Condition*: Application logic depends on classifying the address
    type (e.g., delivery or regulatory restrictions). *Evidence Checkpoint*: The
    address metadata includes the determined address type classification.
-   [ ] **Retrieves specific USPS delivery metadata (e.g., delivery point
    barcode, carrier route) for the validated US address.** Read
    [return-united-states-postal-service-usps-delivery-metadata-for-validated.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-united-states-postal-service-usps-delivery-metadata-for-validated.md).
    *Dependencies*:
    `["return-validated-address-for-specified-address-partial-address.md"]`
    *Trigger Condition*: Detailed logistics or postal processing information is
    required for a validated US address. *Evidence Checkpoint*: The service
    returns detailed USPS delivery metadata fields.
-   [ ] **Provides the standardized address representation translated into the
    English language.** Read
    [return-english-language-version-validated-address.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-english-language-version-validated-address.md).
    *Dependencies*:
    `["return-validated-address-for-specified-address-partial-address.md"]`
    *Trigger Condition*: Displaying or storing the validated address requires a
    standardized English format regardless of the local language. *Evidence
    Checkpoint*: The returned validated address components are rendered in
    English.
-   [ ] **Returns the Plus Code (Open Location Code) associated with the
    validated address location.** Read
    [return-the-plus-code-for-validated-address.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-the-plus-code-for-validated-address.md).
    *Dependencies*:
    `["return-validated-address-for-specified-address-partial-address.md"]`
    *Trigger Condition*: User needs a simple, geocodable short code for the
    location. *Evidence Checkpoint*: The response includes a valid Plus Code
    string.

#### 🗺️ Feature Module: Maps styling (Optional - Use-Case Dependent)

-   [ ] **Defines a customizable map style that can be applied consistently
    across map loads using a unique Map ID.** Read
    [create-reusable-cross-platform-map-style.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/create-reusable-cross-platform-map-style.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User wants to define a custom visual theme for the map to ensure
    consistent branding or data emphasis. *Evidence Checkpoint*: A unique map
    style ID is successfully created and referenced during map initialization.
-   [ ] **Customizes the appearance (color, width, visibility) of road
    geometries, lines, and area features via map styling options.** Read
    [change-the-style-roads-polylines-and-polygons-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-style-roads-polylines-and-polygons-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to visually modify vector map features like roads or
    waterways. *Evidence Checkpoint*: The specified geometric features render
    with the custom styles (e.g., roads are styled red).
-   [ ] **Controls the visibility of specific map elements, such as parks,
    landmarks, or transit stations, using style rules.** Read
    [display-hide-map-features.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/display-hide-map-features.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to declutter the map or emphasize certain points of
    interest by hiding others. *Evidence Checkpoint*: The targeted map features
    (e.g., parks) are successfully suppressed or made visible based on
    configuration.
-   [ ] **Customizes the visual properties of map icons and associated text
    labels.** Read
    [change-the-style-icons-and-text-labels-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-style-icons-and-text-labels-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to change the default appearance of feature markers
    or text labels (e.g., for branding). *Evidence Checkpoint*: Icons and text
    labels for map features appear with custom styling (color, font, size).
-   [ ] **Implements zoom-level dependent styling rules to change the map's
    appearance dynamically as the user zooms.** Read
    [apply-different-map-styles-different-zoom-levels.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/apply-different-map-styles-different-zoom-levels.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User requires adaptive styling to maintain visual clarity or
    focus on details at different scales. *Evidence Checkpoint*: Map styles
    successfully change when the user zooms in or out past defined thresholds.
-   [ ] **Adjusts the number of points of interest (POIs) displayed on the
    map.** Read
    [change-the-density-places-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-density-places-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to control the clutter caused by POI density.
    *Evidence Checkpoint*: Fewer or more POIs are visible on the map depending
    on the configured density setting.
-   [ ] **Customizes the appearance of 3D building models and footprints shown
    on the map.** Read
    [change-the-style-buildings-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-style-buildings-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to adjust the color or visibility of 3D buildings.
    *Evidence Checkpoint*: Building features render with the specified custom
    style.
-   [ ] **Customizes the visual style of identified landmarks on the map.** Read
    [change-the-style-landmarks-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-style-landmarks-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to highlight or de-emphasize landmarks. *Evidence
    Checkpoint*: Landmark features display the custom styling.

#### 🗺️ Feature Module: Data-driven styling for boundaries (Optional - Use-Case Dependent)

-   [ ] **Applies custom styles to administrative boundaries (e.g., states,
    postal codes) displayed on the map.** Read
    [change-the-style-boundaries-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-style-boundaries-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User wants to visually distinguish different geographic regions
    using boundaries. *Evidence Checkpoint*: Boundaries render on the map with
    the defined colors, strokes, or fills.
-   [ ] **Configures event listeners to respond to user actions (like clicks or
    hovers) on styled boundaries.** Read
    [respond-user-interactions-with-boundaries-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-with-boundaries-map.md).
    *Dependencies*: `["change-the-style-boundaries-map.md"]` *Trigger
    Condition*: User interaction needs to trigger an action based on clicking a
    specific boundary area. *Evidence Checkpoint*: A registered callback
    function executes when a boundary element is interacted with.
-   [ ] **Applies data-driven color fills (choropleth) to boundaries based on
    associated data values.** Read
    [add-choropleth-styling-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-choropleth-styling-map.md).
    *Dependencies*: `["change-the-style-boundaries-map.md"]` *Trigger
    Condition*: User needs to visualize spatial data distribution across
    administrative boundaries. *Evidence Checkpoint*: Boundaries are colored
    dynamically according to the underlying data range logic.

#### 🗺️ Feature Module: Datasets (Optional - Use-Case Dependent)

-   [ ] **Displays geographic data by loading and parsing a KML (Keyhole Markup
    Language) file as a map layer.** Read
    [add-kml-layer-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-kml-layer-map.md). *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to visualize data stored in KML format on the map.
    *Evidence Checkpoint*: The features defined in the KML file are rendered as
    an overlay on the map.
-   [ ] **Displays geographic data by loading and parsing a GeoRSS file as a map
    layer.** Read [add-georss-layer-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-georss-layer-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to visualize dynamic location data provided via a
    GeoRSS feed. *Evidence Checkpoint*: Geo-referenced items from the RSS feed
    appear as map features.
-   [ ] **Loads and displays vector data formatted as GeoJSON directly onto the
    map's data layer.** Read
    [add-geojson-data-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-geojson-data-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User has structured geographic data in GeoJSON format to
    display. *Evidence Checkpoint*: GeoJSON features (points, lines, polygons)
    are added to the map data layer and displayed.

#### 🗺️ Feature Module: Data-driven styling for datasets (Optional - Use-Case Dependent)

-   [ ] **Creates a managed, reusable dataset that stores geospatial features
    (points, polygons) accessible via a dataset ID.** Read
    [create-reusable-cross-platform-geospatial-dataset.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/create-reusable-cross-platform-geospatial-dataset.md).
    *Trigger Condition*: User needs to manage and host geospatial data
    externally for cross-platform use. *Evidence Checkpoint*: A unique dataset
    ID is generated and the data is successfully uploaded and hosted.
-   [ ] **Loads and displays features from a pre-configured geospatial dataset
    onto the map using its dataset ID.** Read
    [add-custom-geospatial-dataset-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-custom-geospatial-dataset-map.md).
    *Dependencies*: `["add-customizable-interactive-map-web-page-mobile-app.md",
    "create-reusable-cross-platform-geospatial-dataset.md"]` *Trigger
    Condition*: User needs to display managed geospatial features on the map.
    *Evidence Checkpoint*: Dataset features appear on the map based on the
    provided dataset ID.
-   [ ] **Applies custom visual styles to the features loaded from a geospatial
    dataset (e.g., dynamic coloring based on feature properties).** Read
    [change-the-style-custom-dataset-features-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-style-custom-dataset-features-map.md).
    *Dependencies*: `["add-custom-geospatial-dataset-map.md"]` *Trigger
    Condition*: User wants to differentiate or highlight features within the
    loaded dataset. *Evidence Checkpoint*: Dataset features render with custom
    appearance rules applied.
-   [ ] **Enables interaction handling (click, mouseover) for features belonging
    to a custom geospatial dataset.** Read
    [respond-user-interactions-with-custom-dataset-features-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-with-custom-dataset-features-map.md).
    *Dependencies*: `["add-custom-geospatial-dataset-map.md"]` *Trigger
    Condition*: User needs interactive feedback or triggers when a feature in
    the dataset is selected. *Evidence Checkpoint*: A defined event listener
    triggers successfully upon interaction with a dataset feature.

#### 🗺️ Feature Module: Directions and Routing (Optional - Use-Case Dependent)

-   [ ] **Calculates a route and returns the polyline geometry encoded as a
    series of coordinate pairs per route step.** Read
    [return-directions-between-two-more-latitude-longitude-coordinates-series-coordinates-for.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-directions-between-two-more-latitude-longitude-coordinates-series-coordinates-for.md).
    *Trigger Condition*: User needs granular geographic path details for
    plotting or complex visualization of the route. *Evidence Checkpoint*: The
    Directions API response contains a detailed array of coordinates defining
    the route steps.
-   [ ] **Calculates a route and returns text descriptions of the maneuvers
    required for each step (turn left, merge right, etc.).** Read
    [return-directions-between-two-more-sets-latitude-longitude-coordinates-series-maneuver.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-directions-between-two-more-sets-latitude-longitude-coordinates-series-maneuver.md).
    *Trigger Condition*: User requires step-by-step navigation instructions.
    *Evidence Checkpoint*: The Directions API response includes human-readable
    maneuver descriptions for each leg/step.
-   [ ] **Retrieves the precise distance measurement for every instruction
    segment (step) of a calculated route.** Read
    [return-the-distance-between-each-step-along-route-between-two.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-the-distance-between-each-step-along-route-between-two.md).
    *Trigger Condition*: User needs fine-grained distance reporting for
    intermediate parts of the journey. *Evidence Checkpoint*: The step objects
    in the route response contain accurate distance fields.
-   [ ] **Retrieves the estimated travel time measurement for every instruction
    segment (step) of a calculated route.** Read
    [return-the-travel-time-between-each-step-along-route-between.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-the-travel-time-between-each-step-along-route-between.md).
    *Trigger Condition*: User needs fine-grained time reporting for intermediate
    parts of the journey. *Evidence Checkpoint*: The step objects in the route
    response contain accurate duration fields.
-   [ ] **Returns the compressed, encoded polyline string representing the
    geometry for each step of the route.** Read
    [return-encoded-polyline-between-each-step-along-route-between-two.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-encoded-polyline-between-each-step-along-route-between-two.md).
    *Trigger Condition*: User needs an efficient, compact representation of the
    geometry of route steps. *Evidence Checkpoint*: Each step object includes an
    encoded polyline field.
-   [ ] **Returns the total distance of the calculated route between the origin
    and destination.** Read
    [return-the-distance-for-route-between-two-more-sets-latitude-longitude.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-the-distance-for-route-between-two-more-sets-latitude-longitude.md).
    *Trigger Condition*: User needs the overall distance of the route. *Evidence
    Checkpoint*: The overall route response includes the total distance metric.
-   [ ] **Returns the estimated total travel time for the entire route.** Read
    [return-the-travel-time-for-route-between-two-more-sets.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-the-travel-time-for-route-between-two-more-sets.md).
    *Trigger Condition*: User needs the estimated overall duration of the
    journey. *Evidence Checkpoint*: The overall route response includes the
    total duration metric.
-   [ ] **Returns the compressed, encoded polyline string representing the
    entire route geometry.** Read
    [return-encoded-polyline-for-route-between-two-more-sets-latitude-longitude.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-encoded-polyline-for-route-between-two-more-sets-latitude-longitude.md).
    *Trigger Condition*: User needs an efficient representation of the full
    route path for rendering on a map. *Evidence Checkpoint*: The route response
    includes a single encoded polyline string for the full path.
-   [ ] **Sets the preferred mode of transportation (e.g., DRIVING, TRANSIT)
    when requesting directions for a single route.** Read
    [specify-the-travel-mode-drive-transit-walk-two-wheeled-for-route.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-the-travel-mode-drive-transit-walk-two-wheeled-for-route.md).
    *Trigger Condition*: Route calculation must adhere to constraints specific
    to the user's transportation method. *Evidence Checkpoint*: The route
    calculation reflects the chosen travel mode, resulting in appropriate
    pathing.
-   [ ] **Defines waypoints that the route must pass through between the origin
    and destination.** Read
    [specify-stop-pass-through-point-for-route-request.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-stop-pass-through-point-for-route-request.md).
    *Trigger Condition*: The route must include one or more intermediate
    locations (stops) on the path. *Evidence Checkpoint*: The calculated route
    successfully includes all specified waypoints.
-   [ ] **Configures whether traffic conditions (real-time or predictive) are
    factored into travel time calculations.** Read
    [specify-how-traffic-data-used-route-request.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-how-traffic-data-used-route-request.md).
    *Trigger Condition*: Accurate travel time estimates based on current or
    future traffic are required. *Evidence Checkpoint*: The route duration
    reflects traffic influence (e.g., 'duration_in_traffic' field is populated).
-   [ ] **Sets preferences to exclude certain features (e.g., tolls, ferries,
    highways) from the generated route.** Read
    [specify-features-avoid-such-highways-tolls-for-route-request.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-features-avoid-such-highways-tolls-for-route-request.md).
    *Trigger Condition*: The user prefers a route that avoids specified road
    types or costs. *Evidence Checkpoint*: The calculated path successfully
    bypasses the defined restrictions (e.g., toll roads are avoided).
-   [ ] **Requests optimized routes (shorter distance) or multiple alternative
    routes for comparison.** Read
    [specify-shorter-distance-alternative-routing-for-routes-request.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-shorter-distance-alternative-routing-for-routes-request.md).
    *Trigger Condition*: User needs options beyond the default fastest route,
    such as the shortest route or secondary options. *Evidence Checkpoint*: The
    Directions API returns one or more requested alternative routes, prioritized
    by criteria.
-   [ ] **Calculates the distance metrics for every pair in a large matrix of
    origins and destinations.** Read
    [return-distances-for-matrix-routes-between-multiple-origins-and-destinations.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-distances-for-matrix-routes-between-multiple-origins-and-destinations.md).
    *Trigger Condition*: User needs to compare distances between many potential
    start and end points efficiently. *Evidence Checkpoint*: The Distance Matrix
    response contains an array detailing the distance for each
    origin-destination pair.
-   [ ] **Calculates the travel time metrics for every pair in a large matrix of
    origins and destinations.** Read
    [return-travel-times-for-matrix-routes-between-multiple-origins-and.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-travel-times-for-matrix-routes-between-multiple-origins-and.md).
    *Trigger Condition*: User needs to compare travel times between many
    potential start and end points efficiently. *Evidence Checkpoint*: The
    Distance Matrix response contains an array detailing the duration/travel
    time for each origin-destination pair.
-   [ ] **Sets the preferred mode of transportation (e.g., DRIVING, TRANSIT)
    when generating a distance matrix.** Read
    [specify-the-travel-mode-drive-transit-walk-two-wheeled-for-route.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-the-travel-mode-drive-transit-walk-two-wheeled-for-route.md).
    *Trigger Condition*: Matrix calculation must adhere to constraints specific
    to the user's transportation method. *Evidence Checkpoint*: The matrix
    results reflect calculations based on the specified travel mode.

#### 🗺️ Feature Module: Elevation (Optional - Use-Case Dependent)

-   [ ] **Retrieves the height above sea level (elevation) for specific
    geographic points.** Read
    [return-the-elevation-set-latitude-longitude-coordinates.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-the-elevation-set-latitude-longitude-coordinates.md).
    *Trigger Condition*: User requires precise altitude data for one or more
    locations. *Evidence Checkpoint*: The Elevation API returns a successful
    response containing elevation values for the requested coordinates.
-   [ ] **Samples elevation data evenly along a defined path (sequence of
    coordinates) to calculate changes in terrain height.** Read
    [return-the-difference-elevation-along-path-between-two-more-sets.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-the-difference-elevation-along-path-between-two-more-sets.md).
    *Trigger Condition*: User needs to visualize or calculate the terrain
    profile along a route or path. *Evidence Checkpoint*: The Elevation API
    returns an array of sampled elevation data points distributed along the
    defined path.

#### 🗺️ Feature Module: Fleet Engine (Optional - Use-Case Dependent)

-   [ ] **Displays the live position of delivery vehicles and related tasks
    managed by Fleet Engine onto the map interface.** Read
    [add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to track assets in real-time within a Fleet Engine
    environment. *Evidence Checkpoint*: Vehicle and task markers appear
    dynamically updating on the map.
-   [ ] **Displays the estimated, future path that delivery vehicles are
    expected to follow.** Read
    [add-the-predicted-routes-fleet-engine-delivery-vehicles-and-tasks.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-the-predicted-routes-fleet-engine-delivery-vehicles-and-tasks.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: User needs visibility into upcoming vehicle movements
    and route adherence. *Evidence Checkpoint*: Polylines representing the
    predicted vehicle routes are rendered on the map.
-   [ ] **Renders all associated markers for a specific delivery vehicle,
    including current location, scheduled stops, and task points.** Read
    [add-fleet-engine-delivery-vehicle-s-location-stops-tasks-and-waypoint.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-fleet-engine-delivery-vehicle-s-location-stops-tasks-and-waypoint.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: Detailed visual tracking of a single vehicle's progress
    and itinerary is required. *Evidence Checkpoint*: Specific markers for
    location, stops, and tasks associated with the vehicle are displayed.
-   [ ] **Sets up event handlers to react to state changes in Fleet Engine
    (e.g., trip finished, task started).** Read
    [respond-fleet-engine-delivery-vehicle-events-including-completed-trips-segments.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-fleet-engine-delivery-vehicle-events-including-completed-trips-segments.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: Application logic needs to update or react immediately
    to fleet progression milestones. *Evidence Checkpoint*: A configured
    listener successfully triggers upon a specified vehicle state change event.
-   [ ] **Applies custom visual styles specifically to map elements within the
    Fleet Engine tracking context.** Read
    [change-the-style-roads-polylines-and-polygons-fleet-engine-fleet.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-style-roads-polylines-and-polygons-fleet-engine-fleet.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: Custom branding or visual distinction is required for
    the fleet tracking map base layer. *Evidence Checkpoint*: Roads and
    geometric features of the fleet map display the customized style.
-   [ ] **Controls the visibility of map features (e.g., POIs, transit) on the
    specialized Fleet Engine map view.** Read
    [display-hide-map-features-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/display-hide-map-features-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: Need to declutter the background map used for fleet
    tracking. *Evidence Checkpoint*: Targeted map features are hidden or shown
    on the fleet tracking map.
-   [ ] **Customizes the appearance of map icons and text labels in the Fleet
    Engine map view.** Read
    [change-the-style-icons-and-text-labels-fleet-engine-fleet.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-style-icons-and-text-labels-fleet-engine-fleet.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: Need to enforce consistent branding or visual hierarchy
    for the base map layers in the fleet view. *Evidence Checkpoint*: Map
    feature icons and labels on the fleet map use the specified styles.
-   [ ] **Implements zoom-level dependent styling for the base map elements
    within the Fleet Engine interface.** Read
    [apply-different-map-styles-different-zoom-levels-fleet-engine-fleet.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/apply-different-map-styles-different-zoom-levels-fleet-engine-fleet.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: Need adaptive map styling to optimize visualization
    across zoom levels during fleet monitoring. *Evidence Checkpoint*: Map
    appearance changes dynamically based on the current zoom level of the fleet
    tracking map.
-   [ ] **Adjusts the visibility density of points of interest on the Fleet
    Engine map.** Read
    [change-the-density-places-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-density-places-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: Need to reduce visual noise caused by excess POIs
    during high-density vehicle tracking. *Evidence Checkpoint*: The displayed
    number of POIs on the fleet map reflects the configured density setting.
-   [ ] **Customizes the appearance of 3D building models and footprints on the
    Fleet Engine map.** Read
    [change-the-style-buildings-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-style-buildings-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: Need to hide or modify building visuals for better
    fleet visibility. *Evidence Checkpoint*: Building features on the fleet map
    display the configured style.
-   [ ] **Customizes the visual style of identified landmarks within the Fleet
    Engine map.** Read
    [change-the-style-landmarks-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-style-landmarks-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: Need to control the prominence of landmarks in the
    tracking view. *Evidence Checkpoint*: Landmark features on the fleet map
    display the configured style.
-   [ ] **Customizes the appearance (icon, size, labels) of the vehicle, stop,
    or task markers managed by Fleet Engine.** Read
    [customize-marker-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-marker-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: Need to visually differentiate markers based on vehicle
    state or task type. *Evidence Checkpoint*: Fleet Engine markers render using
    the specified custom icons or visual properties.
-   [ ] **Customizes the appearance of the route lines (color, thickness, dashed
    patterns) associated with tracked vehicles.** Read
    [customize-the-route-polyline-fleet-engine-fleet-tracking-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-the-route-polyline-fleet-engine-fleet-tracking-map.md).
    *Dependencies*:
    `["add-the-real-time-location-fleet-engine-delivery-vehicles-and-tasks.md"]`
    *Trigger Condition*: Need to visually distinguish between predicted,
    historical, or completed route segments. *Evidence Checkpoint*: Vehicle
    route polylines are rendered with the specified custom styling.

#### 🗺️ Feature Module: Geocoding (Optional - Use-Case Dependent)

-   [ ] **Translates a human-readable address string into geographic coordinates
    (latitude and longitude).** Read
    [return-the-latitude-longitude-coordinates-address-geocoding.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-the-latitude-longitude-coordinates-address-geocoding.md).
    *Trigger Condition*: User provides a street address and needs its precise
    map location. *Evidence Checkpoint*: The Geocoding service returns a
    structured address object including 'lat' and 'lng'.
-   [ ] **Translates geographic coordinates (latitude and longitude) back into a
    human-readable street address.** Read
    [return-the-address-for-set-latitude-longitude-coordinates-reverse-geocoding.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-the-address-for-set-latitude-longitude-coordinates-reverse-geocoding.md).
    *Trigger Condition*: User selects a point on the map and requires the
    corresponding physical address. *Evidence Checkpoint*: The Reverse Geocoding
    service returns a formatted address string for the coordinates.

#### 🗺️ Feature Module: Maps annotations (Optional - Use-Case Dependent)

-   [ ] **Creates a floating, customizable content box (infobox) anchored to a
    specific location or marker on the map.** Read
    [add-info-window-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-info-window-map.md). *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to display contextual, detailed information when a
    map feature is interacted with. *Evidence Checkpoint*: A movable dialog box
    appears on the map displaying the custom content.
-   [ ] **Draws geometric overlays on the map, such as circles, rectangles,
    polygons, or polylines.** Read
    [add-shape-line-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-shape-line-map.md). *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to visualize geographic areas or paths not covered by
    standard map features. *Evidence Checkpoint*: The specified geometric shape
    successfully renders as an overlay on the map.
-   [ ] **Adds a marker using scalable vector graphics (SVG) for high-resolution
    display across zoom levels.** Read
    [add-vector-based-icon-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-vector-based-icon-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User requires crisp, resolution-independent markers that scale
    cleanly. *Evidence Checkpoint*: A marker rendered using an SVG path is
    displayed clearly on the map.
-   [ ] **Integrates high-performance, WebGL-based visualization layers
    (deck.gl) for complex data display.** Read
    [add-deck-gl-overlays-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-deck-gl-overlays-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to render massive datasets or complex 3D
    visualizations directly on the map surface. *Evidence Checkpoint*: A
    high-density data layer from deck.gl successfully renders atop the map
    tiles.
-   [ ] **Adds a single, geographically anchored image (GroundOverlay) that
    scales and rotates with the map.** Read
    [add-overlay-image-grounded-the-surface-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-overlay-image-grounded-the-surface-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to display historical maps, building blueprints, or
    custom satellite imagery aligned with the base map. *Evidence Checkpoint*:
    The custom image appears correctly positioned and aligned to the specified
    geographic bounds.
-   [ ] **Integrates user-provided map tiles sourced from a tile server as a
    layer over the base map.** Read
    [add-custom-tile-overlay-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-custom-tile-overlay-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to display highly specialized or frequently updating
    raster data layers. *Evidence Checkpoint*: Custom raster tiles are
    successfully loaded and overlaid onto the map view.
-   [ ] **Places a standard icon/pin at a specific latitude/longitude location
    on the map.** Read [add-marker-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-marker-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to identify a location with a visual point indicator.
    *Evidence Checkpoint*: A visible marker icon appears at the designated
    coordinates.
-   [ ] **Modifies the appearance, icon, opacity, or behavior of a standard map
    marker.** Read
    [customize-marker-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-marker-map.md).
    *Dependencies*: `["add-marker-map.md"]` *Trigger Condition*: User needs
    custom visual branding or functionality (e.g., draggable marker) for map
    points. *Evidence Checkpoint*: The marker renders with the customized
    features (e.g., custom icon image, shadow).
-   [ ] **Configures event handlers to react to user input (e.g., click, drag,
    hover) specifically on markers.** Read
    [respond-user-interactions-with-markers-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-with-markers-map.md).
    *Dependencies*: `["add-marker-map.md"]` *Trigger Condition*: User
    interaction with a marker must trigger an action or display information.
    *Evidence Checkpoint*: A registered callback function executes when a marker
    is clicked or interacted with.

#### 🗺️ Feature Module: Maps (Optional - Use-Case Dependent)

-   [ ] **Creates a unique ID to externally manage map configuration (styling,
    features) via Cloud Console.** Read
    [create-reusable-map-identifier-store-map-configuration-and-styling-settings.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/create-reusable-map-identifier-store-map-configuration-and-styling-settings.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to apply consistent, centrally managed styling and
    feature configuration to multiple map instances. *Evidence Checkpoint*: A
    map object successfully initializes using a map ID string, reflecting the
    cloud configurations.
-   [ ] **Implements handlers to capture global map events such as map clicks,
    drag start/end, and boundary changes.** Read
    [respond-user-interactions-and-events-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-and-events-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: Application logic needs to respond to changes in the map state
    or generic user input. *Evidence Checkpoint*: An event listener fires upon a
    relevant user action (e.g., clicking on the map background).
-   [ ] **Configures the visibility, position, and functionality of built-in UI
    controls (zoom, pan, street view pegman).** Read
    [customize-the-controls-that-appear-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-the-controls-that-appear-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: Need to adjust the default user interface elements visible on
    the map. *Evidence Checkpoint*: Map controls are customized or suppressed
    according to the provided options object.
-   [ ] **Programmatically moves the map viewport (camera) by changing its
    center coordinates, zoom level, tilt, or heading.** Read
    [control-zoom-and-pan-map-camera.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/control-zoom-and-pan-map-camera.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: Application needs to focus the user's view on a specific
    location or area. *Evidence Checkpoint*: The map view animates or instantly
    updates to the new specified camera position.
-   [ ] **Switches the visible layer set between ROADMAP, SATELLITE, HYBRID, or
    TERRAIN views.** Read
    [change-the-map-type.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-map-type.md). *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User requests a different visual representation of the base
    geography. *Evidence Checkpoint*: The underlying map tiles update to reflect
    the selected map type.
-   [ ] **Applies predefined color schemes (like dark mode or accessibility
    themes) to the map's default style.** Read
    [change-the-map-color-scheme.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/change-the-map-color-scheme.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: Application needs to adjust map appearance globally for user
    preferences or ambient conditions. *Evidence Checkpoint*: The map palette
    shifts to the defined color scheme (e.g., dark mode is activated).
-   [ ] **Renders map features (road names, labels) in a specified language and
    sets region-specific behavior.** Read
    [localize-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/localize-map.md). *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: Map content must be displayed in a user's preferred
    language/region. *Evidence Checkpoint*: Map labels and controls are
    displayed using the target language code.
-   [ ] **Overlays real-time or predictive traffic flow data onto the map.**
    Read [add-traffic-layer-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-traffic-layer-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs immediate visualization of current road congestion.
    *Evidence Checkpoint*: Color-coded polylines indicating traffic speed appear
    on major roads.
-   [ ] **Overlays public transportation routes, stops, and icons onto the
    map.** Read [add-transit-layer-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-transit-layer-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to view public transport infrastructure. *Evidence
    Checkpoint*: Transit lines and station icons appear on the map.
-   [ ] **Overlays bicycle trails, recommended routes, and lanes onto the map.**
    Read [add-bicycling-layer-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-bicycling-layer-map.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User needs to view bike-friendly navigation options. *Evidence
    Checkpoint*: Bicycle paths and routes are highlighted on the map.

#### 🗺️ Feature Module: Photorealistic 3D maps (Optional - Use-Case Dependent)

-   [ ] **Initializes the highly detailed, immersive 3D photorealistic map view,
    allowing for rotation and tilt.** Read
    [add-interactive-photorealistic-map-web-page.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-interactive-photorealistic-map-web-page.md).
    *Dependencies*:
    `["add-customizable-interactive-map-web-page-mobile-app.md"]` *Trigger
    Condition*: User requires a visually rich, 3D context, often for large
    cities or specific landmarks. *Evidence Checkpoint*: The map renders with 3D
    buildings and high-resolution textures, supporting rotation/tilt controls.
-   [ ] **Places a marker that is correctly anchored within the 3D map
    environment.** Read
    [add-marker-photorealistic-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-marker-photorealistic-map.md).
    *Dependencies*: `["add-interactive-photorealistic-map-web-page.md"]`
    *Trigger Condition*: Need to annotate a specific location within the
    photorealistic 3D view. *Evidence Checkpoint*: A marker is displayed that
    adheres to the 3D perspective and context.
-   [ ] **Customizes the appearance or behavior of markers displayed on the 3D
    photorealistic map.** Read
    [customize-marker-photorealistic-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-marker-photorealistic-map.md).
    *Dependencies*: `["add-marker-photorealistic-map.md"]` *Trigger Condition*:
    Need custom branding or functionality for markers in the 3D environment.
    *Evidence Checkpoint*: 3D markers reflect the specified customizations
    (icon, size, 3D anchoring).
-   [ ] **Places custom 3D models (e.g., buildings, vehicles) within the
    photorealistic map scene.** Read
    [add-model-photorealistic-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-model-photorealistic-map.md).
    *Dependencies*: `["add-interactive-photorealistic-map-web-page.md"]`
    *Trigger Condition*: User needs to augment the map with specific,
    application-defined 3D objects. *Evidence Checkpoint*: The custom 3D model
    appears correctly loaded and positioned in the scene.
-   [ ] **Adds a custom 2D image or content layer over the 3D map view.** Read
    [add-overlay-photorealistic-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-overlay-photorealistic-map.md).
    *Dependencies*: `["add-interactive-photorealistic-map-web-page.md"]`
    *Trigger Condition*: Need to display custom information layers that float
    above the 3D geometry. *Evidence Checkpoint*: The overlay content is visible
    above the 3D map surface.
-   [ ] **Draws a line path that accurately follows the terrain or floats in 3D
    space within the view.** Read
    [add-polyline-photorealistic-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-polyline-photorealistic-map.md).
    *Dependencies*: `["add-interactive-photorealistic-map-web-page.md"]`
    *Trigger Condition*: Need to visualize routes or paths that interact
    correctly with the 3D environment. *Evidence Checkpoint*: A polyline is
    rendered which respects the 3D map geometry and camera angle.
-   [ ] **Draws a closed geometric shape that interacts correctly with the 3D
    map surface and camera.** Read
    [add-polygon-photorealistic-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-polygon-photorealistic-map.md).
    *Dependencies*: `["add-interactive-photorealistic-map-web-page.md"]`
    *Trigger Condition*: Need to highlight or shade an area within the 3D view.
    *Evidence Checkpoint*: A polygon renders correctly, adapting to the 3D tilt
    and perspective.
-   [ ] **Implements handlers to capture events specific to the 3D map, such as
    camera rotation or mouse clicks on 3D geometry.** Read
    [respond-user-interactions-and-events-photorealistic-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-and-events-photorealistic-map.md).
    *Dependencies*: `["add-interactive-photorealistic-map-web-page.md"]`
    *Trigger Condition*: Application needs to react to user manipulation of the
    3D view. *Evidence Checkpoint*: Event listeners successfully fire when the
    3D map is interacted with.
-   [ ] **Configures the visibility and layout of UI controls (e.g., zoom,
    compass, tilt) in the 3D map view.** Read
    [customize-the-controls-that-appear-photorealistic-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-the-controls-that-appear-photorealistic-map.md).
    *Dependencies*: `["add-interactive-photorealistic-map-web-page.md"]`
    *Trigger Condition*: Need to simplify or rearrange the default controls for
    the 3D map interface. *Evidence Checkpoint*: 3D map controls reflect the
    specified customization options.
-   [ ] **Programmatically controls the 3D camera movement, allowing for dynamic
    transitions, orbits, and custom viewing paths.** Read
    [control-camera-path-and-animations-photorealistic-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/control-camera-path-and-animations-photorealistic-map.md).
    *Dependencies*: `["add-interactive-photorealistic-map-web-page.md"]`
    *Trigger Condition*: Application needs to guide the user's attention through
    a predefined 3D tour or complex transition. *Evidence Checkpoint*: The map
    camera executes a smooth, defined path animation.
-   [ ] **Defines constraints on the 3D camera's movement, limiting zoom, tilt,
    or the visible bounding box.** Read
    [control-camera-restrictions-photorealistic-map.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/control-camera-restrictions-photorealistic-map.md).
    *Dependencies*: `["add-interactive-photorealistic-map-web-page.md"]`
    *Trigger Condition*: Need to prevent users from navigating outside a certain
    area or viewing angle. *Evidence Checkpoint*: Camera movements cease or snap
    back when attempting to violate the defined boundaries or limits.

#### 🗺️ Feature Module: Places (Optional - Use-Case Dependent)

-   [ ] **Searches for Points of Interest (POIs) matching a text query (e.g.,
    'coffee shops near me').** Read
    [return-list-places-and-place-details-based-query-string.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-list-places-and-place-details-based-query-string.md).
    *Trigger Condition*: User enters a keyword search and needs relevant places
    returned. *Evidence Checkpoint*: The Find Place API returns an array of
    Place objects matching the query.
-   [ ] **Searches for nearby Points of Interest (POIs) based on a proximity
    request (e.g., 'restaurants within 500m of this coordinate').** Read
    [return-list-places-and-place-details-near-specific-location.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-list-places-and-place-details-near-specific-location.md).
    *Trigger Condition*: User needs to discover places immediately surrounding a
    known location. *Evidence Checkpoint*: The Nearby Search API returns a list
    of Place objects ordered by proximity to the coordinate.
-   [ ] **Provides predictive, structured suggestions for places and addresses
    as the user types.** Read
    [return-autocomplete-results-about-places-based-query-string.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-autocomplete-results-about-places-based-query-string.md).
    *Trigger Condition*: User starts entering text into a search box and expects
    immediate suggestions. *Evidence Checkpoint*: The Autocomplete service
    returns structured prediction objects based on the partial input.
-   [ ] **Retrieves comprehensive information (e.g., contact, hours, reviews)
    for a Place using its Place ID.** Read
    [return-detailed-information-about-specific-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-detailed-information-about-specific-place.md).
    *Trigger Condition*: User selects a place and requires deep context about
    it. *Evidence Checkpoint*: The Place Details API returns a rich JSON object
    containing all requested data fields.
-   [ ] **Retrieves references and URLs to high-quality photographic content
    associated with a given place.** Read
    [return-photos-specific-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-photos-specific-place.md).
    *Trigger Condition*: User wants to view visual representations of a specific
    place. *Evidence Checkpoint*: The Place Details or Photos API returns an
    array of photo references.
-   [ ] **Allows specifying maximum width or height constraints when retrieving
    place photos to optimize bandwidth and display size.** Read
    [resize-place-photos.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/resize-place-photos.md). *Dependencies*:
    `["return-photos-specific-place.md"]` *Trigger Condition*: Need to display
    photos efficiently at a specific dimension without manual cropping.
    *Evidence Checkpoint*: The returned photo URL serves the image asset at the
    requested resolution.
-   [ ] **Retrieves user-submitted ratings and textual reviews for a given Place
    ID.** Read
    [return-ratings-and-reviews-for-specific-place.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-ratings-and-reviews-for-specific-place.md).
    *Trigger Condition*: User needs social proof and public opinion data about a
    place. *Evidence Checkpoint*: The Place Details response includes averaged
    rating metrics and an array of user review objects.
-   [ ] **Implements a pre-built UI element that handles text input and
    automatically calls the Autocomplete service, displaying suggestions.** Read
    [add-autocomplete-widget-web-page-app-that-returns-results-about.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-autocomplete-widget-web-page-app-that-returns-results-about.md).
    *Trigger Condition*: Need to provide a streamlined, map-integrated search
    bar experience. *Evidence Checkpoint*: A functioning input field appears,
    displaying predictive place results dynamically.

#### 🗺️ Feature Module: Places UI Kit (Optional - Use-Case Dependent)

-   [ ] **Displays a Places UI Kit component featuring AI-generated summaries
    and aggregated reviews for a place (Client-side rendering).** Read
    [add-element-that-displays-ai-powered-summaries-and-reviews-about-specific.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-element-that-displays-ai-powered-summaries-and-reviews-about-specific.md).
    *Trigger Condition*: User needs to present modern, synthesized place
    information leveraging AI features within the UI. *Evidence Checkpoint*: The
    Places Summary component renders on the page showing AI-generated text and
    review highlights.
-   [ ] **Applies custom cascading stylesheet rules to Places UI Kit components
    for visual integration with the application design.** Read
    [apply-css-styling-place-data-element.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/apply-css-styling-place-data-element.md).
    *Dependencies*:
    `["add-element-that-displays-information-about-specific-place-web-page.md"]`
    *Trigger Condition*: Need to match the look and feel of the UI Kit component
    to the application's branding. *Evidence Checkpoint*: The UI Kit component
    displays the custom fonts, colors, and layout defined by the injected CSS.
-   [ ] **Uses a dedicated configuration tool to generate customized styles and
    settings for UI Kit components.** Read
    [customize-place-data-element-styling-and-configurations-with-element-customization.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-place-data-element-styling-and-configurations-with-element-customization.md).
    *Trigger Condition*: Need a graphical interface to easily prototype and
    configure UI Kit component appearance before implementation. *Evidence
    Checkpoint*: Configuration settings are outputted, ready to be applied to
    the Places UI Kit instance.
-   [ ] **Renders a comprehensive UI component containing details like address,
    hours, ratings, and photos for a Place ID.** Read
    [add-element-that-displays-information-about-specific-place-web-page.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-element-that-displays-information-about-specific-place-web-page.md).
    *Trigger Condition*: User selects a location and requires a detailed,
    structured panel of information. *Evidence Checkpoint*: A Places Details
    widget is displayed, populated with data from the specified Place ID.
-   [ ] **Renders a list component populated by a Places search query, allowing
    users to browse results.** Read
    [add-element-that-displays-list-places-based-query-string-web.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-element-that-displays-list-places-based-query-string-web.md).
    *Trigger Condition*: User needs to see search results in a browsable list
    format adjacent to the map. *Evidence Checkpoint*: A Places List component
    appears, populated dynamically based on the text search input.
-   [ ] **Renders a list component populated by a Nearby Search query, showing
    results around a coordinate.** Read
    [add-element-that-displays-list-places-near-specific-location-web.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-element-that-displays-list-places-near-specific-location-web.md).
    *Trigger Condition*: User needs to see nearby places displayed in a
    structured, actionable list. *Evidence Checkpoint*: A Places List component
    appears, populated dynamically based on proximity to a center point.
-   [ ] **Implements a lightweight Autocomplete component designed primarily to
    return Place IDs or basic predictions efficiently.** Read
    [add-basic-autocomplete-element-web-page-app-that-returns-google.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-basic-autocomplete-element-web-page-app-that-returns-google.md).
    *Trigger Condition*: Need a minimal search input for address or place
    selection that feeds a Place ID into subsequent API calls. *Evidence
    Checkpoint*: The Autocomplete input field provides place suggestions and
    returns a Place ID upon selection.

#### 🗺️ Feature Module: Street View (Optional - Use-Case Dependent)

-   [ ] **Initializes and displays an interactive panoramic view (Panorama) of a
    specified location or map viewport.** Read
    [add-configurable-interactive-google-street-view-web-page-mobile-app.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-configurable-interactive-google-street-view-web-page-mobile-app.md).
    *Trigger Condition*: User needs an immersive, ground-level perspective of a
    location. *Evidence Checkpoint*: A Street View Panorama object loads and
    displays the surrounding imagery.
-   [ ] **Places visual annotations (markers, lines, or custom elements) that
    are positioned correctly within the 3D panorama space.** Read
    [add-marker-overlay-google-street-view.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/add-marker-overlay-google-street-view.md).
    *Dependencies*:
    `["add-configurable-interactive-google-street-view-web-page-mobile-app.md"]`
    *Trigger Condition*: Need to annotate points of interest or directions
    relative to the Street View imagery. *Evidence Checkpoint*: A custom marker
    or overlay renders correctly, anchored to a location within the panoramic
    view.
-   [ ] **Implements handlers to capture user events specific to the Panorama,
    such as movement, field of view changes, or clicks.** Read
    [respond-user-interactions-and-events-google-street-view.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/respond-user-interactions-and-events-google-street-view.md).
    *Dependencies*:
    `["add-configurable-interactive-google-street-view-web-page-mobile-app.md"]`
    *Trigger Condition*: Application logic needs to react to user navigation or
    interaction within the Street View environment. *Evidence Checkpoint*: An
    event listener fires successfully when the panorama state changes (e.g.,
    orientation update).
-   [ ] **Configures the visibility of navigation elements like the compass,
    links, and zoom controls within the Street View interface.** Read
    [customize-the-controls-that-appear-google-street-view.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/customize-the-controls-that-appear-google-street-view.md).
    *Dependencies*:
    `["add-configurable-interactive-google-street-view-web-page-mobile-app.md"]`
    *Trigger Condition*: Need to simplify the UI or enforce certain navigation
    constraints in the panorama. *Evidence Checkpoint*: The Street View UI
    displays only the specified controls.
-   [ ] **Programmatically searches for and returns the metadata (ID,
    coordinates) of the closest available Street View panorama to a given
    location.** Read
    [return-google-street-view-panorama-for-specific-location.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/return-google-street-view-panorama-for-specific-location.md).
    *Trigger Condition*: Application needs to determine if Street View imagery
    exists for a point before loading the full viewer. *Evidence Checkpoint*:
    The Street View Service returns a Panorama metadata object, confirming
    imagery availability.

### 📦 Phase 3: Operational Constraints & Guardrails (Constraint)

-   [ ] **Step 3.1: Restricts the amount of data returned in Places API
    responses (Place Details, Search) to minimize API costs (Field Masking).**
    Read
    [specify-the-data-fields-included-place-information-responses.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-the-data-fields-included-place-information-responses.md).
    *Trigger Condition*: User needs to optimize API usage and bandwidth by
    requesting only necessary data points. *Evidence Checkpoint*: The API
    response payload contains only the fields explicitly listed in the field
    mask parameter.
-   [ ] **Step 3.2: Filters search results or autocomplete predictions to only
    include places belonging to specified categories (e.g., 'cafe',
    'hospital').** Read
    [specify-the-place-types-include-place-information-responses.md](https://www.gstatic.com/googlemapsplatform-agent-skills/maps-javascript-api-javascript/references/specify-the-place-types-include-place-information-responses.md).
    *Trigger Condition*: Search must be scoped to specific categories of Points
    of Interest. *Evidence Checkpoint*: The list of returned places contains
    only entities matching the defined type filter(s).
