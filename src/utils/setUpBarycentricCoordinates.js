import * as THREE from 'three';

// Hash all the edges and remember which face they're associated with
// (Adapted from THREE.EdgesHelper)
function sortFunction( a, b ) {
    if (a[0] - b[0] !== 0) {
        return (a[0] - b[0]);
    } else if (a[1] - b[1] !== 0) {
        return (a[1] - b[1]);
    } else {
        return (a[2] - b[2]);
    }
}

const setUpBarycentricCoordinates = function(geometry) {
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal.array;

    // Build new attribute storing barycentric coordinates
    // for each vertex
    const centers = new THREE.BufferAttribute(new Float32Array(positions.length), 3);
    // start with all edges disabled
    for (var f = 0; f < positions.length; f++) {
      centers.array[f] = 1;
    }

    geometry.addAttribute('center', centers);
    let edge = [0, 0];
    const hash = {};
    let face;

    for (let i = 0; i < positions.length / 9; i++) {
      const a = i * 9
      face = [
        [positions[a+0], positions[a+1], positions[a+2]],
        [positions[a+3], positions[a+4], positions[a+5]],
        [positions[a+6], positions[a+7], positions[a+8]]
      ];
      for (let j = 0; j < 3; j++) {
        const k = (j + 1) % 3;
        const b = j * 3;
        const c = k * 3;
        edge[0] = face[j];
        edge[1] = face[k];
        edge.sort(sortFunction);
        const key = edge[0] + ' | ' + edge[1];
        if (hash[key] === undefined) {
          hash[key] = {
            face1: a,
            face1vert1: a + b,
            face1vert2: a + c,
            face2: undefined,
            face2vert1: undefined,
            face2vert2: undefined
          };
        } else {
          hash[key].face2 = a;
          hash[key].face2vert1 = a + b;
          hash[key].face2vert2 = a + c;
        }
      }
    }

    for (const key in hash) {
      const h = hash[key];

      // ditch any edges that are bordered by two coplanar faces
      let normal1, normal2;
      if (h.face2 !== undefined) {
        normal1 = new THREE.Vector3(normals[h.face1+0], normals[h.face1+1], normals[h.face1+2]);
        normal2 = new THREE.Vector3(normals[h.face2+0], normals[h.face2+1], normals[h.face2+2]);
        if (normal1.dot( normal2 ) >= 0.9999) {
          continue;
        }
      }

      // mark edge vertices as such by altering barycentric coordinates
      var otherVert;
      otherVert = 3 - (h.face1vert1 / 3) % 3 - (h.face1vert2 / 3) % 3;
      centers.array[h.face1vert1 + otherVert] = 0;
      centers.array[h.face1vert2 + otherVert] = 0;

      otherVert = 3 - (h.face2vert1 / 3) % 3 - (h.face2vert2 / 3) % 3;
      centers.array[h.face2vert1 + otherVert] = 0;
      centers.array[h.face2vert2 + otherVert] = 0;
    }
}

export default setUpBarycentricCoordinates;
