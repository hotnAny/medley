//	........................................................................................................
//
//  medley embeddable
//
//  by xiangchen@acm.org, 03/2017
//
//      - constructor;
//
//      - setDepth: set the embeddable's depth into an object (1/2/3d)
//      - setWidth: set the embeddable's width (2/3d)
//      - setThickness: set the embeddable's thickness (3d)
//
//      - _generate1dGeometry: generate 1d geometry (polyline-based tube/tunnel)
//      - _generate2dGeometry: generate 2d geometry (slab extruded from a polyline)
//      - _generate3dGeometry: generate 3d geometry (solid extruded from users' 3d drawing)
//
//      - _generateSurface: generate a surface given a set of face vertices
//      - _stitchSurfaces: stitch two surfaces together by forming a lateral area
//      - _makeInteractive
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

MEDLEY.Embeddable = function (object, matobj) {
    if (matobj == undefined) {
        console.error('missing material properties of embeddable!');
        return;
    }

    this._object = object;

    this._matobj = matobj;
    this._dim = matobj.dim;
    this.bendRadius = matobj.bendRadius;

    // design parameters of an embeddable
    this.DEPTHEPS = 0.02; // small depth pertubation to avoid z fighting
    this._depthRatio = 0;
    this._thicknessRatio = 0; // starting thickness ratio for 3d embeddable
    this._baseThickness = matobj.thickness; // starting width for xsec embeddable
    this._baseWidth = 5; // starting width for a cross sectional selection
    this._widthRatio = 0;

    // map a [0,1] depth ratio to a slightly large interval
    this._mapDepth = function (d) {
        return -this.DEPTHEPS + (1 + 2 * this.DEPTHEPS) * d;
    };

    // map a [0,1] thickness ratio to a slightly large interval
    this._mapThickness = function (t) {
        var eps = this.DEPTHEPS * 3;
        return t + eps;
    }

    this._material = XAC.MATERIALHIGHLIGHT.clone();
    this._material.opacity = 1;
    this._material.transparent = false;
    this._material.side = THREE.DoubleSide;

    this._meshes = new THREE.Object3D();
    this._mesh = new THREE.Mesh(matobj.mesh.geometry.clone(), this._material);
    this._meshes.add(this._mesh);
    this._makeInteractive();
};

MEDLEY.Embeddable.prototype = {
    constructor: MEDLEY.Embeddable
};

//
//  set the depth of an embeddable (into the object)
//   - d: [0, 1] interpolate between control points/faces
//
MEDLEY.Embeddable.prototype.setDepth = function (d) {
    switch (this._dim) {
        case 0:
            this._place0dGeometry({
                depthRatio: d
            });
            break;
        case 1:
            this._generate1dGeometry({
                depthRatio: d
            });
            break;
        case 2:
            this._generate2dGeometry({
                depthRatio: d
            });
            break;
        case 3:
            this._generate3dGeometry({
                depthRatio: d
            });
            break;
    }
}

//
//  set the thickness of an embeddable
//  - t: [0, 1] interpolate between min thickness and (maxDepth-minDepth)
//
MEDLEY.Embeddable.prototype.setThickness = function (t) {

    switch (this._dim) {
        case 1:
            break;
        case 2:
            break;
        case 3:
            this._generate3dGeometry({
                thicknessRatio: t
            });
            break;
    }
}

//
//  set the width of an embeddable
//  - w: [0, 1] ranging between base width and maximum width
//
MEDLEY.Embeddable.prototype.setWidth = function (w, isLite) {
    switch (this._dim) {
        case 1:
            break;
        case 2:
            this._generate2dGeometry({
                widthRatio: w
            });
        case 3:
            // NOTE: _info will be assigned only in a cross sectional selection case
            if (this._info != undefined) {
                var widthCrossSection = this._baseWidth + w * this._widthRange;
                XAC.scene.remove(this._liteElements);
                MEDLEY.everything.remove(this._meshes);
                this._meshes = undefined;
                this._facesInner = undefined;
                this._facesOuter = undefined;

                this._liteElements = MEDLEY._select3dStrip(this, this._info,
                    widthCrossSection, isLite);

                if (this._meshes != undefined) MEDLEY.updateEverything(this._meshes);

                this._widthRatio = w;
            }
            break;
    }
}

//
//
//
MEDLEY.Embeddable.prototype._place0dGeometry = function (params) {
    if (this.p0 == undefined || this.p1 == undefined) return;
    if (params != undefined) this._depthRatio = params.depthRatio || this._depthRatio;
    var d = this._mapDepth(this._depthRatio);
    var p = this.p0.clone().multiplyScalar(1 - d).add(this.p1.clone().multiplyScalar(d));
    this._meshes.position.copy(p);
}

