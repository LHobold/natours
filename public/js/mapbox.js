/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZWFybG1pc3VyeSIsImEiOiJja3FiM3FqcGcwMTdsMnVucmxwY3RqOTQ4In0.H8zHh4aUlBMJw5pBxB0oUA';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/earlmisury/ckqb4av056bb118qaw24novhx',
    zoom: 10,
    scrollZoom: false,
    doubleClickZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    new mapboxgl.Popup({
      offset: 30,
      closeOnClick: false,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      right: 100,
      left: 100,
    },
  });
};
