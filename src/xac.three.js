//
//
//
THREE.Geometry.prototype.highlightFace = function(face, color, scene) {
    var v1 = this.vertices[face.a];
    var v2 = this.vertices[face.b];
    var v3 = this.vertices[face.c];

    var vs = [v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z];
    var fs = new THREE.Face3(0, 1, 2);

    var geometry = new THREE.Geometry(); //PolyhedronGeometry(vs, fs, 1, 1);
    geometry.vertices.push(v1);
    geometry.vertices.push(v2);
    geometry.vertices.push(v3);
    geometry.faces.push(new THREE.Face3(0, 1, 2));
    var material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5
    });
    var triangle = new THREE.Mesh(geometry, material);
    triangle.material.side = THREE.DoubleSide;

    scene.add(triangle);

    return triangle;
}

//
//
//
THREE.Geometry.prototype.computeCentroids = function() {
    for (var i = 0; i < this.faces.length; i++) {
        var f = this.faces[i];

        if (f.centroid != undefined) {
            continue;
        }

        var f = this.faces[i];
        var va = this.vertices[f.a].clone(); //.applyMatrix4(obj.matrixWorld);
        var vb = this.vertices[f.b].clone(); //.applyMatrix4(obj.matrixWorld);
        var vc = this.vertices[f.c].clone(); //.applyMatrix4(obj.matrixWorld);
        f.centroid = new THREE.Vector3().addVectors(va, vb).add(vc).divideScalar(3);
    }
}

/*
	creating a list of neighbours (edge sharing) for each triangle

	known issues:
	- each triangle should have exactly 3 neighbors. however, some have 4 due to triangle redundance; some have only 2 due to unmanifold structure
*/
THREE.Geometry.prototype.createNeighborList = function(octree) {
    var eps = 1e-6;
    for (var i = 0; i < this.faces.length; i++) {
        var f = this.faces[i];

        if (f.neighbors != undefined && f.neighbors.length > 0) {
            continue;
        }

        // var va = this.vertices[f.a].clone(); //.applyMatrix4(obj.matrixWorld);
        // var vb = this.vertices[f.b].clone(); //.applyMatrix4(obj.matrixWorld);
        // var vc = this.vertices[f.c].clone(); //.applyMatrix4(obj.matrixWorld);
        //
        // var ctr = new THREE.Vector3().addVectors(va, vb).add(vc).divideScalar(3);

        if (f.centroid == undefined) {
            this.computeCentroids();
        }

        var ctr = f.centroid.clone();
        /* use octree to filter close-by faces */
        var elms = octree.search(ctr, 1);
        // addABall(ctr, 0xffffff, 1)
        f.neighbors = [];
        var vlist = [f.a, f.b, f.c];

        // for later use - finding neighbors
        // f.collected = false;

        // f.area = triangleArea(va, vb, vc);

        // this.highlightFace(f, 0xffff00, XAC.scene);

        for (var j = 0; j < elms.length; j++) {
            var ff = elms[j].faces; //.centroid.clone();

            var vlist2 = [ff.a, ff.b, ff.c];

            // skip the face itself
            if (Math.abs(f.a - ff.a) < eps && Math.abs(f.b == ff.b) < eps && Math.abs(f.c == ff.c) <
                eps) {
                continue;
            }

            // this.highlightFace(ff, 0xff0000, XAC.scene);

            // searching for pairs of vertices that correspond to the shared edge of neighboring triangles
            var numPairs = 0;
            for (var ii = 0; ii < vlist2.length; ii++) {
                for (var jj = 0; jj < vlist.length; jj++) {
                    if (this.vertices[vlist2[ii]].distanceTo(
                            this.vertices[vlist[jj]]) < eps) {
                        numPairs++;
                        break;
                    }
                }
            }

            // when there are two pairs of them, this is a neighbor that shares exactly one edge
            if (numPairs == 2) {
                f.neighbors.push(ff);
            }
        }

    }
}