//
//  generate 1d geometry (polyline-based tube/tunnel)
//
MEDLEY.Embeddable.prototype._generate1dGeometry = function (params) {
    if (params != undefined) this._depthRatio = params.depthRatio || this._depthRatio;

    this.points = [];
    var d = this._mapDepth(this._depthRatio);
    for (var i = 0; i < this.points0.length; i++) {
        this.points.push(this.points0[i].clone().multiplyScalar(1 - d)
            .add(this.points1[i].clone().multiplyScalar(d)));
    }

    if (this._meshes == undefined) {
        this._meshes = new THREE.Object3D();
        var shape = XAC.circularShape(this._matobj.radius, 32);
        this._extrudedSegments = new XAC.Polyline(shape, this.points, this._material.clone());
        this._meshes.add(this._extrudedSegments.m);
        this._makeInteractive();
    } else {
        this._meshes.remove(this._extrudedSegments.m);
        this._extrudedSegments.update(this.points);
        this._meshes.add(this._extrudedSegments.m);
    }


};

//
//  generate 2d geometry (slab extruded from a polyline)
//
MEDLEY.Embeddable.prototype._generate2dGeometry = function (params) {
    if (params != undefined) {
        this._depthRatio = params.depthRatio || this._depthRatio;
        this._widthRatio = params.widthRatio || this._widthRatio;
        this._thicknessRatio = params.thicknessRatio || this._thicknessRatio;
    }

    var points = [];
    var d = this._mapDepth(this._depthRatio);
    for (var i = 0; i < this.points0.length; i++) {
        points.push(this.points0[i].clone().multiplyScalar(1 - d)
            .add(this.points1[i].clone().multiplyScalar(d)));
    }

    var geometry = new THREE.Geometry();
    this._facesInner = this._facesInner || [];
    this._facesOuter = this._facesOuter || [];

    // XXX
    var whalf = (this._baseWidth + this._widthRatio * this._widthRange) / 2;

    var vwidth = this.normal.clone().multiplyScalar(whalf);

    for (var i = 0; i < points.length - 1; i++) {
        var p0 = points[i];
        var p1 = points[i + 1];
        var p0top = p0.clone().add(vwidth);
        var p1top = p1.clone().add(vwidth);
        var p0bottom = p0.clone().sub(vwidth);
        var p1bottom = p1.clone().sub(vwidth);
        var vrange0 = this.points1[i].clone().sub(this.points0[i]);
        var vthickness0 = vrange0.normalize().multiplyScalar(this._baseThickness);
        var vrange1 = this.points1[i + 1].clone().sub(this.points0[i + 1]);
        var vthickness1 = vrange1.normalize().multiplyScalar(this._baseThickness);

        var p0topInner = p0top.clone().sub(vthickness0);
        var p1topInner = p1top.clone().sub(vthickness1);
        var p0bottomInner = p0bottom.clone().sub(vthickness0);
        var p1bottomInner = p1bottom.clone().sub(vthickness1);

        var p0topOuter = p0top.clone().add(vthickness0);
        var p1topOuter = p1top.clone().add(vthickness1);
        var p0bottomOuter = p0bottom.clone().add(vthickness0);
        var p1bottomOuter = p1bottom.clone().add(vthickness1);

        if (this._meshes == undefined) {
            this._facesInner.push([p0topInner, p1topInner, p0bottomInner]);
            this._facesInner.push([p1bottomInner, p1topInner, p0bottomInner]);
            this._facesOuter.push([p0topOuter, p1topOuter, p0bottomOuter]);
            this._facesOuter.push([p1bottomOuter, p1topOuter, p0bottomOuter]);
        } else {
            this._facesInner[2 * i][0].copy(p0topInner);
            this._facesInner[2 * i][1].copy(p1topInner);
            this._facesInner[2 * i][2].copy(p0bottomInner);
            this._facesInner[2 * i + 1][0].copy(p1bottomInner);
            this._facesOuter[2 * i][0].copy(p0topOuter);
            this._facesOuter[2 * i][1].copy(p1topOuter);
            this._facesOuter[2 * i][2].copy(p0bottomOuter);
            this._facesOuter[2 * i + 1][0].copy(p1bottomOuter);
        }
    }

    if (this._meshes == undefined) {
        var meshInner = this._generateSurface(this._facesInner);
        var meshOuter = this._generateSurface(this._facesOuter);
        var meshLateral = this._stitchSurfaces(meshInner, meshOuter);

        this._meshes = new THREE.Object3D();
        this._meshes.add(meshInner);
        this._meshes.add(meshOuter);
        this._meshes.add(meshLateral);

        this._makeInteractive();
    } else {
        for (mesh of this._meshes.children) {
            mesh.geometry.verticesNeedUpdate = true;
        }
    }
}

