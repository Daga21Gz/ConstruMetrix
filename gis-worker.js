/**
 * CONSTRUMETRIX GIS WORKER v1.0
 * Handles heavy GeoJSON transformations and filtering off-main-thread
 */

importScripts('https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.8.0/proj4.js');

self.onmessage = function (e) {
    const { action, data, source, dest } = e.data;

    if (action === 'transform') {
        const features = data.features;
        const total = features.length;

        for (let i = 0; i < total; i++) {
            const f = features[i];
            if (!f.geometry || !f.geometry.coordinates) continue;

            try {
                const coords = f.geometry.coordinates;
                const type = f.geometry.type;

                // Simple skip for already geographic coords
                const sample = type === 'Point' ? coords : (type === 'LineString' ? coords[0] : coords[0][0]);
                if (sample && Math.abs(sample[0]) <= 180 && Math.abs(sample[1]) <= 90) continue;

                if (type === 'Point') {
                    const p = proj4(source, dest, [coords[0], coords[1]]);
                    f.geometry.coordinates = [p[0], p[1]];
                } else if (type === 'LineString') {
                    f.geometry.coordinates = coords.map(pt => {
                        const p = proj4(source, dest, [pt[0], pt[1]]);
                        return [p[0], p[1]];
                    });
                } else if (type === 'Polygon') {
                    f.geometry.coordinates = coords.map(ring => ring.map(pt => {
                        const p = proj4(source, dest, [pt[0], pt[1]]);
                        return [p[0], p[1]];
                    }));
                } else if (type === 'MultiPolygon') {
                    f.geometry.coordinates = coords.map(poly => poly.map(ring => ring.map(pt => {
                        const p = proj4(source, dest, [pt[0], pt[1]]);
                        return [p[0], p[1]];
                    })));
                } else if (type === 'MultiLineString') {
                    f.geometry.coordinates = coords.map(line => line.map(pt => {
                        const p = proj4(source, dest, [pt[0], pt[1]]);
                        return [p[0], p[1]];
                    }));
                }
            } catch (err) {
                // Ignore single feature errors
            }

            // Report progress every 2000 items
            if (i % 2000 === 0) {
                self.postMessage({ action: 'progress', current: i, total: total });
            }
        }

        self.postMessage({ action: 'complete', data: data });
    }
};
