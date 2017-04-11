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
MEDLEY.Embeddable.prototype._generate2dGeometry = function(faces, thickness) {
    XAC.scene.remove(this._mesh);
    var geometry = new THREE.Geometry();
    var nvertices = 0;
    for (vertices of faces) {
        geometry.vertices.push(vertices[0]);
        geometry.vertices.push(vertices[1]);
        geometry.vertices.push(vertices[2]);
        geometry.faces.push(new THREE.Face3(nvertices++, nvertices++, nvertices++));
    }
    geometry.computeFaceNormals();
    var material = XAC.MATERIALHIGHLIGHT.clone();
    material.side = THREE.DoubleSide;

    this._mesh = new THREE.Mesh(geometry, material);
    XAC.scene.add(this._mesh);
}


//
//
//
MEDLEY.Embeddable.prototype.setDepth = function(t) {
    switch (this._dim) {
        case 1:
            var points = [];
            for (var i = 0; i < this.points0.length; i++) {
                points.push(this.points0[i].clone().multiplyScalar(1 - t)
                    .add(this.points1[i].clone().multiplyScalar(t)));
            }
            this.generateGeometry(points);
            break;
        case 2:
            var faces = [];
            for (var i = 0; i < this._faces0.length; i++) {
                var vertices = [];
                for (var j = 0; j < this._faces0[i].length; j++) {
                    vertices.push(this._faces0[i][j].clone().multiplyScalar(1 - t)
                        .add(this._faces1[i][j].clone().multiplyScalar(t)));
                }
                faces.push(vertices);
            }
            this._generate2dGeometry(faces);
            break;
        case 3:

            break;
    }

}
