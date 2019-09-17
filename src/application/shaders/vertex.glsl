#version 100


precision highp float;



uniform float uSize;
uniform mat4 uProjection;

uniform vec3 uCenter;
uniform mat3 uTransform;

uniform vec3 uAnimate;
uniform mat3 uAnimateTransform;

uniform float uLightFade;


attribute vec3 aPoint;
attribute vec3 aOffset;
attribute float aFace;
attribute float aColor;


varying vec4 vColor;
varying vec2 vTexcoord;



vec3 getNormal() {
    return
        aFace == 0.0 ? vec3(-1.0,  0.0,  0.0) :
        aFace == 1.0 ? vec3( 1.0,  0.0,  0.0) :
        aFace == 2.0 ? vec3( 0.0, -1.0,  0.0) :
        aFace == 3.0 ? vec3( 0.0,  1.0,  0.0) :
        aFace == 4.0 ? vec3( 0.0,  0.0, -1.0) :
        vec3( 0.0,  0.0,  1.0);
}



vec2 getTexCoord() {
    return
        aFace == 0.0 ? vec2(-aOffset.y, aOffset.z) :
        aFace == 1.0 ? vec2( aOffset.y, aOffset.z) :
        aFace == 2.0 ? vec2(-aOffset.z, aOffset.x) :
        aFace == 3.0 ? vec2( aOffset.z, aOffset.x) :
        aFace == 4.0 ? vec2(-aOffset.x, aOffset.y) :
        vec2( aOffset.x, aOffset.y);
}



vec4 getColor() {
    return
        aColor == 1.0 ? vec4(0.0, 0.0, 1.0, 1.0) :
        aColor == 2.0 ? vec4(0.0, 1.0, 0.0, 1.0) :
        aColor == 3.0 ? vec4(1.0, 1.0, 1.0, 1.0) :
        aColor == 4.0 ? vec4(1.0, 1.0, 0.0, 1.0) :
        aColor == 5.0 ? vec4(1.0, 0.5, 0.0, 1.0) :
        aColor == 6.0 ? vec4(1.0, 0.0, 0.0, 1.0) :
        vec4(0.0, 0.0, 0.0, 1.0);
}



int getSliceAxis() {
    if (aPoint.x == uSize) {
        return aPoint.y == uSize ? 2 : 1;
    } else {
        return aPoint.y == uSize ? 0 : -1;
    }
}



void main() {
    vec3 point = (aPoint + aOffset) / (uSize / 2.0) - 1.0;
    vec3 normal = getNormal();

    int sliceAxis = getSliceAxis();
    if (sliceAxis >= 0 && uAnimate[sliceAxis] < 0.0) {
        point = vec3(0.0, 0.0, 0.0);
    }

    bool useAnimation = (aPoint.x == uAnimate.x
        || aPoint.y == uAnimate.y
        || aPoint.z == uAnimate.z);

    if (useAnimation) {
        point = uCenter + uAnimateTransform * point;
        normal = uAnimateTransform * normal;
    } else {
        point = uCenter + uTransform * point;
        normal = uTransform * normal;
    }

    float cosine = max(-dot(normalize(point), normal), 0.0);
    float fade = 1.0 - uLightFade + uLightFade * cosine;
    vColor = vec4(fade, fade, fade, 1.0) * getColor();

    vTexcoord = getTexCoord();

    gl_Position = uProjection * vec4(point, 1.0);
}
