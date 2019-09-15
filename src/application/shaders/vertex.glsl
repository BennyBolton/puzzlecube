#version 100


precision highp float;



uniform mat4 uProjection;

uniform vec3 uCenter;
uniform vec3 uVectorX;
uniform vec3 uVectorY;

uniform float uLightFade;


attribute vec2 aVertex;


varying vec2 vTexcoord;
varying float vFade;



void main() {
    vec3 point = uCenter + aVertex.x * uVectorX + aVertex.y * uVectorY;
    vec3 normal = normalize(cross(uVectorX, uVectorY));
    float cosine = max(-dot(normalize(point), normal), 0.0);

    vTexcoord = aVertex;
    vFade = 1.0 - uLightFade + uLightFade * cosine;

    gl_Position = uProjection * vec4(point, 1.0);
}
