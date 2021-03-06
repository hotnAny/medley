//	........................................................................................................
//
//  medley input technique - painting on a 3d object
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

MEDLEY.PaintInput = function (scene) {
    this._info = 'medley paint input';
    this._radiusPaint = 0.5;
    this._colorPaint = 0xfffa90;
    this._isDown = false;
    this._callbacks = [];
}

MEDLEY.PaintInput.prototype = {
    constructor: MEDLEY.PaintInput
};

MEDLEY.PaintInput.prototype.addSubscriber = function (callback) {
    this._callbacks.push(callback);
}

MEDLEY.PaintInput.prototype.mousedown = function (e, hit) {
    if (e.which != LEFTMOUSE || this._isDown) {
        return false;
    }

    this._isDown = true;
    this._object = hit.object;
    this._points = [];
    this._normals = [];
    this._faces = [];
    this._minPoint = new THREE.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    this._maxPoint = new THREE.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    this._footprint = 0;

    // get the transformed geometry of the object
    this._geometry = gettg(this._object);
    this._geometry.computeVertexNormals();
    this._geometry.computeFaceNormals();

    this._doPaint(e);
    this._eventCache = [e];

    return true;
};

MEDLEY.PaintInput.prototype.mousemove = function (e) {
    if (!this._isDown) {
        return;
    }

    this._doPaint(e);
    this._eventCache.push(e);
};

MEDLEY.PaintInput.prototype.mouseup = function (e) {
    if (!this._isDown) {
        return;
    }

    this._doPaint(e);
    this._eventCache.push(e);

    this._isDown = false;

    if (this._points.length <= 0) {
        return;
    }

    var info = {
        object: this._object,
        points: this._points,
        faces: this._faces,
        normals: this._normals,
        minPoint: this._minPoint,
        maxPoint: this._maxPoint,
        footprint: this._footprint
    };

    for (callback of this._callbacks) {
        callback(info);
    }

    removeBalls();
};

MEDLEY.PaintInput.prototype._doPaint = function (e, toSnap) {
    var hits = rayCast(e.clientX, e.clientY, [this._object]);
    if (hits.length > 0) {
        var hit = hits[0];

        if (toSnap) {
            var vertices = hit.object.geometry.vertices;
            var indices = [hit.face.a, hit.face.b, hit.face.c];
            var minDistSnap = Number.MAX_VALUE;
            var snapPoint = hit.point;
            for (var i = 0; i < indices.length; i++) {
                var p = vertices[indices[i]];
                var q = vertices[indices[(i + 1) % indices.length]];
                var v = hit.point.clone();
                var qsubp = new THREE.Vector3().subVectors(q, p);
                var t = v.clone().sub(p).dot(qsubp) / Math.pow(qsubp.length(), 2);
                var vhat = p.clone().add(qsubp.multiplyScalar(t));
                var distSnap = vhat.distanceTo(v);
                if (distSnap < minDistSnap) {
                    minDistSnap = distSnap;
                    snapPoint = vhat;
                }
            }
            hit.point = snapPoint;
            _balls.remove(addABall(snapPoint, 0xff0000, 0.5));
        }

        if (this._points.length > 0) {
            this._footprint += hits[0].point.distanceTo(this._points.last());
        }

        this._points.push(hit.point);

        if (this._faces.last() != hit.face) {
            this._faces.push(hit.face);
        }

        this._minPoint.x = Math.min(this._minPoint.x, hit.point.x);
        this._minPoint.y = Math.min(this._minPoint.y, hit.point.y);
        this._minPoint.z = Math.min(this._minPoint.z, hit.point.z);

        this._maxPoint.x = Math.max(this._maxPoint.x, hit.point.x);
        this._maxPoint.y = Math.max(this._maxPoint.y, hit.point.y);
        this._maxPoint.z = Math.max(this._maxPoint.z, hit.point.z);

        addABall(hit.point, this._colorPaint, this._radiusPaint);

        // interpolate the normal
        // var vertices = hit.object.geometry.vertices;
        var vertices = this._geometry.vertices;

        var v1 = vertices[hit.face.a]
        var v2 = vertices[hit.face.b]
        var v3 = vertices[hit.face.c]
        var p = hit.point;


        var a1 = XAC.triangleArea(p, v2, v3);
        var a2 = XAC.triangleArea(p, v3, v1);
        var a3 = XAC.triangleArea(p, v1, v2);

        // get the transformed vertex normals
        // var idxFace = hit.object.geometry.faces.indexOf(hit.face);
        // var normals = this._geometry.faces[idxFace].vertexNormals;

        var normals = hit.face.vertexNormals;
        var n1 = normals[0].clone();
        var n2 = normals[1].clone();
        var n3 = normals[2].clone();

        // n = (a1*n1 + a2*n2 + a3*n3) / (a1+a2+a3)
        var n = n1.multiplyScalar(a1).add(n2.multiplyScalar(a2)).add(n3.multiplyScalar(a3))
            .divideScalar(a1 + a2 + a3);


        this._normals.push(n.normalize());
    }
}