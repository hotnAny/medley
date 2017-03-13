//	........................................................................................................
//
//
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

// XXX
MEDLEY._matobjSelected = {
    radius: 0.5, // mm
    dim: 2
};

//
MEDLEY.initPlacementWithPainting = function(info) {
    var diagnal = info.maxPoint.distanceTo(info.minPoint);
    var ctrPlane = new THREE.Vector3().addVectors(info.minPoint, info.maxPoint).divideScalar(2);

    // find cross plane
    var paramsCross = XAC.findPlaneToFitPoints(info.points);
    var nmlCrossPlane = new THREE.Vector3(paramsCross.A, paramsCross.B, paramsCross.C).normalize();
    var planeCross = new XAC.Plane(diagnal * 2, diagnal * 2, XAC.MATERIALCONTRAST);
    planeCross.fitTo(ctrPlane, paramsCross.A, paramsCross.B, paramsCross.C);
    XAC.scene.add(planeCross.m);

    // find normal plane
    var pointsExtended = [];
    for (var i = 0; i < info.points.length; i++) {
        var p = info.points[i].clone().add(info.normals[i].clone().multiplyScalar(diagnal));
        pointsExtended.push(p);
    }

    var paramsNormal = XAC.findPlaneToFitPoints(info.points.concat(pointsExtended));
    var planeNormal = new XAC.Plane(diagnal * 2, diagnal * 2, XAC.MATERIALHIGHLIGHT);
    planeNormal.fitTo(ctrPlane, paramsNormal.A, paramsNormal.B, paramsNormal.C);
    XAC.scene.add(planeNormal.m);

    if (MEDLEY._matobjSelected != undefined) {
        var embeddable = new MEDLEY.Embeddable(MEDLEY._matobjSelected);
        // embeddable.generateGeometry(info);

        switch (embeddable._dim) {
            case 0:
                break;
            case 1:
                // generative material
                embeddable.generateGeometry = function(points) {
                    if (this._geometry == undefined) {
                        this._geometry = [];
                        for (var i = 0; i < points.length - 1; i++) {
                            var segment = new XAC.ThickLine(points[i], points[i + 1], this._matobj
                                .radius, XAC.MATERIALHIGHLIGHT);
                            this._geometry.push(segment);
                            XAC.scene.add(segment.m);
                        }
                    } else {
                        for (var i = 0; i < points.length - 1; i++) {
                            var segment = this._geometry[i];
                            segment.update(points[i], points[i + 1], this._matobj.radius);
                        }
                    }
                };
                // embeddable.generateGeometry(info.points);

                // impose ranges for each point
                info.object.material.side = THREE.DoubleSide;
                info.object.material.needsUpdate = true;
                embeddable.points0 = [];
                embeddable.points1 = [];
                for (var i = 0; i < info.points.length; i++) {
                    var rayCaster = new THREE.Raycaster();
                    var nml = info.normals[i].multiplyScalar(-1).normalize();
                    rayCaster.ray.set(info.points[i].clone().add(nml.clone().multiplyScalar(0.01)), nml);
                    var hits = rayCaster.intersectObjects([info.object]);
                    // _balls.remove(addABall(hits[0].point, 0xff0000, 1));
                    if (hits.length > 0) {
                        embeddable.points0.push(info.points[i]);
                        embeddable.points1.push(hits[0].point);
                    }
                }
                info.object.material.side = THREE.FrontSide;
                info.object.material.needsUpdate = true;

                // XXX
                var t = 0.5;
                var points = [];
                for (var i = 0; i < embeddable.points0.length; i++) {
                    points.push(embeddable.points0[i].multiplyScalar(1 - t).add(embeddable.points1[i].multiplyScalar(
                        t)));
                }
                embeddable.generateGeometry(points);

                // ghost object for manipulation
                // var ghostArrow = ...
                // var sliderInput = new XAC.SliderInput(XAC.scene);
                // sliderInput.addSubscriber(function(info) {
                //     var t = info.interpolation;
                //
                //     for (var i = 0; i < embeddable.points0.length; i++) {
                //         embeddable.points[i] = new THREE, Vector3().addVectors(
                //             points0[i].multiplyScalar(t),
                //             points1[i].multiplyScalar(1 - t));
                //     }
                //
                // });
                break;
            case 2:
                // 1. find bounding Cylinder
                var projOnNormal = XAC.project(info.points, nmlCrossPlane);
                var height = projOnNormal[1] - projOnNormal[0];
                var projOnCrossPlane = [];
                var zAxis = new THREE.Vector3(0, 0, -1);
                var angleToRotate = nmlCrossPlane.angleTo(zAxis);
            	var axisToRotate = new THREE.Vector3().crossVectors(nmlCrossPlane, zAxis).normalize();
                for (var i = 0; i < info.points.length; i++) {
                    var proj = getProjection(info.points[i], paramsCross.A, paramsCross.B,
                        paramsCross.C, paramsCross.D);
                    proj.applyAxisAngle(axisToRotate, angleToRotate);
                    log(proj)
                    projOnCrossPlane.push(proj);
                    _balls.remove(addABall(proj, 0x00ffff, 1));
                }
                var enclosingCircle = makeCircle(projOnCrossPlane);
                // log(enclosingCircle)
                var centerEnclosing = new THREE.Vector3(enclosingCircle.x, enclosingCircle.y, projOnCrossPlane[0].z);
                centerEnclosing.applyAxisAngle(axisToRotate, -angleToRotate);
                // rotateVectorTo(centerEnclosing, new THREE.Vector3(paramsCross.A, paramsCross.B,
                    // paramsCross.C));
                _balls.remove(addABall(centerEnclosing, 0x0000ff, 1.5));
                break;
            case 3:
                //
                break;
        }
    }

    // remove any temp visualization stuff
    setTimeout(function() {
        XAC.scene.remove(planeCross.m);
        XAC.scene.remove(planeNormal.m);
    }, 500);
};

//
MEDLEY.initPlacementWithSelection = function(info) {};