//
//  generate 3d geometry (solid extruded from users' 3d drawing)
//
MEDLEY.Embeddable.prototype._generate3dGeometry = function (params) {
    if (params != undefined) {
        this._depthRatio = params.depthRatio || this._depthRatio;
        this._thicknessRatio = params.thicknessRatio || this._thicknessRatio;
    }

    var d = this._mapDepth(this._depthRatio);
    var t = this._mapThickness(this._thicknessRatio);
    this._facesOuter = this._facesOuter || [];
    this._facesInner = this._facesInner || [];
    for (var i = 0; i < this._faces0.length; i++) {
        var verticesOuter = this._facesOuter[i] || [];
        var verticesInner = this._facesInner[i] || [];
        for (var j = 0; j < this._faces0[i].length; j++) {
            var vcenter = this._faces0[i][j].clone().multiplyScalar(1 - d)
                .add(this._faces1[i][j].clone().multiplyScalar(d));

            var vrange = this._faces1[i][j].clone().sub(this._faces0[i][j]);
            var vthickness;
            if (this._dim == 2) {
                vthickness = vrange.clone().normalize().multiplyScalar(this._baseThickness);
            } else if (this._dim == 3) {
                vthickness = vrange.clone().multiplyScalar(t);
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
        var meshInner = this._generateSurface(this._facesInner);
        var meshOuter = this._generateSurface(this._facesOuter);
        var meshLateral = this._stitchSurfaces(meshInner, meshOuter);

        // aggregating everything
        this._meshes = new THREE.Object3D();
        this._meshes.add(meshInner);
        this._meshes.add(meshOuter);
        this._meshes.add(meshLateral);

        this._makeInteractive();
    } else {
        for (mesh of this._meshes.children) {
            mesh.geometry.verticesNeedUpdate = true;
        }
    }
}


//
//  generate a surface given a set of face vertices
//
MEDLEY.Embeddable.prototype._generateSurface = function (faces) {
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

    return mesh;
}

//
//  stitch two surfaces together by forming a lateral area
//
MEDLEY.Embeddable.prototype._stitchSurfaces = function (mesh0, mesh1) {
    var geometry = new THREE.Geometry();
    var nvertices = 0;
    console.assert(mesh0.geometry.vertices.length == mesh1.geometry.vertices.length,
        'boundary points do not match');
    mesh0.geometry.assignVerticesToFaces();
    mesh1.geometry.assignVerticesToFaces();
    var facesInner = mesh0.geometry.faces;
    var facesOuter = mesh1.geometry.faces;
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
    return new THREE.Mesh(geometry, this._material.clone());
}

//
//  make each embeddable selectable, and associated with sliders on depth, width and thickness
//
MEDLEY.Embeddable.prototype._makeInteractive = function () {
    this._meshes.embeddable = this;
    for (mesh of this._meshes.children) {
        mesh.object3d = this._meshes;
        XAC.objects.push(mesh);
    }

    this._meshes.selectable(true, function () {
        for (mesh of this.children) {
            mesh.material.color.setHex(COLORHIGHLIGHT);
            mesh.material.needsUpdate = true;
        }
        XAC.updateSlider(MEDLEY._sldrDepth, this.embeddable._depthRatio, MEDLEY.sldrMapFunc);
        XAC.updateSlider(MEDLEY._sldrThickness, this.embeddable._thicknessRatio, MEDLEY.sldrMapFunc);
        XAC.updateSlider(MEDLEY._sldrWidth, this.embeddable._widthRatio, MEDLEY.sldrMapFunc);
    }, function () {
        for (mesh of this.children) {
            mesh.material.color.setHex(COLORCONTRAST);
            mesh.material.needsUpdate = true;
        }
    });

    XAC.updateSlider(MEDLEY._sldrDepth, this._depthRatio, MEDLEY.sldrMapFunc);
    XAC.updateSlider(MEDLEY._sldrThickness, this._thicknessRatio, MEDLEY.sldrMapFunc);
    XAC.updateSlider(MEDLEY._sldrWidth, this._widthRatio, MEDLEY.sldrMapFunc);

    this._meshes._selected = true;
    if (XAC._selecteds.indexOf(this._meshes) < 0) XAC._selecteds.push(this._meshes);
}

//
//  remove the embeddable's meshes
//
MEDLEY.Embeddable.prototype.selfDestroy = function () {
    MEDLEY.embeddables.remove(this);

    var __removeFrom = function (object, parent) {
        for (c of parent.children) {
            if (c == object) {
                parent.remove(c);
                return;
            }
            if (c.children != undefined && c.children.length > 0) {
                __removeFrom(object, c);
            }
        }
    }

    __removeFrom(this._meshes, MEDLEY.everything);
}

XAC.updateSlider = function (sldr, value, mapFunc) {
    var sldrValue = sldr.slider('option', 'value');
    value = mapFunc(value, sldr);
    if (sldrValue != value) {
        sldr.slider('value', value);
        // log([sldrValue, value])
    } else {

    }
}