var MEDLEY = MEDLEY || {};

MEDLEY.PaintInput = function(scene) {
    this._info = 'medley paint input';
    this._radiusPaint = 1;
    this._colorPaint = 0xfffa90;
    this._isDown = false;
}

MEDLEY.PaintInput.prototype = {
    constructor: MEDLEY.PaintInput
};

MEDLEY.PaintInput.prototype.mousedown = function(e, hit) {
    if (e.which != LEFTMOUSE || this._isDown) {
        return false;
    }

    // log([hit.point, v1, v2, v3])
    //
    // _balls.remove(addABall(hit.point, this._colorPaint, this._radiusPaint));
    // addATriangle(v1, v2, v3, 0xffffff)

    this._isDown = true;
    this._object = hit.object;
    this._points = [];
    this._normals = [];
    this._minPoint = new THREE.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    this._maxPoint = new THREE.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

    return true;
};

MEDLEY.PaintInput.prototype.mousemove = function(e) {
    if (this._isDown) {
        var hits = rayCast(e.clientX, e.clientY, [this._object]);
        if (hits.length > 0) {
            var hit = hits[0];
            this._points.push(hit.point);

            this._minPoint.x = Math.min(this._minPoint.x, hit.point.x);
            this._minPoint.y = Math.min(this._minPoint.y, hit.point.y);
            this._minPoint.z = Math.min(this._minPoint.z, hit.point.z);

            this._maxPoint.x = Math.max(this._maxPoint.x, hit.point.x);
            this._maxPoint.y = Math.max(this._maxPoint.y, hit.point.y);
            this._maxPoint.z = Math.max(this._maxPoint.z, hit.point.z);

            addABall(hit.point, this._colorPaint, this._radiusPaint);

            // interpolate the normal
            var vertices = hit.object.geometry.vertices;
            var v1 = vertices[hit.face.a]
            var v2 = vertices[hit.face.b]
            var v3 = vertices[hit.face.c]
            var p = hit.point;

            var a1 = XAC.triangleArea(p, v2, v3);
            var a2 = XAC.triangleArea(p, v3, v1);
            var a3 = XAC.triangleArea(p, v1, v2);

            var normals = hit.face.vertexNormals;
            var n1 = normals[0].clone();
            var n2 = normals[1].clone();
            var n3 = normals[2].clone();

            // n = (a1*n1 + a2*n2 + a3*n3) / (a1+a2+a3)
            var n = n1.multiplyScalar(a1).add(n2.multiplyScalar(a2)).add(n3.multiplyScalar(a3))
                .divideScalar(a1 + a2 + a3);
            // addAnArrow(hit.point, n, 10, 0xee3322);

            this._normals.push(n.normalize());
        }
    }
};

MEDLEY.PaintInput.prototype.mouseup = function(e) {
    // extend each point with its normal
    var diagnal = this._maxPoint.distanceTo(this._minPoint);
    var numPoints = this._points.length;
    for (var i = 0; i < numPoints; i++) {
        var p = this._points[i].clone().add(this._normals[i].clone().multiplyScalar(diagnal));
        this._points.push(p);
        // addABall(p, this._colorPaint, this._radiusPaint);
    }

    // find fitting plane
    var params = XAC.findPlaneToFitPoints(this._points);
    var plane = new XAC.Plane(diagnal * 2, diagnal * 2, XAC.MATERIALCONTRAST);
    var ctrPlane = new THREE.Vector3().addVectors(this._minPoint, this._maxPoint).divideScalar(2);
    plane.fitTo(ctrPlane, params.A,params.B, params.C);
    // addABall(this._minPoint, 0xff0000, this._radiusPaint * 2);
    // addABall(this._maxPoint, 0x00ff00, this._radiusPaint * 2);
    // addABall(ctrPlane, 0x0000ff, this._radiusPaint * 2);
    XAC.scene.add(plane.m);

    this._isDown = false;

    setTimeout(function() {
        XAC.scene.remove(plane.m);
        removeBalls();
    }, 1000);
};
