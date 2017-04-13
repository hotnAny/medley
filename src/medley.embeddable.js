//	........................................................................................................
//
//  medley embeddable
//
//  by xiangchen@acm.org, 03/2017
//
//  include:
//  - constructor;
//  - generateGeometry: unified interface to generate geometry for the embeddable
//  - _generate1dGeometry: actual method to generate 1d geometry
//	........................................................................................................

var MEDLEY = MEDLEY || {};

MEDLEY.Embeddable = function(matobj) {
    if (matobj != undefined) {
        this._matobj = matobj;
        this._dim = matobj.dim;
        this._thickness = matobj.thickness;
        this._mesh = undefined;
        this._baseWidth = 5; // starting width for a cross sectional selection

        switch (this._dim) {
            case 1:
                this.generateGeometry = this._generate1dGeometry;
                break;
            case 2:
                // not able to decide yet
                break;
            case 3:
                // not able to decide yet
                break;
        }
    }
};

MEDLEY.Embeddable.prototype = {
    constructor: MEDLEY.Embeddable
};

//
//
//
MEDLEY.Embeddable.prototype.setDepth = function(d) {
    switch (this._dim) {
        case 1:
            var points = [];
            for (var i = 0; i < this.points0.length; i++) {
                points.push(this.points0[i].clone().multiplyScalar(1 - t)
                    .add(this.points1[i].clone().multiplyScalar(t)));
            }
            this._generate1dGeometry(points);
            break;
        case 2:
        case 3:
            this._generate23dGeometry({
                depth: d
            });
            break;

    }
}

//
//
//
MEDLEY.Embeddable.prototype.setThickness = function(t) {
    switch (this._dim) {
        case 1:
            break;
        case 2:
            break;
        case 3:
            this._generate23dGeometry({
                thickness: t
            });
            break;
    }
}

//
//
//
MEDLEY.Embeddable.prototype.setWidth = function(w, isLite) {
    switch (this._dim) {
        case 1:
            break;
        case 2:
        case 3:
            // NOTE: _placementInfo will be assigned only in a cross sectional selection case
            if (this._placementInfo != undefined) {
                var widthCrossSection = this._baseWidth + w * this._placementInfo._widthRange;
                XAC.scene.remove(this._liteElements);
                // if (!isLite) {
                XAC.scene.remove(this._meshes);
                this._meshes = undefined;
                // }
                this._liteElements = MEDLEY._init2dXsecPlacement(this, this._placementInfo,
                    widthCrossSection, isLite);
            }
            break;
    }
}

//
//
//
MEDLEY.Embeddable.prototype._generate1dGeometry = function(points, controls) {
    if (this._mesh == undefined) {
        this._mesh = [];
        for (var i = 0; i < points.length - 1; i++) {
            var segment = new XAC.ThickLine(points[i], points[i + 1], this._matobj
                .radius, XAC.MATERIALHIGHLIGHT);
            this._mesh.push(segment);
            XAC.scene.add(segment.m);
        }
    } else {
        for (var i = 0; i < points.length - 1; i++) {
            var segment = this._mesh[i];
            segment.update(points[i], points[i + 1], this._matobj.radius);
        }
    }
};

