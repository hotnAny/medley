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
    }

    this.DEPTHEPS = 0.01; // small depth pertubation to avoid z fighting
    this._depthRatio = -this.DEPTHEPS;
    this._thicknessRatio = 0; // starting thickness ratio for 3d embeddable
    this._baseThickness = matobj.thickness; // starting width for xsec embeddable
    this._baseWidth = 5; // starting width for a cross sectional selection
    this._widthRatio = 0;

    this._material = XAC.MATERIALHIGHLIGHT.clone();
    this._material.opacity = 1;
    this._material.transparent = false;
    this._material.side = THREE.DoubleSide;
};

MEDLEY.Embeddable.prototype = {
    constructor: MEDLEY.Embeddable
};

//
//  set the depth of an embeddable (into the object)
//   - d: [0, 1] interpolate between control points/faces
//
MEDLEY.Embeddable.prototype.setDepth = function(d) {
    d = -this.DEPTHEPS + (1 + 2 * this.DEPTHEPS) * d;
    switch (this._dim) {
        case 1:
            this._generate1dGeometry({
                depthRatio: d
            });
            break;
        case 2:
        case 3:
            this._generate23dGeometry({
                depthRatio: d
            });
            break;

    }
}

//
//  set the thickness of an embeddable
//  - t: [0, 1] interpolate between min thickness and (maxDepth-minDepth)
//
MEDLEY.Embeddable.prototype.setThickness = function(t) {
    var eps = this.DEPTHEPS * 3;
    t += eps;
    switch (this._dim) {
        case 1:
            break;
        case 2:
            break;
        case 3:
            this._generate23dGeometry({
                thicknessRatio: t
            });
            break;
    }
}

//
//  set the width of an embeddable
//  - w: [0, 1] ranging between base width and maximum width
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
                XAC.scene.remove(this._meshes);
                this._meshes = undefined;
                this._facesInner = undefined;
                this._facesOuter = undefined;
                this._liteElements = MEDLEY._init2dXsecPlacement(this, this._placementInfo,
                    widthCrossSection, isLite);
                this._widthRatio = w;
            }
            break;
    }
}

//
//  generate 1d geometry - segments of cylinders
//  - points: points of the line segments
//
MEDLEY.Embeddable.prototype._generate1dGeometry = function(params) {
    if (params != undefined) {
        this._depthRatio = params.depthRatio || this._depthRatio;
    }
    var points = [];
    for (var i = 0; i < this.points0.length; i++) {
        points.push(this.points0[i].clone().multiplyScalar(1 - this._depthRatio)
            .add(this.points1[i].clone().multiplyScalar(this._depthRatio)));
    }

    if (this._meshes == undefined) {
        this._meshes = new THREE.Object3D();
        this._segments = [];
        for (var i = 0; i < points.length - 1; i++) {
            var segment = new XAC.ThickLine(points[i], points[i + 1], this._matobj
                .radius, this._material.clone());
            this._meshes.add(segment.m);
            this._segments.push(segment);
        }
        XAC.scene.add(this._meshes);

        this._makeInteractive();
        this._meshes._selected = true;
        XAC._selecteds.push(this._meshes);

    } else {
        for (var i = 0; i < points.length - 1; i++) {
            var segment = this._segments[i];
            segment.update(points[i], points[i + 1], this._matobj.radius);
        }
    }
};

//
//  generate 2 or 3d geometry - segments of cylinders
//  - params: depthRatio and/or thicknessRatio to control depth and thickness
//
MEDLEY.Embeddable.prototype._generate23dGeometry = function(params) {
    if (params != undefined) {
        this._depthRatio = params.depthRatio || this._depthRatio;
        this._thicknessRatio = params.thicknessRatio || this._thicknessRatio;
    }

    this._facesOuter = this._facesOuter || [];
    this._facesInner = this._facesInner || [];
    for (var i = 0; i < this._faces0.length; i++) {
        var verticesOuter = this._facesOuter[i] || [];
        var verticesInner = this._facesInner[i] || [];
        for (var j = 0; j < this._faces0[i].length; j++) {
            var vcenter = this._faces0[i][j].clone().multiplyScalar(1 - this._depthRatio)
                .add(this._faces1[i][j].clone().multiplyScalar(this._depthRatio));

            var vrange = this._faces1[i][j].clone().sub(this._faces0[i][j]);
            var vthickness;
            if (this._dim == 2) {
                vthickness = vrange.clone().normalize().multiplyScalar(this._baseThickness);
            } else if (this._dim == 3) {
                vthickness = vrange.clone().multiplyScalar(this._thicknessRatio);
            }

            var centerRatio = vcenter.clone().sub(this._faces0[i][j]).length() / vrange.length();
            var vouter = vcenter.clone().sub(vthickness.clone().multiplyScalar(centerRatio));
            var vinner = vcenter.clone().add(vthickness.clone().multiplyScalar(1 - centerRatio));
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
        var infoInner = this._generateSurface(this._facesInner);
        var infoOuter = this._generateSurface(this._facesOuter);

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
        var meshLateral = new THREE.Mesh(geometry, this._material.clone());

        // aggregating everything
        this._meshes = new THREE.Object3D();
        this._meshes.add(infoInner.mesh);
        this._meshes.add(infoOuter.mesh);
        this._meshes.add(meshLateral);

        XAC.scene.add(this._meshes);

        this._makeInteractive();
        this._meshes._selected = true;
        XAC._selecteds.push(this._meshes);
    } else {
        for (mesh of this._meshes.children) {
            mesh.geometry.verticesNeedUpdate = true;
        }
    }
}



//
//  generate a surface given a set of face vertices
//
MEDLEY.Embeddable.prototype._generateSurface = function(faces) {
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
    var mesh = new THREE.Mesh(geometry, this._material.clone());

    return {
        mesh: mesh
    };
}

//
//
//
MEDLEY.Embeddable.prototype._makeInteractive = function() {
    this._meshes.embeddable = this;
    for (mesh of this._meshes.children) {
        mesh.object3d = this._meshes;
        XAC.objects.push(mesh);
    }

    this._meshes.selectable(true, function() {
        for (mesh of this.children) {
            mesh.material.color.setHex(COLORHIGHLIGHT);
            mesh.material.needsUpdate = true;
        }
        MEDLEY._sldrDepth.slider('value',
            this.embeddable._depthRatio * MEDLEY._sldrDepth.slider('option', 'max'));
        MEDLEY._sldrThickness.slider('value',
            this.embeddable._thicknessRatio * MEDLEY._sldrThickness.slider('option', 'max')
        );
        MEDLEY._sldrWidth.slider('value',
            this.embeddable._widthRatio * MEDLEY._sldrWidth.slider('option', 'max'));
    }, function() {
        for (mesh of this.children) {
            mesh.material.color.setHex(COLORCONTRAST);
            mesh.material.needsUpdate = true;
        }
    });
}

//
//
//
MEDLEY.Embeddable.prototype.selfDestroy = function() {
    MEDLEY._embeddables.remove(this);
    XAC.scene.remove(this._meshes);
}
