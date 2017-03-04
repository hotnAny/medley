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
    this._isDown = true;
    this._object = hit.object;
    this._strokePoints = [];
};

MEDLEY.PaintInput.prototype.mousemove = function(e) {
    if (this._isDown) {
        var hits = rayCast(e.clientX, e.clientY, [this._object]);
        for (var hit of hits) {
            this._strokePoints.push(hit.point);
            addABall(hit.point, this._colorPaint, this._radiusPaint);
        }
    }
};

MEDLEY.PaintInput.prototype.mouseup = function(e) {
    this._isDown = false;
    removeBalls();
};