//
//
//
MEDLEY.Embeddable.prototype._generate23dGeometry = function(params) {
    if (params != undefined) {
        this._depth = params.depth || this._depth;
        this._thickness = params.thickness || this._thickness;
    }

    this._facesOuter = this._facesOuter || [];
    this._facesInner = this._facesInner || [];
    for (var i = 0; i < this._faces0.length; i++) {
        var verticesOuter = this._facesOuter[i] || [];
        var verticesInner = this._facesInner[i] || [];
        for (var j = 0; j < this._faces0[i].length; j++) {
            var vcenter = this._faces0[i][j].clone().multiplyScalar(1 - this._depth)
                .add(this._faces1[i][j].clone().multiplyScalar(this._depth));

            var halfThickness = this._faces1[i][j].clone().sub(this._faces0[i][j])
                .normalize().multiplyScalar(this._thickness / 2);

            var vouter = vcenter.clone().sub(halfThickness);
            var vinner = vcenter.clone().add(halfThickness);
            if (verticesOuter.length <= j) {
                verticesOuter.push(vouter);
                verticesInner.push(vinner);
            } else {
                verticesOuter[j].copy(vouter);
                verticesInner[j].copy(vinner);
            }
        }

        if (this._facesOuter.length <= i) {
            this._facesOuter.push(verticesOuter);
            this._facesInner.push(verticesInner);
        }
    }

    if (this._meshes == undefined) {
        // create the two sides of embeddable geometry
        var infoInner = this._makeSide(this._facesInner);
        var infoOuter = this._makeSide(this._facesOuter);
        // time('[generate embeddable geometry] created two sides');

        // stitch the two sides together
        var geometry = new THREE.Geometry();
        var nvertices = 0;
        console.assert(infoInner.mesh.geometry.vertices.length == infoOuter.mesh.geometry.vertices.length,
            'boundary points do not match');
        infoInner.mesh.geometry.assignVerticesToFaces();
        infoOuter.mesh.geometry.assignVerticesToFaces();
        var facesInner = infoInner.mesh.geometry.faces;
        var facesOuter = infoOuter.mesh.geometry.faces;
        var nfaces = facesInner.length;
        var nedges = 3;
        for (var i = 0; i < nfaces; i++) {
            for (var j = 0; j < nedges; j++) {
                var vi0 = facesInner[i].vertices[j];
                var vi1 = facesInner[i].vertices[(j + 1) % nedges];
                var vo0 = facesOuter[i].vertices[j];
                var vo1 = facesOuter[i].vertices[(j + 1) % nedges];
                geometry.vertices.push(vi0, vi1, vo0, vo1);
                geometry.faces.push(new THREE.Face3(nvertices + 0, nvertices + 1, nvertices + 2));
                geometry.faces.push(new THREE.Face3(nvertices + 2, nvertices + 3, nvertices + 1));
                nvertices += 4;
            }
        }

        geometry.computeFaceNormals();
        geometry.computeCentroids();
        var material = XAC.MATERIALHIGHLIGHT.clone();
        material.side = THREE.DoubleSide;
        var meshLateral = new THREE.Mesh(geometry, material);
        // time('[generate embeddable geometry] stitched the two sides together');

        // aggregating everything
        this._meshes = new THREE.Object3D();
        this._meshes.add(infoInner.mesh);
        this._meshes.add(infoOuter.mesh);
        this._meshes.add(meshLateral);

        XAC.scene.add(this._meshes);
    } else {
        for (mesh of this._meshes.children) {
            mesh.geometry.verticesNeedUpdate = true;
        }
    }
}



//
//
//
MEDLEY.Embeddable.prototype._makeSide = function(faces) {
    // time();
    var geometry = new THREE.Geometry();
    var nvertices = 0;
    for (vertices of faces) {
        geometry.vertices.push(vertices[0]);
        geometry.vertices.push(vertices[1]);
        geometry.vertices.push(vertices[2]);
        geometry.faces.push(new THREE.Face3(nvertices++, nvertices++, nvertices++));
    }
    geometry.computeFaceNormals();
    geometry.computeCentroids();
    geometry.assignVerticesToFaces();
    var material = XAC.MATERIALHIGHLIGHT.clone();
    material.side = THREE.DoubleSide;
    var mesh = new THREE.Mesh(geometry, material);
    // time('[_makeSide] made the side');

    // create octree
    var octree = new THREE.Octree({
        undeferred: true,
        depthMax: Infinity,
        objectsThreshold: 8,
    });
    octree.add(mesh, {
        useFaces: true
    });
    octree.update();
    octree.setVisibility(false);
    // time('[_makeSide] built octree');

    // find boundary points
    var __hasRedundancy = function(us, v) {
        var eps = 10e-3;
        for (u of us) {
            if (u.distanceTo(v) < eps) return true;
        }
        return false;
    };

    // var boundaryPoints = [];

    return {
        mesh: mesh,
        // boundaryPoints: boundaryPoints
    };
}
